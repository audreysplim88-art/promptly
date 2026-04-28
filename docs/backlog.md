# Promptly — Engineering Backlog

Generated from a systematic architecture and code quality review. Items are prioritised P0–P3.  
**P0** = blocking or high-risk. **P1** = important before Phase 2. **P2** = polish and resilience. **P3** = nice-to-have.

---

## P0 — Blocking / High Risk

### B-001 · No rate limiting on API routes
**Area:** Security / Cost  
**Files:** `apps/web/app/api/interview/route.ts`, `apps/web/app/api/synthesize/route.ts`  
**Issue:** Anyone who obtains the shared secret (or brute-forces it) can hammer the Anthropic API with no throttle. No per-IP or per-session limit exists.  
**Fix:** Add Vercel's `@upstash/ratelimit` (Redis-backed, works on Edge) limiting to e.g. 20 interview + 20 synthesize calls per IP per hour. This is the correct Phase 1 fix before Phase 2 adds real auth.  
**Effort:** Small (1–2 hours)

---

### B-002 · `overlay.tsx` is a god component at 508 lines
**Area:** Architecture / Maintainability  
**File:** `apps/extension/src/contents/overlay.tsx`  
**Issue:** A single component owns the wizard state machine (7 `useState` calls), all five step renderers, streaming output, domain detection UI, prompt injection, keyboard isolation, and both action handlers. Any change risks breaking unrelated behaviour; it cannot be tested in isolation.  
**Fix:** Three-part extraction:
1. Sub-components already partially in the file (`DomainPill`, `QuestionCard`) → move to `apps/extension/src/components/`
2. State logic → `useOverlayState()` custom hook in `apps/extension/src/hooks/`
3. Streaming output → `usePromptStream()` custom hook  
**Effort:** Medium (half day)

---

### B-003 · Duplicate CORS and auth logic across API routes
**Area:** Architecture / DRY  
**Files:** `apps/web/app/api/interview/route.ts:12–25`, `apps/web/app/api/synthesize/route.ts:9–21`  
**Issue:** `corsHeaders()` and `isAuthorized()` are copy-pasted verbatim. Adding a third route would require a third copy.  
**Fix:** Extract to `apps/web/lib/api-middleware.ts` and import in both routes. Also centralise the `validStyles` array from the synthesize route.  
**Effort:** Small (30 min)

---

## P1 — Important Before Phase 2

### B-004 · No fetch timeout or AbortController on streaming call
**Area:** Reliability  
**File:** `apps/extension/src/lib/api.ts` (`synthesizePrompt`)  
**Issue:** If the backend hangs or the connection drops mid-stream, the extension UI freezes indefinitely with the spinner running. No timeout, no abort signal.  
**Fix:** Wrap the fetch in an `AbortController` with a 30-second timeout. On abort, surface "Generation timed out — please try again." to the user.  
**Effort:** Small (1 hour)

---

### B-005 · Stream reader not cancelled on overlay close
**Area:** Reliability / Memory  
**File:** `apps/extension/src/lib/api.ts:54–87`  
**Issue:** If the user closes the panel while a prompt is streaming, the `ReadableStreamDefaultReader` continues consuming data until `[DONE]` is received. React state updates fire on an unmounted component, producing console warnings, and the Anthropic API continues generating tokens we discard.  
**Fix:** Return an `AbortController` from `synthesizePrompt`; call `.abort()` in the overlay's `close()` function and in a `useEffect` cleanup.  
**Effort:** Small (1 hour)

---

### B-006 · Missing type guard on Claude API response in interview route
**Area:** Reliability  
**File:** `apps/web/app/api/interview/route.ts:68`  
**Issue:** Code assumes `message.content[0]` exists and is a text block. If the Anthropic API returns a different content type (tool use, image, etc.), the cast will silently produce malformed data or throw.  
**Fix:** Add: `if (!message.content[0] || message.content[0].type !== "text") throw new Error("Unexpected response format from Claude")`.  
**Effort:** Tiny (15 min)

---

