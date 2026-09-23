#!/usr/bin/env bash
# Prints the tag for the next release: the last v* tag bumped by what has been
# committed since it — the major for a breaking change ("feat!: …" or a
# BREAKING CHANGE footer), the minor for a feature, the patch for anything
# else. Prints nothing at all when there is nothing to release, so the caller
# can skip quietly.
#
# Run it by hand to see what the next merge would publish:
#   .github/scripts/next-version.sh
set -euo pipefail

# What the first release is called, if the repository has no v* tag yet.
FIRST="v1.0.0"

last="$(git describe --tags --abbrev=0 --match 'v[0-9]*' 2>/dev/null || true)"
if [[ -z "$last" ]]; then
  echo "$FIRST"
  exit 0
fi

# Merge commits don't carry a type and aren't released on their own.
subjects="$(git log --no-merges --format='%s' "$last..HEAD")"
[[ -n "$subjects" ]] || exit 0

if [[ ! "$last" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "::error::The last tag, $last, isn't a plain vX.Y.Z version, so the next one can't be worked out. Tag this release by hand." >&2
  exit 1
fi
major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
patch="${BASH_REMATCH[3]}"

if grep -qE '^[a-z]+(\([^)]*\))?!:' <<<"$subjects" ||
   git log --no-merges --format='%B' "$last..HEAD" | grep -qE '^BREAKING[ -]CHANGE'; then
  major=$((major + 1)); minor=0; patch=0
elif grep -qE '^feat(\([^)]*\))?:' <<<"$subjects"; then
  minor=$((minor + 1)); patch=0
else
  patch=$((patch + 1))
fi

echo "v$major.$minor.$patch"
