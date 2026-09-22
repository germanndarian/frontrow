# Turns the "Release Page Template" document into the card for one release.
#
# Input: the template document as GET /blocks returns it (JSON).
# Args:  $version, $date, $compare_url  (strings)
#        $groups  {features: [..], fixes: [..], other: [..]} — commit messages
#
# Output: the card block, ready for POST /blocks — the template's own blocks
# with their styles (card layout, headings, separator lines), the ids removed
# so Craft assigns new ones, and the placeholders filled in. A placeholder
# becomes one bullet per commit, carrying the placeholder block's styling. An
# empty group takes its placeholder, its heading and the separator line above
# the heading with it.

# The block at $i is a heading: an h1–h4 text style, or markdown opening with #.
def is_heading: (.textStyle // "" | test("^h[1-4]$")) or ((.markdown // "") | test("^#"));

def fill_section($name; $items):
  . as $blocks
  | ("{{" + $name + "}}") as $tag
  | ([ $blocks | to_entries[] | select((.value.markdown // "") | contains($tag)) | .key ] | first) as $i
  | if $i == null then
      error("The template card has no " + $tag + " placeholder.")
    elif ($items | length) > 0 then
      $blocks[:$i]
      + ($items | map($blocks[$i] + {listStyle: "bullet", markdown: ("- " + .)}))
      + $blocks[$i + 1:]
    else
      # Empty group: drop the placeholder, the heading above it, and the
      # separator line above the heading.
      ([$i]
        + (if $i >= 1 and ($blocks[$i - 1] | is_heading) then [$i - 1] else [] end)
        + (if $i >= 2 and ($blocks[$i - 1] | is_heading) and $blocks[$i - 2].type == "line"
           then [$i - 2] else [] end)
      ) as $drop
      | [ $blocks | to_entries[] | select(.key as $k | ($drop | index($k)) == null) | .value ]
    end;

# The card is the page whose title carries {{version}}.
([ .. | objects | select(.type == "page" and ((.markdown // "") | contains("{{version}}"))) ] | first)
| if . == null then
    error("The template has no card page titled with {{version}}, e.g. \"Latest - Version {{version}}\".")
  else . end
| walk(if type == "object" then del(.id) else . end)
| .content |= (
    (. // [])
    | fill_section("features"; $groups.features)
    | fill_section("fixes"; $groups.fixes)
    | fill_section("other"; $groups.other)
  )
| walk(
    if type == "string" then
      gsub("\\{\\{version\\}\\}"; $version)
      | gsub("\\{\\{date\\}\\}"; $date)
      | gsub("\\{\\{compare_url\\}\\}"; $compare_url)
    else . end
  )
