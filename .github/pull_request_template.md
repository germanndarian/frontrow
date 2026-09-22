<!--
Title: start with a conventional-commit type, then say what changed.
  feat: …   → "Features" in the Craft release notes
  fix: …    → "Fixes & improvements"
  anything else (chore:, docs:, ci:, refactor:, test:, perf:, style:) → "Other"
PRs are squash-merged, and the squash commit takes this title, so the title is
the line that appears in the release notes. Write it for a reader of those.
-->

## What changed

<!-- What a person using the site will notice, then anything a reviewer should know. -->

**Preview:** https://frontrow-git-BRANCH-germanndarians-projects.vercel.app/
<!-- The branch name with every "/" turned into "-"; point at the route that changed. -->

## Checks

- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm test`
- [ ] `npm run e2e`
- [ ] `npm run build`
- [ ] Needs a Supabase migration run by hand (say which, in `supabase/migrations/`)

## Release

Merging doesn't publish release notes. After merging, a version tag does:
`git tag vX.Y.Z && git push origin vX.Y.Z` — the "Release notes" workflow then
adds a card for every commit since the previous tag to Craft
(Frontrow > Patch Notes > Release Notes).

<!-- Written by Claude Code? End the body with:
🤖 Generated with [Claude Code](https://claude.com/claude-code) -->
