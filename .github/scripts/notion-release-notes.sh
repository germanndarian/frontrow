#!/usr/bin/env bash
# Publishes a release's notes to Notion, under the "Release Notes" page: a
# sub-page built from the "Release Page Template" page, added above the other
# release pages, with the previous "Latest - Version X.Y.Z" page renamed to
# "Version X.Y.Z". API calls follow the Notion API reference (POST /search,
# GET /pages, GET /blocks/{id}/children, POST /pages, PATCH /pages,
# PATCH /blocks/{id}/children).
#
# Env: NOTION_TOKEN — an internal integration's secret, with both pages shared
#                     with the integration (Notion: page ⋯ → Connections)
#      NOTION_NOTES_PAGE_ID, NOTION_TEMPLATE_PAGE_ID — optional: the pages by
#                     id, when looking them up by name finds the wrong one
#      TAG      — the release tag, e.g. v1.2.0 (default: the latest v* tag)
#      DRY_RUN  — "true" reads everything and prints what would change
#      GITHUB_SERVER_URL, GITHUB_REPOSITORY — set by GitHub Actions
set -euo pipefail
# A failed call inside $(...) ends the job too, not just that subshell.
shopt -s inherit_errexit

NOTES_PAGE="Release Notes"
NOTES_PARENT="Patch Notes"
TEMPLATE_PAGE="Release Page Template"
NOTION_VERSION="2026-03-11"
API="https://api.notion.com/v1"

fail() {
  echo "::error::$*" >&2
  exit 1
}

: "${NOTION_TOKEN:?NOTION_TOKEN is not set}"
# A token pasted with a line break or a stray space would break the header.
NOTION_TOKEN="${NOTION_TOKEN//[[:space:]]/}"
DRY_RUN="${DRY_RUN:-false}"
REPO_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is not set}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# The token goes to curl through a private config file, so it never appears on
# a command line or in any output. (Actions masks the secret in logs as well.)
curl_config="$(mktemp)"
response="$(mktemp)"
headers="$(mktemp)"
trap 'rm -f "$curl_config" "$response" "$headers"' EXIT
chmod 600 "$curl_config"
printf 'header = "Authorization: Bearer %s"\n' "$NOTION_TOKEN" >"$curl_config"

# notion METHOD PATH [JSON_BODY] — prints the response body; fails the job on a
# network error or any non-2xx status, naming the call but never the token.
# Notion allows about three requests a second, so a 429 waits and tries again.
notion() {
  local method="$1" path="$2" body="${3:-}" status attempt
  local args=(--silent --show-error --config "$curl_config" --request "$method"
    --header "Accept: application/json" --header "Notion-Version: $NOTION_VERSION"
    --dump-header "$headers" --output "$response" --write-out '%{http_code}')
  if [[ -n "$body" ]]; then
    args+=(--header "Content-Type: application/json" --data-binary "$body")
  fi
  for attempt in 1 2 3 4 5; do
    status="$(curl "${args[@]}" "$API$path")" || fail "Notion API $method $path: the request failed before a response came back."
    [[ "$status" == 429 ]] || break
    sleep "$(awk -F': *' 'tolower($1) == "retry-after" { print $2 + 0 }' "$headers" | tail -n 1 | grep . || echo 1)"
  done
  if [[ "$status" != 2?? ]]; then
    fail "Notion API $method $path returned HTTP $status: $(head -c 600 "$response" | tr '\n' ' ')"
  fi
  cat "$response"
}

# ── The release ──────────────────────────────────────────────────────────

