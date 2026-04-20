# LLM Debate Benchmarking

A three-party AI debate arena where **DeepSeek** and **GLM-4** hold structured, multi-round discussions on any topic you set — while you act as the moderator.

![Tech Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)

---

## Overview

LLM Debate Benchmarking lets you observe and compare how two frontier language models — DeepSeek and GLM-4 — reason through open-ended questions. As the moderator, you set the topic, guide each round with follow-up prompts, and watch the models build on each other's arguments in real time.

Both models respond with **streaming output**, and DeepSeek's chain-of-thought reasoning and GLM-4's web search results are exposed inline so you can see exactly how each model arrives at its answer.

---

## Features

| Feature | Details |
|---|---|
| **Real-time streaming** | Responses stream token-by-token via SSE for both models |
| **DeepSeek deep thinking** | Toggle extended chain-of-thought reasoning; reasoning trace shown in a collapsible panel |
| **GLM-4 web search** | Toggle live web search; cited search results shown inline |
| **Three-party dialogue** | Full conversation history is passed to each model every round, so they can directly respond to each other |
| **Moderator input** | You inject prompts between rounds to steer the discussion |
| **Auto-continue** | Set N rounds to auto-advance — a 3-second countdown fires between rounds, with pause at any time |
| **Export to Markdown** | Download the full debate as a formatted `.md` file |
| **Copy messages** | One-click copy on any completed message |
| **Conversation history** | Past sessions are saved to `localStorage` and can be resumed |
| **API key settings** | Enter your own keys via the UI; stored in `localStorage`, never in source code |
| **Dark / light theme** | Toggle with one click |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [DeepSeek API key](https://platform.deepseek.com/)
- A [Zhipu AI (GLM-4) API key](https://open.bigmodel.cn/)

### Install & Run

```bash
git clone https://github.com/foogooooooo/LLM-Debate-Benchmarking.git
cd LLM-Debate-Benchmarking
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Configure API Keys

1. Click the **⚙** icon in the top-right corner
2. Enter your DeepSeek and GLM-4 API keys
3. Click **Save** — keys are stored locally in your browser and never sent anywhere except the respective model APIs

---

## Usage

1. **Set a topic** — Enter any open-ended question in the input box (or pick a suggestion)
2. **Start the debate** — DeepSeek responds first, then GLM-4
3. **Guide the next round** — Type a follow-up prompt or leave it blank to let the models continue freely
4. **Auto-continue** — Set a round count to let the debate run hands-free
5. **Export** — Click the download button to save the full debate as Markdown

---

## Tech Stack

- **React 19** + **TypeScript 5.9**
- **Vite 8** — build tooling and dev server
- **Tailwind CSS v4** — styling with CSS custom properties for theming
- **Lucide React** — icons
- **DeepSeek API** — `deepseek-reasoner` (deep thinking) or `deepseek-chat`
- **Zhipu AI API** — `glm-4-plus` with optional web search tool

---

## Project Structure

```
src/
├── components/
│   ├── DebateArena.tsx       # Main debate view, auto-rounds logic
│   ├── ChatBubble.tsx        # Message display with reasoning/search panels
│   ├── TopicInput.tsx        # Topic entry and debate start
│   ├── RoleConfigPanel.tsx   # Per-model feature toggles
│   ├── SettingsModal.tsx     # API key management
│   ├── ConversationHistory.tsx
│   └── ThemeToggle.tsx
├── contexts/
│   └── DebateContext.tsx     # Global state via useReducer
├── hooks/
│   └── useAIAPI.ts           # Streaming API calls for both models
├── utils/
│   ├── export.ts             # Markdown export
│   └── storage.ts            # localStorage conversation persistence
└── types/
    └── index.ts              # Shared types and default config
```

---

## License

MIT
