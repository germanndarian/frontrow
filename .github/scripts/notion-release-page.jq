# Turns the "Release Page Template" page into the page for one release.
#
# Input: the template's blocks, as GET /blocks/{id}/children returns them,
#        each block's own blocks under .children (JSON array).
# Args:  $version, $date, $compare_url  (strings)
#        $groups  {features: [..], fixes: [..], other: [..]} — commit messages
#
# Output: {title, children, skipped} — the page title, the blocks ready for
# POST /pages, and the block types left out because the API can't create them
# (Notion-hosted files, sub-pages, databases, synced blocks).
#
# The release page is the template's sub-page titled with {{version}} when it
# has one ("Latest - Version {{version}}"); otherwise the whole template, titled
# "Latest - Version {{version}}". A placeholder becomes one bullet per commit,
# carrying the placeholder's formatting. An empty group takes its placeholder,
# its heading and the divider above the heading with it.

def is_heading: .type | test("^heading_");

def skip_types: ["child_page", "child_database", "synced_block", "link_preview",
  "unsupported", "template", "meeting_notes", "transcription"];

# Notion-hosted files come back as URLs that expire within the hour, and the
# API can only create files from an external link.
def skipped:
  (.type | IN(skip_types[]))
  or ((.type | IN("image", "file", "pdf", "video", "audio")) and (.[.type].type != "external"));

def block_text: [ .[.type].rich_text[]?.plain_text ] | join("");

# Rich text as the API accepts it: mentions and equations become their text.
def rich_text:
  map({
    type: "text",
    text: ({ content: (if .type == "text" then .text.content else .plain_text end) }
      + (if (.text.link // null) != null then { link: .text.link }
         elif (.href // null) != null then { link: { url: .href } }
         else {} end)),
    annotations: (.annotations // {})
  });

# A block as POST /pages takes it: the type's own fields, the read-only ones
# (ids, timestamps, authors, parent) gone, and its blocks nested inside.
def writable:
  .type as $t
  | (.children // [] | map(select(skipped | not) | writable)) as $kids
  | (.[$t]
      | with_entries(
          if .key == "rich_text" or .key == "caption" then .value |= rich_text
          elif .key == "cells" then .value |= map(rich_text)
          else . end)
      | if (.icon.type // "") | IN("file", "custom_emoji", "file_upload") then del(.icon) else . end
    ) as $body
  | { object: "block", type: $t, ($t): ($body + (if ($kids | length) > 0 then { children: $kids } else {} end)) };

def depth: 1 + ([ .[.type].children[]? | depth ] | max // 0);

def fill_section($name; $items):
  . as $blocks
  | ("{{" + $name + "}}") as $tag
  | ([ $blocks | to_entries[] | select(.value | block_text | contains($tag)) | .key ] | first) as $i
  | if $i == null then
      error("The template has no " + $tag + " placeholder.")
    elif ($items | length) > 0 then
      $blocks[$i] as $p
      | ($p[$p.type].rich_text[0].annotations // {}) as $look
      | $blocks[:$i]
      + ($items | map({
          object: "block", type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [ { type: "text", text: { content: . }, plain_text: ., annotations: $look } ],
            color: ($p[$p.type].color // "default")
          }
        }))
      + $blocks[$i + 1:]
    else
      # Empty group: drop the placeholder, the heading above it, and the
      # divider above the heading.
      ([$i]
        + (if $i >= 1 and ($blocks[$i - 1] | is_heading) then [$i - 1] else [] end)
        + (if $i >= 2 and ($blocks[$i - 1] | is_heading) and $blocks[$i - 2].type == "divider"
           then [$i - 2] else [] end)
      ) as $drop
      | [ $blocks | to_entries[] | select(.key as $k | ($drop | index($k)) == null) | .value ]
    end;

def fill: walk(
  if type == "string" then
    gsub("\\{\\{version\\}\\}"; $version)
    | gsub("\\{\\{date\\}\\}"; $date)
    | gsub("\\{\\{compare_url\\}\\}"; $compare_url)
  else . end);

([ .[] | select(.type == "child_page" and (.child_page.title | contains("{{version}}"))) ] | first) as $card
| (if $card then { title: $card.child_page.title, blocks: ($card.children // []) }
   else { title: "Latest - Version {{version}}", blocks: . } end) as $page
| $page.blocks
| fill_section("features"; $groups.features)
| fill_section("fixes"; $groups.fixes)
| fill_section("other"; $groups.other)
| { title: $page.title,
    skipped: [ .. | objects | select(has("type") and has("id")) | select(skipped) | .type ] | unique,
    children: map(select(skipped | not) | writable) }
| if any(.children[]; depth > 3) then
    error("The template nests blocks more than three deep (a toggle in a toggle in a toggle), which one Notion request can't create. Flatten it a level.")
  else . end
| fill
