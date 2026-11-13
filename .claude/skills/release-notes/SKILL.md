---
name: release-notes
description: Use when asked how a Frontrow release is published, what version the next merge will get, why release notes or a git tag did not appear in Notion, how to dry-run the release workflow, or when editing `.github/workflows/release-notes.yml` or `.github/scripts/`.
---

# Release notes

Nobody starts a release. After a squash merge, when the `CI` workflow succeeds on `main`, `.github/workflows/release-notes.yml` runs `.github/scripts/next-version.sh`, tags the commit CI tested, writes a page under "Release Notes" in Notion (`notion-release-notes.sh` with `notion-release-page.jq`), then pushes the tag.

## Version bump (from commit subjects since the last `v*` tag)

- Major: `type!:` subject or a `BREAKING CHANGE` footer.
- Minor: `feat:`.
- Patch: anything else (`fix:`, `docs:`, `chore:` ...).
- No commits since the last tag: nothing is published.

So the PR title decides it. It becomes the squash commit and the line in the notes: `feat:` goes to "Features", `fix:` to "Fixes & improvements", the rest to "Other".

## See what the next merge would publish

```bash
.github/scripts/next-version.sh
```

## Dry run (writes nothing to Notion)

```bash
gh workflow run release-notes.yml -f dry_run=true
gh workflow run release-notes.yml -f dry_run=true -f tag=v1.2.3   # preview a tag that does not exist yet
```

A manual run with `dry_run=false`, or pushing a `v*` tag by hand, publishes that version.

## Gotchas

- Secret `NOTION_TOKEN` is required (repo secret, both Notion pages shared with the integration). Optional repo variables `NOTION_NOTES_PAGE_ID` and `NOTION_TEMPLATE_PAGE_ID` pin the pages. Never print or commit the token.
- A red `main` publishes nothing. A Notion failure leaves no tag, so re-running publishes the same version.
- If the last tag is not plain `vX.Y.Z`, the script errors and the tag must be made by hand.
- Releases are not part of PR work: do not tag or run non-dry workflows unless asked.

## Check it worked

The dry-run log names the tag and what it would write: `gh run list --workflow release-notes.yml --limit 1`, then `gh run view <id> --log | tail -40`.
