# Canvas AI

[![Node.js CI](https://github.com/zendegani/canvas-chatbot/actions/workflows/node.js.yml/badge.svg?event=pull_request)](https://github.com/zendegani/canvas-chatbot/actions/workflows/node.js.yml)
![Coverage](./badges/coverage-total.svg)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/zendegani/canvas-chatbot/blob/main/LICENSE)

**A next-generation infinite canvas for non-linear AI conversations.**

Canvas AI allows you to break free from linear chat threads. Visualize your thoughts, branch conversations, and orchestrate multiple AI models on a single, infinite spatial interface.

## Features

- **Infinite Canvas**: Pan, scroll, and organize your thoughts spatially. No more getting lost in long, vertical history.
- **Chat History & Sidebar**: A sleek, collapsible sidebar lets you seamlessly switch between, manage, and autosave up to 50 previous conversations.
- **Branching Conversations**: Want to explore a tangent? Branch off any message node to create a new thread without losing context.

  ![Node Branching](./public/images/branching-light.png)

- **Model Duel**: Pick *two* models at once to split-test a prompt side-by-side.

  ![Duel Mode](./public/images/Duel-light.png)

- **Local & Secure**:
  - **Bring Your Own Key**: You typically use your own OpenRouter, OpenAI, or Google API keys.

    ![Settings BYOK](./public/images/Setting-light.png)

  - **Local Storage**: Your chat history is stored **only** in your browser's local storage.
  - **Authentication**: Powered by **Better Auth**, featuring robust local session management backed by PostgreSQL/Prisma, and rigorous NIST 800-63B password validation.
  - **Session Isolation**: Multiple users can share a device safely; data and chat histories are scoped to your login session.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Vercel CLI (install via `npm i -g vercel`)
- An API Key from OpenRouter, OpenAI, or Google

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/zendegani/canvas-chatbot.git
    cd canvas-chatbot
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Run the development server**

    ```bash
    vercel dev
    ```

    The app will start locally. Vercel CLI will typically start the app at `http://localhost:3000`.

### Usage Guide

1. **Sign Up**: Create a local account (this is a mock auth system for demo purposes).
2. **Add API Key**: Click on the **Settings** (gear icon) and configure your API keys for OpenRouter, OpenAI, or Google.
3. **Start Chatting**:
    - Click the **"New Chat"** button in the sidebar or the **"+"** button to start a fresh canvas.
    - Type your message and hit send.
    - Drag nodes to organize them.
    - Click the **"+"** next to the model dropdown to add a second model and compare responses side-by-side.
    - Click the **Branch** icon on a node to split the conversation.

## Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory, ready to be deployed to Vercel, Netlify, or any static host.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
