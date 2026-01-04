# Canvas AI

**A next-generation infinite canvas for non-linear AI conversations.**
[![Node.js CI](https://github.com/zendegani/canvas-chatbot/actions/workflows/node.js.yml/badge.svg?event=pull_request)](https://github.com/zendegani/canvas-chatbot/actions/workflows/node.js.yml)
![Coverage](./badges/coverage-total.svg)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/zendegani/canvas-chatbot/blob/main/LICENSE)

Canvas AI allows you to break free from linear chat threads. Visualize your thoughts, branch conversations, and orchestrate multiple AI models on a single, infinite spatial interface.

![Canvas AI Banner](https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop) 
*(Placeholder image - replace with actual screenshot)*

## 🚀 Features

-   **♾️ Infinite Canvas**: Pan, scroll, and organize your thoughts spatially. No more getting lost in long, vertical history.
-   **🌿 Branching Conversations**: Want to explore a tangent? Branch off any message node to create a new thread without losing context.
-   **🧠 Multi-Model Orchestration**: Powered by **OpenRouter**. Use Google Gemini 2.0 Flash for speed, Claude 3.5 Sonnet for coding, and GPT-4o for reasoning—all in the same workspace.
-   **📝 Rich Text Rendering**:
    -   Full Markdown support
    -   Syntax highlighting for code blocks
    -   LaTeX math rendering ($E=mc^2$)
-   **🔒 Local & Secure**:
    -   **Bring Your Own Key**: You typically use your own OpenRouter API Key.
    -   **Local Storage**: Your API keys and chat history are stored **only** in your browser's local storage. Nothing is sent to our servers.
    -   **Session Isolation**: Multiple users can share a device safely; data is scoped to your login.
-   **🎨 Professional Landing Page**:
    -   Modern, responsive design with dark/light mode toggle
    -   Pricing tiers (Individual Free, Cloud Pro Coming Soon)
    -   Waitlist signup modal for early access
    -   Contact form powered by Web3Forms

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript (Strict Mode), Vite
-   **Styling**: Tailwind CSS v4 (Locally built via Vite plugin)
-   **Icons**: Lucide React
-   **AI Integration**: OpenRouter API
-   **Forms**: Web3Forms
-   **Quality**: ESLint, Prettier, Vitest, Zod, DOMPurify


## 🔐 Environment Variables

The application uses environment variables for optional features:

-   **`VITE_WEB3FORMS_KEY`** (Optional): Access key for Web3Forms integration (contact form and waitlist)
    -   Get your free key at [web3forms.com](https://web3forms.com/)
    -   Only needed if you want to test the contact/waitlist forms locally
    -   See `.env.example` for the template

## 🏁 Getting Started

### Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn
-   An [OpenRouter API Key](https://openrouter.ai/keys)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/canvas-chatbot.git
    cd canvas-chatbot
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **(Optional) Set up environment variables**
    ```bash
    cp .env.example .env.local
    ```
    Then edit `.env.local` and add your Web3Forms access key if you want to test the contact/waitlist forms.

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    The app will start at `http://localhost:5173`.

### Usage Guide

1.  **Sign Up**: Create a local account (this is a mock auth system for demo purposes).
2.  **Add API Key**: Click on the **Settings** (gear icon) and paste your OpenRouter API Key.
3.  **Start Chatting**:
    -   Click the **"+"** button to add your first node.
    -   Type your message and hit send.
    -   Drag nodes to organize them.
    -   Click the **Branch** icon on a node to split the conversation.

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory, ready to be deployed to Vercel, Netlify, or any static host.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
