#!/usr/bin/env bash
# Publishes a release's notes to Craft, in the "Release Notes" document in
# "Frontrow > Patch Notes": a card built from the "Release Page Template",
# inserted at the top, with the previous "Latest - Version X.Y.Z" card renamed
# to "Version X.Y.Z". API calls follow the Craft Space API documentation
# (GET /folders, GET /documents, GET /blocks, POST /blocks, PUT /blocks).
#
# Env: CRAFT_API_BASE, CRAFT_API_KEY  — the API link and its token (secrets)
#      TAG      — the release tag, e.g. v1.2.0 (default: the latest v* tag)
#      DRY_RUN  — "true" reads everything and prints what would change
#      GITHUB_SERVER_URL, GITHUB_REPOSITORY — set by GitHub Actions
set -euo pipefail

NOTES_FOLDER_PARENT="Frontrow"
NOTES_FOLDER="Patch Notes"
NOTES_DOC="Release Notes"
TEMPLATE_DOC="Release Page Template"

fail() {
  echo "::error::$*" >&2
  exit 1
}

: "${CRAFT_API_BASE:?CRAFT_API_BASE is not set}"
: "${CRAFT_API_KEY:?CRAFT_API_KEY is not set}"
DRY_RUN="${DRY_RUN:-false}"
API="${CRAFT_API_BASE%/}"
REPO_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is not set}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# The token goes to curl through a private config file, so it never appears on
# a command line or in any output. (Actions masks the secret in logs as well.)
curl_config="$(mktemp)"
response="$(mktemp)"
trap 'rm -f "$curl_config" "$response"' EXIT
chmod 600 "$curl_config"
printf 'header = "Authorization: Bearer %s"\n' "$CRAFT_API_KEY" >"$curl_config"

# craft METHOD PATH [JSON_BODY] — prints the response body; fails the job on a
# network error or any non-2xx status, naming the call but never the token.
craft() {
  local method="$1" path="$2" body="${3:-}" status
  local args=(--silent --show-error --config "$curl_config" --request "$method"
    --header "Accept: application/json" --output "$response" --write-out '%{http_code}')
  if [[ -n "$body" ]]; then
    args+=(--header "Content-Type: application/json" --data-binary "$body")
  fi
  status="$(curl "${args[@]}" "$API$path")" || fail "Craft API $method $path: the request failed before a response came back."
  if [[ "$status" != 2?? ]]; then
    fail "Craft API $method $path returned HTTP $status: $(head -c 600 "$response" | tr '\n' ' ')"
  fi
  cat "$response"
}

uri() { jq -rn --arg v "$1" '$v | @uri'; }

# ── The release ──────────────────────────────────────────────────────────

TAG="${TAG:-}"
if [[ -z "$TAG" ]]; then
  TAG="$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null)" || fail "No v* tag found, and none was given."
fi
git rev-parse --verify --quiet "refs/tags/$TAG" >/dev/null || fail "Tag $TAG doesn't exist in this checkout."
version="${TAG#v}"
date="$(date -u +%F)"

if prev_tag="$(git describe --tags --abbrev=0 --match 'v*' "$TAG^" 2>/dev/null)"; then
  range="$prev_tag..$TAG"
  compare_url="$REPO_URL/compare/$prev_tag...$TAG"
else
  # The first release: everything up to the tag.
  prev_tag=""
  range="$TAG"
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

# ── Where it goes in Craft ───────────────────────────────────────────────

folders="$(craft GET /folders)"
folder_id="$(jq -r --arg parent "$NOTES_FOLDER_PARENT" --arg name "$NOTES_FOLDER" '
  def walk_folders($parent): .[] | . as $f
    | ({ id: $f.id, name: $f.name, parent: $parent }, ($f.folders // [] | walk_folders($f.name)));
  [ .items | walk_folders(null) | select(.name == $name and .parent == $parent) | .id ] | first // empty
' <<<"$folders")"
[[ -n "$folder_id" ]] || fail "Craft folder \"$NOTES_FOLDER_PARENT > $NOTES_FOLDER\" not found."

notes_id="$(craft GET "/documents?folderId=$(uri "$folder_id")" |
  jq -r --arg t "$NOTES_DOC" '[ .items[] | select(.title == $t) | .id ] | first // empty')"
[[ -n "$notes_id" ]] || fail "Craft document \"$NOTES_DOC\" not found in \"$NOTES_FOLDER_PARENT > $NOTES_FOLDER\"."

# Templates live in the Templates location, but the template may sit in any
# folder, so fall back to every document.
template_id="$(craft GET "/documents?location=templates" |
  jq -r --arg t "$TEMPLATE_DOC" '[ .items[] | select(.title == $t) | .id ] | first // empty')"
