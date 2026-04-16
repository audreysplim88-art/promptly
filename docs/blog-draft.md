# I Built a Product in 7 Hours With an AI Pair Programmer. Here's What Actually Happened.

Most people are using AI tools wrong — not because they lack ideas, but because they don't know how to ask. The gap between what someone *wants* and what they *type into the prompt box* is where most of the value gets lost.

That insight became Promptly, a browser extension that sits right inside ChatGPT, Claude, Gemini, and other AI tools. Instead of staring at a blank text box, users describe what they want in plain language, answer a short interview tailored to their goal, and get back a polished, expert-level prompt — ready to use with one click.

I built the entire first version in a single day, pair-programming with Claude Code. Not a prototype. Not a mockup. A working product, deployed to production, ready for real users.

This is how that day went — and what it taught me about what AI collaboration actually looks like when you're building something real.

---

## It started with a plan, not code

The first thing I did was *not* write code. I spent time in a structured planning session with Claude Code, designing the full system before touching a single file.

We mapped out:

- **The product model** — six dimensions that make a prompt effective (goal, context, audience, format, constraints, tone), and an interview system designed to extract each one from the user naturally.
- **The technical architecture** — a browser extension frontend, a serverless backend, and two AI-powered stages: one to generate the interview questions, the other to synthesize the final prompt.
- **A phased roadmap** — Phase 1 ships core value only. No accounts, no payments, no extra features. Prove it works first. Phases 2 through 4 add auth, monetization, and polish — but only after validation.

That planning session produced a ~400-line design document covering everything from the database schema to how the extension would inject text into six different AI tools' input fields.

This is the part that surprised me. I expected the AI to be most useful when writing code. Instead, the highest-leverage moment was the architectural conversation *before* any code existed.

---

## From zero to deployed in under an hour

With the plan in place, Claude Code scaffolded the full application — frontend extension, backend API, shared data models — in a single pass. Within 30 minutes of the first line of code, the backend was live in production.

It wasn't seamless. The first deployment failed because of a dependency configuration issue. But the diagnosis-and-fix cycle took minutes, not hours. Two quick adjustments and we were live.

This is where AI pair-programming changes the economics of building. The scaffolding work — the boilerplate, the configuration files, the wiring between frontend and backend — is exactly the kind of work that normally takes a day or two of careful setup. It happened in under an hour.

---

## The pivot that made the product

The initial build worked, but the user experience felt disconnected. You had to click the extension icon in your browser toolbar, use the tool in a separate popup window, copy the generated prompt, switch back to your AI tool, and paste it in. Too many steps. Too much friction.

So we pivoted. Instead of a popup, the extension now injects itself *directly into the AI tool's page*. A small button appears in the bottom corner of ChatGPT or Claude. Click it, and a side panel slides in. Generate your prompt, and it gets inserted straight into the chat input. No copy-paste. No context-switching.

This was a product decision — driven by UX intuition, not by the code. The AI didn't suggest this pivot. I recognized the friction, decided on the solution, and then we built it together.

This is an important distinction. The AI accelerated the *execution* dramatically. But the product judgment — what to build, what experience to create, when to change direction — remained entirely human.

---

## A code review that caught real bugs

Once the core product was working, I ran a structured code review — 12 clean code principles, applied systematically across every file. This is where the AI's thoroughness genuinely impressed me.

It found 10 issues across three priority levels. Several were things I would have caught eventually. A few were things I might not have:

- **A hidden bug from template code** — The extension framework's starter template included files that would inject a broken, unstyled button on *every website* the user visited. Not just AI tools — every page. It would have been the first thing users noticed, and it had nothing to do with our product.
- **Silent failures** — Two user-facing features ("Insert into chat" and "Copy to clipboard") would fail silently under certain conditions. No error message, no feedback. The user would click a button and nothing would happen. These are the kind of issues that erode trust fast.
- **A security gap** — The backend API had no authentication. Anyone who found the URL could use our AI credits. We added a shared secret mechanism to lock it down.
- **Missing error handling on the AI stream** — If the AI service dropped the connection mid-response, the user would see a truncated prompt with no indication anything went wrong. We added proper error surfacing so users know to retry.

All 10 fixes were implemented in 8 separate commits over about 15 minutes. Each commit was atomic — one fix, clearly described, independently reversible. The kind of clean git history you'd want on any team project.

---

## What the AI did well

**Speed of execution.** The scaffolding, the cross-file refactors, the repetitive-but-important consistency work — tasks that would normally take hours compressed into minutes. When we added the API security layer, Claude Code updated both backend routes, the frontend request handler, the configuration file, and created documentation templates, all in one coordinated pass. No file forgotten, no inconsistency introduced.

**Systematic thoroughness.** The code review wasn't a cursory glance. It applied 12 specific principles to every file and found issues at every priority level, including a real bug I might have shipped.

**Architectural thinking.** The planning session produced a design document I'd be comfortable presenting to a technical stakeholder. Opinionated, structured, covering edge cases and deployment concerns — not just "here's some code."

---

## What still required a human

**Product vision.** The AI didn't come up with Promptly. It didn't identify the problem, define the target user, or decide what the experience should feel like. It didn't suggest the pivot from popup to overlay. These decisions came from understanding users, not understanding code.

**Quality judgment on the AI prompts.** The two system prompts that power the product — the interview generator and the prompt synthesizer — are the core intellectual property. Getting them right required domain expertise in prompt engineering, iteration, and taste. The AI helped draft them, but the human decided when they were good enough.

**Scope discipline.** The hardest decision in any project is what *not* to build. Phase 1 has no user accounts, no payment system, no prompt history, no analytics. Every one of those would be useful. None of them are necessary to validate whether the core experience works. That restraint is a human judgment call.

**Deployment and operational decisions.** When to deploy. What to test manually. How to handle a configuration conflict between two environments. These required understanding the full picture — not just the code, but the infrastructure, the timeline, and the risk tolerance.

---

## What this means for how we build

I'm not going to claim AI will replace engineers. That framing misses the point entirely.

What happened in this build was closer to having a very fast, very thorough junior engineer — one who never gets tired, never forgets a file, and can hold the entire codebase in their head. But one who needs clear direction on *what* to build and *why*.

The leverage is real. A working, deployed product in 7 hours is not something I could have done alone in that timeframe. But the *quality* of what got built — the product decisions, the UX, the prompt engineering — those were shaped by human experience and judgment.

For tech leaders thinking about where AI coding tools fit into their teams, here's what I'd take away:

1. **The highest leverage is in planning, not typing.** The architectural session at the start saved more time than all the code generation combined. AI is most useful when you give it a clear, well-structured problem.

2. **AI amplifies your team's judgment — it doesn't replace it.** The best engineers will get the most out of these tools, because they know what to ask for, when to push back, and when to change direction.

3. **Systematic review is where AI earns its keep.** The code review caught issues that matter — security, reliability, user trust. The AI's ability to methodically apply a checklist across an entire codebase, without fatigue or shortcuts, is genuinely valuable.

4. **Ship small, validate fast.** AI makes it tempting to build everything at once because you *can*. Resist. The discipline to ship Phase 1 and learn before building Phase 2 is more important than ever when the cost of building is this low.

---

## By the numbers

| | |
|---|---|
| **Time to working product** | ~7 hours |
| **Backend deployment** | < 1 hour from first line of code |
| **Code review + all fixes applied** | ~15 minutes |
| **AI tools supported** | 6 (ChatGPT, Claude, Gemini, Perplexity, Copilot, and a general fallback) |
| **Codebase** | ~2,500 lines across the extension and backend |

---

*[Your name / bio / link to Promptly]*