### B-007 · No React Error Boundary in the extension overlay
**Area:** Reliability / UX  
**File:** `apps/extension/src/contents/overlay.tsx`  
**Issue:** A runtime error in any child component (e.g. a malformed question from the API) crashes the entire overlay silently. The user sees a blank panel with no way to recover.  
**Fix:** Wrap the panel body in a React Error Boundary component that shows a friendly fallback ("Something went wrong — click to restart") and calls `reset()`.  
**Effort:** Small (1 hour)

---

### B-008 · Magic numbers scattered across API routes and constants
**Area:** Maintainability  
**Files:** `apps/web/app/api/interview/route.ts:53,63`, `apps/web/app/api/synthesize/route.ts:78`, `apps/extension/src/lib/constants.ts:8`  
**Issue:** `500` (goal char limit), `1500` (interview max tokens), `2048` (synthesize max tokens), and `10` (free daily limit) are inlined at their point of use. Changing the goal length limit requires knowing to search both the backend and the extension.  
**Fix:** Create `apps/web/lib/config.ts` exporting `API_LIMITS = { goalMaxChars: 500, interviewMaxTokens: 1500, synthesizeMaxTokens: 2048, freeDailyLimit: 10 }`. Import in both routes.  
**Effort:** Small (30 min)

---

### B-009 · Manual `.env.local` loading in `claude.ts` is fragile
**Area:** Reliability / Dev Experience  
**File:** `apps/web/lib/claude.ts:1–20`  
**Issue:** The file manually reads and parses `.env.local` at module load time to work around a Next.js quirk in the local dev environment. In production on Vercel this is a no-op but still executes. If the file path changes or the format is unexpected, the Anthropic client initialises without the API key and every request fails silently.  
**Fix:** Investigate whether the original Next.js issue still applies; if not, remove the workaround. If it does, add a guard: `if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set")` immediately after the load, so failures are loud.  
**Effort:** Small (30 min)

---

### B-010 · No CI pipeline
**Area:** Developer Experience  
**Issue:** No automated check runs on pull requests. TypeScript errors, lint failures, or broken builds are only caught if the developer remembers to run them locally.  
**Fix:** Add `.github/workflows/ci.yml` running: `pnpm install` → `pnpm -r build` → `pnpm -r lint` on every push and PR. Add a TypeScript check step (`tsc --noEmit`) for the web app.  
**Effort:** Small (1 hour)

---

## P2 — Polish and Resilience

### B-011 · `document.execCommand` is deprecated
**Area:** Reliability / Future-proofing  
**Files:** `apps/extension/src/contents/overlay.tsx:49–50`  
**Issue:** `execCommand("selectAll")` and `execCommand("insertText")` are deprecated in browsers. They work today in Chrome but are not guaranteed to remain. They are already non-functional in some browsers.  
**Note:** This is a known constraint of injecting text into ProseMirror-based editors (ChatGPT, Claude.ai). No fully supported cross-browser alternative exists yet. The current approach is the standard workaround used by most injection tools.  
**Fix:** Monitor for breakage; when Chrome removes support, switch to `InputEvent` with `insertText` type for contenteditable elements.  
**Effort:** Medium (revisit when breakage occurs)

---

### B-012 · Multiple overlay instances on same-domain navigation
**Area:** Reliability  
**File:** `apps/extension/src/contents/overlay.tsx`  
**Issue:** Plasmo re-runs the content script on SPA navigation within the same matched domain. If a user navigates from `chatgpt.com/` to `chatgpt.com/c/abc`, a second overlay mounts on top of the first. Two trigger buttons appear.  
**Fix:** Add a guard at module level: `if (document.querySelector("[data-promptly-overlay]")) return;` and set a `data-promptly-overlay` attribute on the root div on mount.  
**Effort:** Small (30 min)

---

### B-013 · `children: any` type in web app layout
**Area:** Type Safety  
**File:** `apps/web/app/layout.tsx:13`  
**Issue:** `children: any` bypasses TypeScript and suppresses warnings.  
**Fix:** Change to `children: React.ReactNode`.  
**Effort:** Tiny (5 min)

---

### B-014 · No structured logging — raw `console.error` in production
**Area:** Observability  
**Files:** `apps/web/app/api/interview/route.ts`, `apps/web/app/api/synthesize/route.ts`  
**Issue:** `console.error` statements log full error objects including stack traces to Vercel's log output. No log levels, no filtering, no request IDs for correlation.  
**Fix:** Integrate a lightweight logger (e.g. `pino`) with log level gating. In production, suppress DEBUG/INFO; in development, show all. Pass a `requestId` (from `crypto.randomUUID()`) through each request for log correlation.  
**Effort:** Small (2 hours)

