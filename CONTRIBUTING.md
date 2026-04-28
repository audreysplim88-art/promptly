# Contributing to Promptly

Thanks for your interest in Promptly. This guide covers how to run the project locally and contribute changes.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **Chrome** (for loading the extension)
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/audreysplim88-art/promptly.git
cd promptly
pnpm install
```

### 2. Configure environment variables

**Web app** (`apps/web/.env.local`):
```bash
cp apps/web/.env.local.example apps/web/.env.local
# Edit the file and add your ANTHROPIC_API_KEY
```

**Extension** (`apps/extension/.env.local`):
```bash
cp apps/extension/.env.local.example apps/extension/.env.local
# PLASMO_PUBLIC_API_BASE_URL defaults to http://localhost:3000 — no change needed for local dev
# Leave PLASMO_PUBLIC_API_SECRET blank for local dev
```

### 3. Start the web app

```bash
cd apps/web
pnpm dev
# Runs at http://localhost:3000
```

### 4. Build the extension

In a separate terminal:
```bash
cd apps/extension
pnpm dev
# Outputs to apps/extension/.plasmo/chrome-mv3-dev/
```

### 5. Load the extension in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select `apps/extension/.plasmo/chrome-mv3-dev/`
5. Navigate to ChatGPT, Claude.ai, or another supported AI tool — the indigo button appears bottom-right

## Making changes

- **System prompts** (`apps/web/lib/prompts/`) — the interview and synthesis logic are the core IP. Changes here have the most impact on output quality.
- **Extension UI** (`apps/extension/src/contents/overlay.tsx`) — the main React component injected into AI tool pages.
- **Shared types** (`packages/shared/src/types.ts` and `apps/web/lib/shared-types.ts`) — both files are mirrors; update both when changing types.

## Submitting a pull request

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `pnpm build` in `apps/extension` to confirm no TypeScript errors
4. Open a PR against `main` with a clear description of what changed and why

## Supported AI tools

| Tool | URL |
|---|---|
| ChatGPT | chat.openai.com / chatgpt.com |
| Claude | claude.ai |
| Gemini | gemini.google.com |
| Perplexity | perplexity.ai |
| Microsoft Copilot | copilot.microsoft.com |
