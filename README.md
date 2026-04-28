# Promptly

> Craft better AI prompts through a quick expert interview — works on ChatGPT, Claude, Gemini, Perplexity, and Copilot.

![Promptly panel showing the interview flow](store-assets/screenshots/2-interview-questions.png)

## What it does

Most people get poor results from AI tools because they write vague, context-free prompts. Promptly fixes this by acting as a prompt engineer on your behalf.

1. Click the **Promptly button** (bottom-right of any supported AI tool page)
2. Choose your **output style** — Standard, Concise, or Developer
3. Describe your goal in plain language — *"I want to clean my deck for summer"* or *"Add dark mode to my React app"*
4. Answer 4–6 targeted interview questions about your context, constraints, and desired format
5. Promptly generates a polished, expert-quality prompt and **inserts it directly into the AI tool's text box**

Works for everyday tasks (cooking, home projects, emails) and technical ones (architecture decisions, code features, debugging).

### Output styles

| Style | Best for | Length |
|---|---|---|
| **Standard** | Most tasks — full 10-technique prompt engineering | 100–250 words |
| **Concise** | Repeat users, simple tasks — same quality, fewer tokens | 60–120 words |
| **Developer** | AI coding tools (Cursor, Copilot, Claude Code) — direct imperatives, no fluff | 60–120 words |

## Supported AI tools

- ChatGPT (chat.openai.com / chatgpt.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Perplexity (perplexity.ai)
- Microsoft Copilot (copilot.microsoft.com)

## Tech stack

| Layer | Technology |
|---|---|
| Browser extension | [Plasmo](https://plasmo.com) (React, TypeScript, MV3) |
| Backend API | Next.js 16 on Vercel |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Styling | Tailwind CSS |
| State | Zustand |

## Project structure

```
promptly/
├── apps/
│   ├── extension/        # Plasmo Chrome/Firefox extension
│   │   ├── src/
│   │   │   ├── contents/overlay.tsx   # Main in-page panel (CSUI)
│   │   │   ├── background/index.ts    # Service worker
│   │   │   ├── popup.tsx              # Toolbar popup
│   │   │   └── ...
│   └── web/              # Next.js backend
│       ├── app/api/
│       │   ├── interview/route.ts     # Generates interview questions
│       │   └── synthesize/route.ts   # Generates the final prompt
│       └── lib/prompts/              # Claude system prompts
├── packages/
│   └── shared/           # Shared TypeScript types
├── supabase/
│   └── migrations/       # DB schema (auth + usage — Phase 2)
└── docs/
    └── privacy.html      # Privacy policy (hosted via GitHub Pages)
```

## Running locally

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- An [Anthropic API key](https://console.anthropic.com)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure the backend

```bash
cp apps/web/.env.local.example apps/web/.env.local
# Add your ANTHROPIC_API_KEY to apps/web/.env.local
```

### 3. Start the backend

```bash
cd apps/web && pnpm dev
# Running at http://localhost:3000
```

### 4. Configure the extension

```bash
cp apps/extension/.env.local.example apps/extension/.env.local
# PLASMO_PUBLIC_API_BASE_URL=http://localhost:3000 (default)
```

### 5. Build and load the extension

```bash
cd apps/extension && pnpm build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `apps/extension/build/chrome-mv3-prod`

Open ChatGPT, Claude, or Gemini — the Promptly button appears in the bottom-right corner.

## Deployment

The backend is deployed to Vercel. Point the extension at your deployment by setting:

```bash
# apps/extension/.env.local
PLASMO_PUBLIC_API_BASE_URL=https://your-app.vercel.app
```

Then rebuild and repackage:

```bash
cd apps/extension && pnpm build && pnpm package
```

The zip at `build/chrome-mv3-prod.zip` is ready for Chrome Web Store submission.

## Roadmap

- **Phase 2** — Auth (Clerk) + usage tiers (free: 10 prompts/day, Pro: unlimited)
- **Phase 3** — Stripe payments + upgrade flow
- **Phase 4** — Prompt history, Firefox AMO release

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, dev workflow, and PR guidelines.

## Security

To report a vulnerability privately, see [SECURITY.md](SECURITY.md).

## Privacy

Promptly does not store prompt content. Goal text and interview answers are processed in memory to generate your prompt and immediately discarded. See the full [privacy policy](https://audreysplim88-art.github.io/promptly/privacy).

## Licence

MIT
