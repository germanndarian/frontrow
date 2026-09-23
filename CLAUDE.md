@AGENTS.md

# Pull requests and releases

Before opening or merging a PR, follow PROJECT_GUIDE.md §8 and fill in
.github/pull_request_template.md. In short: the title starts with `feat:`,
`fix:` or another conventional type (the squash commit takes it, and the Craft
release notes group by it); the body has the Vercel preview URL and ends with
the Claude Code line; never merge without the maintainer's say-so. Merging
publishes the release notes by itself: CI green on `main` bumps the version
from the commit types, tags it, and adds the card to Craft.
