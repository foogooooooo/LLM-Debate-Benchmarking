# Technical Summary — LLM Debate Benchmarking

## What I Built

A browser-based AI debate arena that puts two frontier language models — **DeepSeek** and **Zhipu GLM-4** — in a structured, multi-round dialogue on any topic, with the user acting as moderator. The goal was to make it practical and observable: you can watch the models reason in real time, steer the conversation, compare their approaches, and export the result.

---

## Core Features & How They Work

### 1. Real-Time Streaming Responses
Both models respond token-by-token using their respective streaming APIs (Server-Sent Events / `ReadableStream`). The UI renders each chunk as it arrives, with a blinking cursor indicating in-progress output. A `isComplete` flag on each message controls which UI elements (copy button, footer stats) are shown.

### 2. DeepSeek Deep Thinking
When enabled, the app calls the `deepseek-reasoner` model instead of `deepseek-chat`. The extended chain-of-thought is extracted from the `reasoning_content` field in the stream and stored separately on the message object. It's displayed in a collapsible panel in the chat bubble so users can inspect the reasoning without it cluttering the main response.

### 3. GLM-4 Web Search
When enabled, the app passes a `web_search` tool definition to the GLM API. The model may invoke it autonomously. Tool call results are parsed from the stream, and the cited sources are stored as `searchResults[]` on the message — shown in a collapsible panel with titles and links.

### 4. Feature Toggles (Deep Thinking / Web Search)
Each model's features can be toggled live via inline buttons in the role config panel. Clicking a toggle immediately dispatches an `UPDATE_ROLE` action to the global reducer — no save/edit cycle needed. The hook reads the role's `features` object at call time to decide which model endpoint and parameters to use.

### 5. Three-Party Dialogue with Full Context
Every API call includes the complete conversation history formatted as a `messages[]` array. This means each model sees what the other said in prior rounds and can directly respond, challenge, or build on it. The host (user) prompts are also included so the models can acknowledge guidance.

### 6. Auto-Continue N Rounds
Two `useEffect` hooks handle this. The first detects when the app enters `waiting_host` status with rounds remaining and starts a 3-second countdown. The second decrements the countdown each second and, when it hits zero, fires a `NEXT_ROUND` dispatch and decrements the round counter. The user can pause at any time, which clears both the countdown and the remaining rounds.

### 7. Export to Markdown
A utility function groups messages by round, formats them with headers for each speaker, and generates a Markdown string. It triggers a browser download via `Blob` → `URL.createObjectURL` → simulated `<a>` click → `revokeObjectURL`.

### 8. API Key Management
Keys are entered via a settings modal and written to `localStorage` under a namespaced key. On app startup, a `useEffect` reads them back and dispatches `UPDATE_ROLE` to hydrate both role objects. No keys are ever in source code or environment files — the `DEFAULT_ROLES` entries have empty `apiKey: ''` fields.

### 9. Conversation Persistence
Completed conversations are serialized and stored in `localStorage`. A history panel lists them with timestamps and topic previews. Loading a past conversation restores the full message list and topic, letting the user continue or review it.

---

## Technology Stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | **React 19** | Concurrent features, stable ecosystem |
| Language | **TypeScript 5.9** | Type safety across API shapes and state |
| Build tool | **Vite 8** | Fast HMR, native ESM |
| Styling | **Tailwind CSS v4** | Utility-first; CSS custom properties (`--color-*`) used for theming so dark/light mode requires zero JS |
| Icons | **Lucide React** | Lightweight, consistent icon set |
| State management | **useReducer + Context** | Predictable state machine for a finite set of transitions (idle → waiting_deepseek → waiting_glm → waiting_host → ...) |
| API transport | **fetch with ReadableStream** | Native streaming without extra dependencies |
| Persistence | **localStorage** | Zero-backend; sufficient for single-user local tool |

---

## Architecture Decisions

**No backend.** API calls go directly from the browser to DeepSeek and Zhipu endpoints. This means the app is a pure static site — deployable to any CDN. The tradeoff is that API keys live in `localStorage` (not ideal for production multi-user apps, but fine for personal use).

**Finite state machine for discussion flow.** The `DiscussionStatus` type (`idle | waiting_deepseek | waiting_glm | waiting_host | finished`) makes illegal states unrepresentable. The UI and auto-round logic both key off this status rather than trying to infer state from message counts.

**Separate `reasoningContent` and `searchResults` fields on `Message`.** These are stored alongside the main `content` rather than embedded in it. This keeps the copy/export functions clean — they only need `content` — while still making the supplementary data available for display.

---

## Security Posture

- No API keys in source code or git history (verified across all commits)
- `.gitignore` excludes `.env*`, `*.local`, and `.claude/` (local IDE config)
- Keys stored only in browser `localStorage` — scoped to the user's own machine
- No backend, no server logs, no key transmission beyond the model provider endpoints

---

## What I Did (Personal Contribution)

- Conceived the three-party debate format (two LLMs + human moderator)
- Designed the overall UX flow: topic input → streaming debate → moderated rounds → export
- Made product decisions: remove fact-check feature (data was stale), prioritize practical features (API key UI, export, auto-continue, copy) over cosmetic ones
- Chose the technology stack and overall architecture
- Directed and reviewed all implementation, caught and resolved TypeScript errors during development
- Defined the feature toggle behavior (instant dispatch vs. save/edit cycle)
- Specified the API key security model (localStorage + cleared defaults)
