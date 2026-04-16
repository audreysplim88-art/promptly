# Building Promptly: A Human-AI Collaboration Timeline

## The premise

Promptly is a browser extension that helps people write better AI prompts. You type what you want in plain language, answer a few targeted interview questions, and get back an expert-engineered prompt you can paste — or auto-inject — straight into ChatGPT, Claude, Gemini, Perplexity, or Copilot.

I built the entire product in a single day, pair-programming with Claude Code (Anthropic's AI coding agent). This is the timeline of how that went.

---

## Phase 0 — Planning the architecture

Before writing a single line of code, I used Claude Code's plan mode to design the full system. We worked through:

- **Tech stack decisions** — Plasmo for the extension framework (React + TypeScript + Manifest V3), Next.js on Vercel for the backend, Claude API for the AI, Tailwind + shadcn/ui for styling.
- **The prompt engineering model** — We defined 6 dimensions every good prompt should cover (goal, context, audience, format, constraints, tone) and designed the interview system to extract them from the user.
- **Two core system prompts** — One for generating interview questions (domain detection, question type mixing, dimension coverage), one for synthesizing the final prompt (10 prompt engineering techniques applied systematically). These are the product's core IP.
- **A 4-phase roadmap** — Phase 1: core value (no auth, no payments, prove it works). Phases 2-4: auth, monetization, polish. We committed to shipping Phase 1 first and validating before building further.

The plan came out to roughly 400 lines covering monorepo structure, database schema, auth flow, textarea injection strategies per AI tool, and a publishing checklist for the Chrome Web Store.

---

## Phase 1 — Scaffolding and first build (~07:26)

**Commit: `33004d7` — Initial commit**

Claude Code scaffolded the full monorepo in one pass:
- Plasmo extension with a popup-based wizard (goal input, interview step, output step)
- Next.js backend with two streaming API routes (`/api/interview` and `/api/synthesize`)
- Shared TypeScript types across both apps
- Tailwind configuration for the extension UI

Within minutes of the first commit, we hit the first real problem: the web app's shared types were set up as a workspace dependency, which Vercel couldn't resolve during deployment.

**Commit: `6cd0c28` — Fix submodule reference**
**Commit: `67a79c5` — Inline shared types for Vercel**

Two quick fixes: removed the workspace dependency and inlined the shared types directly into the web app. The backend was live on Vercel.

---

## Phase 2 — From popup to overlay

The initial build used a browser extension popup (the small window that appears when you click the extension icon in the toolbar). This worked, but it felt disconnected — you had to click the icon, use the popup, copy the prompt, then go back to your AI tool and paste it.

We pivoted to a **Plasmo CSUI overlay** — a React component injected directly into AI tool pages via shadow DOM. This meant:
- A floating trigger button (indigo pencil icon) appears in the bottom-right corner of ChatGPT, Claude.ai, etc.
- Clicking it slides in a side panel with the full wizard
- The generated prompt can be injected directly into the page's textarea — no copy-paste needed

This was architecturally more complex. The shadow DOM provides CSS isolation (our Tailwind styles don't leak into the host page and vice versa), but it also means keyboard events can escape the shadow boundary. On pages like Claude.ai that capture all keystrokes at the document level, typing in our overlay inputs would get intercepted and blocked.

---

## Phase 3 — Chrome Web Store prep (~08:42)

**Commit: `41f08bd` — Add privacy policy**

Chrome Web Store requires a privacy policy URL. We generated one covering data collection (minimal — just the prompts sent to Claude API), storage practices, and third-party services.

**Commit: `2aa558c` — Add README and PRD**

Documentation for the repo: a README explaining the project and a full product requirements document.

---

## Phase 4 — Clean code review and hardening (~10:15–10:18)

With the core product working, I asked Claude Code to run a systematic code review against 12 clean code principles (meaningful names, SRP, DRY, type safety, error handling, etc.). It identified 10 findings across 3 priority levels. We fixed all of them in 8 commits over about 15 minutes:

### Dead code removal
**Commit: `b63e7da`** — The Plasmo starter template included a `content.tsx` that matched `<all_urls>` and injected a demo counter button on every website. With the Tailwind prefix removed (needed for our overlay to work), this button would render broken and unstyled on every page the user visited. Deleted both files.

### Silent failure fixes
**Commit: `b705ddc`** — "Insert into chat" would silently close the panel if it couldn't find the AI tool's textarea. Now it shows an error message suggesting the clipboard instead.

**Commit: `9f9a473`** — "Copy to clipboard" had no feedback and no error handling. Added a "Copied!" confirmation state and a fallback error message.

### Resilience
**Commit: `e8076a4`** — If the Claude API dropped mid-stream during prompt generation, the SSE connection would just end, leaving the user with a truncated prompt and no indication anything went wrong. Added error event propagation so the client can show "Stream interrupted — please try again."

### Security
**Commit: `a898127`** — The API routes were completely open. Since content scripts run on the host page's origin (not `chrome-extension://`), we can't restrict by origin. Added a shared secret (`X-Promptly-Secret` header) that the extension sends with every request and the backend validates. Created `.env.local.example` templates documenting the setup.

### Type safety
**Commit: `bf9fa0b`** — `DOMAIN_LABELS` and `DOMAIN_COLORS` were typed as `Record<string, string>`, so typos like `domains["technicall"]` would compile silently. Changed to `Record<Domain, string>` for compile-time checks.

**Commit: `0fddad8`** — The synthesize route accepted `domain: string` in its request body and passed it through unchecked. Tightened to `Domain` union type across the full path.

### Cleanup
**Commit: `4e53f18`** — Removed the deprecated `onKeyPress` event handler, keeping only `onKeyDown` and `onKeyUp` for keyboard event isolation.

---

## Phase 5 — API secret deployment (~10:18–14:26)

With the code committed, we walked through deploying the shared secret:
1. Generated a 256-bit hex secret with `openssl rand -hex 32`
2. Added it as `PROMPTLY_API_SECRET` in Vercel's environment variables
3. Added the matching value as `PLASMO_PUBLIC_API_SECRET` in the extension's `.env.local`
4. Rebuilt the extension

**Commit: `4e28076` — Merge PR #1**

All 8 fixes merged to main via the project's first pull request.

---

## What Claude Code did well

- **Architectural planning** — The plan mode session produced a comprehensive, opinionated design document that we followed throughout the build. Having the tech stack, monorepo structure, auth flow, and deployment strategy decided upfront meant almost no backtracking.
- **Cross-file consistency** — When adding the API secret, Claude Code updated both API routes, the client fetch wrapper, the constants file, and created example env files — all in one pass, all consistent.
- **Systematic review** — The clean code review wasn't just "looks fine." It caught a real bug (the template files injecting broken UI on every website), two silent failure paths that would have confused users, and a security gap.
- **Incremental commits** — Each fix was a separate, well-described commit. Easy to review, easy to revert individually if needed.

## What required human judgment

- **The pivot from popup to overlay** — This was a product decision driven by UX intuition, not something that emerged from the code.
- **Prompt engineering quality** — The system prompts (interview generation and prompt synthesis) required iteration and domain expertise to get right. The 6-dimension model, the domain-specific question rules, the 10 synthesis techniques — these are the product's core value and needed human craft.
- **Deployment decisions** — When to deploy, what to test manually, whether to replace an already-set secret with a new one — these required understanding the full context beyond the codebase.
- **Knowing when to stop** — Phase 1 is deliberately minimal. No auth, no payments, no prompt history. The temptation to add "just one more thing" is real; shipping requires a human saying "this is enough for now."

---

## By the numbers

- **Time**: ~7 hours from first commit to merged PR
- **Commits**: 14 (including the merge)
- **Files changed**: ~25 across the extension and web app
- **Lines of code**: ~2,000 (extension) + ~500 (backend) + system prompts
- **AI tools supported**: 6 (ChatGPT, Claude, Gemini, Perplexity, Copilot, plus a general fallback)
- **Pull requests**: 1

---

*This timeline covers the technical collaboration. For the product thinking, design decisions, and what I'd do differently, see the companion post.*