---

### B-015 · No test suite
**Area:** Developer Experience  
**Issue:** Zero test files in the repository. The most critical logic — prompt building, SSE parsing, answer validation — is completely untested.  
**Priority tests to write:**
1. `buildSynthesizeUserPrompt` — verify all three styles produce correct output
2. `getSynthesizeSystemPrompt` — verify correct prompt returned per style
3. `synthesizePrompt` SSE parser — verify chunk accumulation, error handling, `[DONE]` detection
4. `injectPrompt` injection helpers — mock DOM elements and verify injection per tool  
**Fix:** Add Vitest to both apps; write tests for the above.  
**Effort:** Medium (half day to get infrastructure + first tests working)

---

## P3 — Nice to Have

### B-016 · UI strings hardcoded in components
**Area:** Maintainability / i18n  
**File:** `apps/extension/src/contents/overlay.tsx`  
**Issue:** All user-facing strings ("Couldn't find the chat input", "Crafting your prompt...", "Let's go →") are inline. Any copy change requires reading JSX.  
**Fix:** Extract to `apps/extension/src/lib/strings.ts`. No i18n framework needed yet — just a plain object.  
**Effort:** Small (1 hour)

---

### B-017 · Persist output style selection across sessions
**Area:** UX  
**File:** `apps/extension/src/contents/overlay.tsx`  
**Issue:** Output style resets to "Standard" every time the panel opens. A developer who always uses "Developer" mode has to re-select it every time.  
**Fix:** Replace `useState<OutputStyle>("standard")` with `useStorage<OutputStyle>("outputStyle", "standard")` from `@plasmohq/storage/hook`. One-line change.  
**Effort:** Tiny (15 min)

---

### B-018 · TypeScript strict mode not explicit in extension tsconfig
**Area:** Type Safety  
**File:** `apps/extension/tsconfig.json`  
**Issue:** Strict mode is inherited from Plasmo's base config but not explicitly declared. If Plasmo changes their base config, strict checks could silently disappear.  
**Fix:** Add `"strict": true` explicitly to `apps/extension/tsconfig.json`.  
**Effort:** Tiny (5 min)

---

### B-019 · Developer mode could auto-select when domain is `technical`
**Area:** UX  
**Issue:** Users on claude.ai or Cursor who submit a technical goal always have to manually switch to "Developer" mode. The domain detection already returns `technical` with high confidence for code goals.  
**Fix:** In `handleGoalSubmit`, after the interview response comes back: if `domain === "technical"` and `outputStyle === "standard"`, show a prompt: "Looks like a dev task — switch to Developer mode?" (dismissable, one-time).  
**Effort:** Small (1 hour)

---

### B-020 · Architecture documentation
**Area:** Developer Experience  
**Issue:** No document explains the end-to-end data flow, the shadow DOM / CSUI injection model, or the two-stage Claude pipeline to a new contributor.  
**Fix:** Create `docs/ARCHITECTURE.md` with a flow diagram (text-based is fine), file map, and explanation of the CORS constraints that drive the shared-secret auth model.  
**Effort:** Small (1–2 hours)

---

## Known constraints (not bugs)

These were flagged during review but are intentional architectural decisions, not actionable backlog items:

| Item | Why it's intentional |
|---|---|
| `CORS: *` on API routes | Content scripts run on the host page's origin (e.g. `chatgpt.com`), not `chrome-extension://`. Restricting by origin would break all requests. The shared secret is the auth layer instead. |
| `PLASMO_PUBLIC_API_SECRET` is visible in the extension bundle | This is a Phase 1 trade-off. Any shared secret in a browser extension is extractable by a determined user. Phase 2 replaces this with Clerk JWT tokens, which are user-scoped and short-lived. |
| `document.execCommand` for injection | No supported cross-browser API exists for injecting text into ProseMirror/Quill editors. This is the standard approach used by all major injection tools. |
| No session ID validation on synthesize | `sessionId` is currently ephemeral metadata. Phase 2 (database + auth) will add proper session tracking. |
