# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
