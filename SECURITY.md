# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report them privately via GitHub's security advisory feature:

1. Go to the [Security tab](https://github.com/audreysplim88-art/promptly/security) of this repo
2. Click **Report a vulnerability**
3. Fill in the details — what the issue is, how to reproduce it, and the potential impact

You can also email [audrey@hivekind.com](mailto:audrey@hivekind.com) directly.

I'll acknowledge reports within 48 hours and aim to resolve confirmed vulnerabilities within 14 days.

## What to look for

Areas worth scrutinising:

- **API route authentication** — the `/api/interview` and `/api/synthesize` routes are protected by a shared secret (`X-Promptly-Secret`). Issues with that mechanism are in scope.
- **Content script injection** — the extension injects a React overlay into AI tool pages via shadow DOM. Any cross-site scripting or page manipulation vectors are in scope.
- **Prompt injection** — the extension sends user-provided text to the Claude API. Issues where a crafted goal or answer could cause unintended backend behaviour are in scope.

## What is not in scope

- Issues that require physical access to a user's device
- Social engineering attacks

## Secrets and credentials

`.env.local` files are gitignored and should **never** be committed. If you find a secret accidentally committed in the git history, please report it privately so it can be rotated.