TAG="${TAG:-}"
TAG="${TAG#"${TAG%%[![:space:]]*}"}"   # trim leading and trailing spaces
TAG="${TAG%"${TAG##*[![:space:]]}"}"
if [[ -z "$TAG" ]]; then
  TAG="$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null)" ||
    fail "No v* tag found and none was given. For a dry run, name the tag to preview, e.g. v1.0.0."
fi
# A dry run may preview a tag that doesn't exist yet: the release as it would
# be if the current commit were tagged now.
ref="refs/tags/$TAG"
if ! git rev-parse --verify --quiet "$ref" >/dev/null; then
  [[ "$DRY_RUN" == "true" ]] || fail "Tag $TAG doesn't exist in this checkout."
  ref="HEAD"
  echo "Tag $TAG doesn't exist yet: previewing it as if the current commit were tagged $TAG."
fi
[[ "$TAG" =~ ^v[0-9]+(\.[0-9]+)*([-+][0-9A-Za-z.-]+)?$ ]] ||
  fail "\"$TAG\" doesn't look like a version tag. Use v1.2.0 — the workflow triggers on v* tags."
version="${TAG#v}"
date="$(date -u +%F)"

if prev_tag="$(git describe --tags --abbrev=0 --match 'v*' "$ref^" 2>/dev/null)"; then
  range="$prev_tag..$ref"
  compare_url="$REPO_URL/compare/$prev_tag...$TAG"
else
  # The first release: everything up to the tag.
  prev_tag=""
  range="$ref"
  compare_url="$REPO_URL/commits/$TAG"
fi

# Commit subjects since the previous tag, merge commits skipped, grouped by
# conventional-commit type with the prefix ("feat(api)!: ") stripped.
groups="$(git log --no-merges --format='%s' "$range" | jq -R -s -c '
  def kind: (capture("^(?<type>[a-z]+)(\\([^)]*\\))?!?:\\s*").type // "");
  def strip: sub("^[a-z]+(\\([^)]*\\))?!?:\\s*"; "");
  split("\n") | map(select(test("\\S")))
  | { features: map(select(kind == "feat") | strip),
      fixes:    map(select(kind == "fix") | strip),
      other:    map(select(kind != "feat" and kind != "fix") | strip) }')"

echo "Release $TAG (version $version, $date), ${prev_tag:-first release}: $range"
jq -r '"  features: \(.features | length)   fixes: \(.fixes | length)   other: \(.other | length)"' <<<"$groups"

# ── Where it goes in Notion ──────────────────────────────────────────────

# A page's title, whatever its title property is called.
page_title='def page_title: [ .properties[]? | select(.type == "title") | .title[]?.plain_text ] | join("");'
# Names are matched without regard to case or surrounding spaces, so a title
# typed with a stray space in Notion still matches.
clean='def clean: (. // "") | ascii_downcase | gsub("^\\s+|\\s+$"; "");'

# find_page TITLE [PARENT_TITLE] — the id of the page with that title among the
# pages shared with the integration. More than one, and the one under
# PARENT_TITLE wins.
find_page() {
  local title="$1" parent="${2:-}" found ids id parent_id
  found="$(notion POST /search "$(jq -c -n --arg q "$title" \
    '{ query: $q, filter: { property: "object", value: "page" }, page_size: 100 }')")"
  ids="$(jq -r --arg t "$title" "$page_title $clean"'
    [ .results[] | select((page_title | clean) == ($t | clean)) | .id ] | .[]' <<<"$found")"
  if [[ -z "$ids" ]]; then
    fail "Notion page \"$title\" not found. Pages shared with the integration that match the search: $(jq -r "$page_title"'
      [ .results[] | "\"" + (page_title | if . == "" then "(untitled)" else . end) + "\"" ]
      | if length == 0 then "(none — share the page with the integration: ⋯ → Connections)" else join(", ") end' <<<"$found")"
  fi
  if [[ "$(wc -l <<<"$ids")" -gt 1 && -n "$parent" ]]; then
    while read -r id; do
      parent_id="$(jq -r --arg id "$id" '.results[] | select(.id == $id) | .parent.page_id // empty' <<<"$found")"
      [[ -n "$parent_id" ]] || continue
      if jq -e --arg p "$parent" "$page_title $clean"'(page_title | clean) == ($p | clean)' \
        <<<"$(notion GET "/pages/$parent_id")" >/dev/null; then
        echo "$id"
        return
      fi
    done <<<"$ids"
  fi
  head -n 1 <<<"$ids"
}

# children ID — every block directly inside a page or block, all result pages.
children() {
  local id="$1" cursor="" page all="[]"
  while :; do
    page="$(notion GET "/blocks/$id/children?page_size=100${cursor:+&start_cursor=$cursor}")"
    all="$(jq -c --argjson page "$page" '. + $page.results' <<<"$all")"
    [[ "$(jq -r '.has_more' <<<"$page")" == "true" ]] || break
    cursor="$(jq -r '.next_cursor' <<<"$page")"
  done
  echo "$all"
}

# tree ID — the blocks inside ID, each with its own blocks under .children.
tree() {
  local blocks child kids
  blocks="$(children "$1")"
  while read -r child; do
    [[ -n "$child" ]] || continue
    kids="$(tree "$child")"
    blocks="$(jq -c --arg id "$child" --argjson kids "$kids" \
      'map(if .id == $id then .children = $kids else . end)' <<<"$blocks")"
  done < <(jq -r '.[] | select(.has_children and .type != "child_database") | .id' <<<"$blocks")
  echo "$blocks"
}

notes_id="${NOTION_NOTES_PAGE_ID:-$(find_page "$NOTES_PAGE" "$NOTES_PARENT")}"
template_id="${NOTION_TEMPLATE_PAGE_ID:-$(find_page "$TEMPLATE_PAGE")}"
echo "Notion: page \"$NOTES_PAGE\" $notes_id, template \"$TEMPLATE_PAGE\" $template_id"

# The release pages already there: the one to rename, and a guard against
# publishing the same version twice.
notes="$(children "$notes_id")"
cards="$(jq -c '[ .[] | select(.type == "child_page") | { id, title: (.child_page.title | gsub("^\\s+|\\s+$"; "")) } ]' <<<"$notes")"
if jq -e --arg v "$version" 'any(.[]; .title == "Latest - Version \($v)" or .title == "Version \($v)")' <<<"$cards" >/dev/null; then
  fail "\"$NOTES_PAGE\" already has a page for version $version. Delete it in Notion first to publish it again."
fi
previous="$(jq -c '[ .[] | select(.title | startswith("Latest - Version ")) ]' <<<"$cards")"

# ── The page ─────────────────────────────────────────────────────────────

template="$(tree "$template_id")"
card="$(jq -c --arg version "$version" --arg date "$date" --arg compare_url "$compare_url" \
  --argjson groups "$groups" -f "$here/notion-release-page.jq" <<<"$template" 2>&1)" ||
  fail "Couldn't fill in \"$TEMPLATE_PAGE\": $card"
jq -r '.skipped[] | "::warning::The template has a block of type \(.), which the Notion API can'"'"'t copy; the release page leaves it out."' <<<"$card"

# Directly above the current latest page, so anything above the release pages
# stays on top; at the very top when there's no release yet.
position="$(jq -c --argjson prev "$previous" '
  (map(.id) | index($prev[0].id // "")) as $i
  | if $i == null or $i == 0 then { type: "page_start" }
    else { type: "after_block", after_block: { id: .[$i - 1].id } } end
' <<<"$notes")"
# A request takes 100 blocks; the rest are appended afterwards.
create="$(jq -c --arg parent "$notes_id" --argjson position "$position" '{
  parent: { page_id: $parent },
  properties: { title: { title: [ { type: "text", text: { content: .title } } ] } },
  children: .children[:100],
  position: $position
}' <<<"$card")"

if [[ "$DRY_RUN" == "true" ]]; then
  echo
  echo "── Dry run: nothing in Notion is changed ──"
  echo
  echo "Would create under \"$NOTES_PAGE\" ($(jq -r '.type' <<<"$position")):"
  jq '.title, .children' <<<"$card"
  echo
  if [[ "$(jq 'length' <<<"$previous")" -gt 0 ]]; then
    echo "Would rename:"
    jq -r '.[] | .title + "  →  " + (.title | sub("^Latest - "; ""))' <<<"$previous"
  else
    echo "Nothing to rename: no \"Latest - Version\" page yet."
  fi
  exit 0
fi

page_id="$(notion POST /pages "$create" | jq -r '.id')"
echo "Created \"$(jq -r '.title' <<<"$card")\" ($page_id)."

total="$(jq '.children | length' <<<"$card")"
for ((from = 100; from < total; from += 100)); do
  (notion PATCH "/blocks/$page_id/children" "$(jq -c --argjson from "$from" '{ children: .children[$from:$from + 100] }' <<<"$card")" >/dev/null) ||
    fail "The release page is in, but adding its blocks past the first $from failed — finish it by hand."
done

while read -r prev; do
  [[ -n "$prev" ]] || continue
  name="$(jq -r '.title | sub("^Latest - "; "")' <<<"$prev")"
  # In a subshell, so a failed call reaches the hint below instead of ending the job first.
  (notion PATCH "/pages/$(jq -r '.id' <<<"$prev")" "$(jq -c -n --arg name "$name" \
    '{ properties: { title: { title: [ { type: "text", text: { content: $name } } ] } } }')" >/dev/null) ||
    fail "The new page is in, but renaming the previous \"Latest\" page failed — rename it by hand."
  echo "Renamed the previous page to \"$name\"."
done < <(jq -c '.[]' <<<"$previous")
