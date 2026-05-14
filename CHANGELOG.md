# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.0-beta] - 2026-05-14

### Added

- **Web search tool (Tavily)**: per-node Globe toggle in the composer enables real-time web search via Vercel AI SDK tool-calling. BYOK Tavily key configured in Settings → Tools. Multi-step tool loops capped at 5 hops; toggle propagates to branch nodes and duel children.
- **Stop button**: replaces Send while a response is streaming. Aborts the in-flight request through an `AbortController` per node, propagates to the upstream LLM call, preserves partial output, and cleans up the empty-placeholder spinner.
- **Arize Phoenix tracing**: end-to-end OpenTelemetry instrumentation for every `streamText` call. Per-session Phoenix endpoint, API key, and project name configured in Settings → Tracing (falls back to `PHOENIX_COLLECTOR_ENDPOINT` env var if unset). Per-endpoint `TracerProvider` cache + `forceFlush()` after each request guarantees spans reach Phoenix before the function returns. New scripts: `npm run phoenix:up / down / logs` + `docker-compose.phoenix.yml`.
- **MiniMax provider**: fourth LLM option alongside OpenRouter, OpenAI, and Google. Requires a Group ID alongside the API key (also in Settings → LLM Providers). Uses `@ai-sdk/openai` with a `fetch` wrapper that rewrites `/v1/chat/completions` → `/v1/text/chatcompletion_v2?GroupId=…` and folds MiniMax's `reasoning_content` deltas into `<think>…</think>` blocks so reasoning is visible in both the chat UI and Phoenix traces.
- **Theme: system / light / dark tri-state**: new `useTheme` hook defaults to OS preference, follows system changes live, and auto-reverts manual overrides to system after 5 hours so a one-off night-time dark flip doesn't outlast the morning.
- **Tabbed Settings**: split into **LLM Providers**, **Tools**, **Tracing**, and **Data** tabs with a stable modal height.
- **Granular data clearing**: sidebar action and Data tab both expose "Clear chat history" (sessions only). The Data tab additionally has "Clear all app data" which wipes keys + sessions + Phoenix config and reloads.
- **Standalone Tavily pipeline test**: `scripts/test-tavily.ts` exercises the full LLM + tool loop against `.env.local` keys, useful for verifying the search pipeline outside the browser.

### Changed

- **`/api/chat` runtime: Edge → Node.** The OpenTelemetry Node SDK needs Node APIs (`async_hooks` etc.) that Edge doesn't expose. The trade-off is a slightly slower cold start (invisible against multi-second LLM latency) for full Phoenix observability.
- **Chat handler**: switched to the legacy `(req: VercelRequest, res: VercelResponse)` signature so `vercel dev` parses the body reliably and streams responses cleanly — the Web-standard `Request → Response` form hangs body reads in `vercel dev` on Node runtime.
- **Composer redesign**: transparent auto-growing textarea shares one rounded toolbar with the tool buttons; no more visible seam between message field and tool row. Default node height stabilised at `min-h-42 max-h-96`; the card stops shrinking after the first message.
- **Sidebar**: top-level "Clear All Data" replaced with "Clear Chat History" (non-destructive styling). The full reset path lives in Settings → Data → "Clear all app data".

### Fixed

- **Forever-spinner on provider errors**: rate-limit / credit / 400 responses (e.g. Gemini-TTS) used to silently close the stream, leaving an empty assistant placeholder spinning indefinitely. The server now captures errors via `streamText({ onError })` plus a safety net in `useCanvas` that fills empty placeholders with a visible `⚠️ Error` message.
- **Audio/TTS/image Gemini models** no longer leak into the model picker — added `tts`, `audio`, and `image-generation` to the Google model filter exclusions.

### Removed

- Top-level destructive "Clear All Data" action from the sidebar (moved to Settings → Data tab; the variant that wipes only sessions stays in the sidebar).

---

## [0.3.0-beta] - 2026-04-18

### Added

- **Multi-Model Duel**: Expanded the split-test comparison feature to allow 'dueling' 2 or 3 models simultaneously, breaking the previous two-model limit.
- **Merge Duel Functionality**: Added the ability to automatically synthesize and summarize responses from multiple child models into a single, unified node to easily evaluate differences and agreements.
- **Dynamic Node Layout**: The canvas now intelligently auto-adjusts widths, spacing, and connection lines to seamlessly accommodate any number of side-by-side models.

### Changed

- Updated `tsconfig.json` mappings for cleaner feature-based module resolution (`@/*`).

---

## [0.2.0-beta] - 2026-03-21

### Added

- **Single Sign-On (SSO)**: Integrated GitHub and Google OAuth for seamless and secure user authentication.
- **Collapsible Sidebar**: A powerful new navigation sidebar built with shadcn that manages chats, settings, and user actions.
- **Chat History & Auto-save**: Introducing session-based storage! Conversations are now automatically saved and can be swapped on the fly. Up to 50 sessions are supported.
- **Multi-Model Comparison**: Select a second AI model directly on a node and split-test prompts. The interface elegantly forks into two side-by-side children requesting from both models simultaneously.
- **Multi-Provider Support**: Direct integration for OpenAI and Google alongside OpenRouter, giving users full BYOK flexibility.
- **Dynamic Model Fetching**: The app now dynamically fetches, filters, and caches valid AI models for the active provider.

### Changed

- Refactored `localStorage` architecture from a single monolithic chat array to isolated, per-session data storage.
- The previous top action bar actions (Settings, Clear Data, Logout) have been migrated into the unified Sidebar interface.
- Connection line visualizations improved: bezier control points use dynamic midpoint calculations to seamlessly draw paths above or below parent nodes.

### Fixed

- **Vercel Build Issues**: Pinned `camelcase` versions to circumvent ESM/CJS compilation errors during Vercel builds.
- **Better Auth Dashboard**: Accurately mapped the configuration required API key for proper plugin initialization.

---

## [0.1.0-pre-alpha] - 2026-01-15

🎉 **Initial Pre-Alpha Release** — The first public milestone of Canvas AI!

### Added

- **Infinite Canvas Interface**: Pan, scroll, and organize your AI conversations spatially on an infinite 2D canvas
- **Branching Conversations**: Fork any message node to explore alternative paths without losing context
- **Multi-Model Orchestration**: Switch between AI models (Gemini 2.0 Flash, Claude 3.5 Sonnet, GPT-4o) via OpenRouter integration
- **Rich Content Rendering**:
  - Full Markdown support with GitHub Flavored Markdown (GFM)
  - Syntax highlighting for code blocks
  - LaTeX math rendering with KaTeX
- **Local-First Architecture**: Your API keys and chat history are stored only in your browser's local storage
- **Authentication System**: Mock auth with session isolation for multi-user support
- **Settings Panel**: Manage your OpenRouter API key and preferences
- **Professional Landing Page**:
  - Dark/Light mode toggle
  - Pricing section with tiers
  - Waitlist signup modal
  - Contact form (Web3Forms integration)
- **Modern Tech Stack**: Built with Vite, React 19, TypeScript (strict), Tailwind CSS v4, and shadcn/ui

### Notes

> ⚠️ **Pre-Alpha Software**: This release is for early testing and feedback. Expect breaking changes in future versions.

---

[0.1.0-pre-alpha]: https://github.com/zendegani/canvas-chatbot/releases/tag/v0.1.0-pre-alpha