if [[ -z "$template_id" ]]; then
  template_id="$(craft GET /documents |
    jq -r --arg t "$TEMPLATE_DOC" '[ .items[] | select(.title == $t) | .id ] | first // empty')"
fi
[[ -n "$template_id" ]] || fail "Craft template document \"$TEMPLATE_DOC\" not found."

# The release cards already in the document: the one to rename, and a guard
# against publishing the same version twice.
notes="$(craft GET "/blocks?id=$(uri "$notes_id")&maxDepth=1")"
cards="$(jq -c '[ .content[]? | select(.type == "page") | { id, title: (.markdown // "" | gsub("^\\s+|\\s+$"; "")) } ]' <<<"$notes")"
if jq -e --arg v "$version" 'any(.[]; .title == "Latest - Version \($v)" or .title == "Version \($v)")' <<<"$cards" >/dev/null; then
  fail "\"$NOTES_DOC\" already has a card for version $version. Delete it in Craft first to publish it again."
fi
previous="$(jq -c '[ .[] | select(.title | startswith("Latest - Version ")) ]' <<<"$cards")"

# ── The card ─────────────────────────────────────────────────────────────

template="$(craft GET "/blocks?id=$(uri "$template_id")")"
card="$(jq -c --arg version "$version" --arg date "$date" --arg compare_url "$compare_url" \
  --argjson groups "$groups" -f "$here/craft-release-card.jq" <<<"$template" 2>&1)" ||
  fail "Couldn't fill in \"$TEMPLATE_DOC\": $card"

# Directly above the current latest card, so anything above the cards stays on
# top; at the very top when there's no release yet.
position="$(jq -c --arg doc "$notes_id" '
  if length > 0 then { position: "before", siblingId: .[0].id } else { position: "start", pageId: $doc } end
' <<<"$previous")"
insert="$(jq -c -n --argjson card "$card" --argjson position "$position" '{ blocks: [$card], position: $position }')"
renames="$(jq -c '{ blocks: [ .[] | { id, markdown: (.title | sub("^Latest - "; "")) } ] }' <<<"$previous")"

if [[ "$DRY_RUN" == "true" ]]; then
  echo
  echo "── Dry run: nothing in Craft is changed ──"
  echo
  echo "Would insert into \"$NOTES_DOC\" ($(jq -r '.position' <<<"$position")):"
  jq . <<<"$insert"
  echo
  if [[ "$(jq '.blocks | length' <<<"$renames")" -gt 0 ]]; then
    echo "Would rename:"
    jq -r --argjson prev "$previous" '.blocks[] as $b | ($prev[] | select(.id == $b.id) | .title) + "  →  " + $b.markdown' <<<"$renames"
  else
    echo "Nothing to rename: no \"Latest - Version\" card yet."
  fi
  exit 0
fi

inserted="$(craft POST /blocks "$insert")"
echo "Inserted \"$(jq -r '.markdown' <<<"$card")\" ($(jq -r '.items[0].id // "?"' <<<"$inserted"))."

if [[ "$(jq '.blocks | length' <<<"$renames")" -gt 0 ]]; then
  # In a subshell, so a failed call reaches the hint below instead of ending the job first.
  (craft PUT /blocks "$renames" >/dev/null) ||
    fail "The new card is in, but renaming the previous \"Latest\" card failed — rename it by hand."
  jq -r '.blocks[] | "Renamed the previous card to \"\(.markdown)\"."' <<<"$renames"
fi
