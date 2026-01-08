# Canvas AI - Application Requirements & Specifications

## 1. Project Overview
Canvas AI is an infinite-canvas based chat interface that allows users to have branched conversations with various AI models. It moves beyond linear chat interfaces, enabling non-linear thought exploration, visualization of conversation paths, and multi-model comparison.

## 2. Core Features

### 2.1 Infinite Canvas
-   **Spatial Interface**: A dark-themed, infinite gridded background that supports panning and roaming.
-   **Node-Based Chat**: Conversations are represented as draggable nodes.
-   **Node Limits**: Performance optimization limits usage to **10 chat nodes** per canvas.
-   **Branching (Snapshot System)**:
    -   Users can branch off any node to explore alternative conceptual paths without losing the original context.
    -   Clicking the **"+" button** creates a child node that inherits the message history of the parent as a snapshot.
    -   Visual connections are drawn using curved SVG lines.
    -   **Mobile Limitation**: Branching is disabled on mobile devices to preserve UI clarity.

### 2.2 Multi-Model Intelligence
-   **OpenRouter Integration**: Powered by the OpenRouter API, giving access to a vast array of LLMs (Google Gemini, OpenAI GPT, Anthropic Claude, etc.).
-   **Model Switching**: Users can select different models for different nodes or switch models mid-conversation.
-   **Dynamic Model Fetching**: The app dynamically retrieves the list of available models from OpenRouter.

### 2.3 Rich Text Experience
-   **Markdown Support**: Full rendering of Markdown syntax (bold, italic, lists, headers) using `react-markdown`.
-   **Code Highlighting**: Syntax highlighting for code blocks (TypeScript, Python, JSON, etc.) using optimized "Dark" Prism themes.
-   **Mathematical Notation**: LaTeX support for rendering complex mathematical formulas using `Katex`.

### 2.4 User Session & Security
-   **Local-First Architecture**: Application data (canvas nodes) and API keys are stored in the user's browser (`localStorage`).
-   **Session Isolation**: Data is scoped to the specific user account. Switching users on the same device clears the workspace and loads the new user's specific data.
-   **Mock Authentication**: A client-side authentication flow requiring users to Register and Login (Note: For demonstration; production requires a backend).
-   **API Key Management**: 
    -   Users provide their own OpenRouter API Key in settings.
    -   Keys are stored securely in local storage and never transmitted to a backend server.
    -   A "Danger Zone" in settings allows users to wipe local data.

## 3. Technical Stack

### 3.1 Frontend
-   **Framework**: React 18 with TypeScript (Strict Mode enabled)
-   **Build Tool**: Vite (configured with `@` alias to `src`)
-   **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`)
-   **Icons**: Lucide React

### 3.2 State Management
-   **Persistence**: `localStorage` used for persisting:
    -   `canvasNodes_{user}`: The chat graph.
    -   `openRouterApiKey_{user}`: The user's API credential.
    -   `registeredUsers`: Mock user database.
    -   `currentUser`: Session state.
    -   `view`: View persistence (landing/canvas) across reloads.

### 3.3 Key Dependencies
-   **Core**: `react-markdown`, `remark-gfm`, `rehype-katex` (Rich Text)
-   **Utils**: `clsx`, `tailwind-merge`, `zod`, `dompurify`
-   **Dev**: `vitest`, `eslint`, `prettier`

### 3.4 Environment Variables
-   **`VITE_WEB3FORMS_KEY`**: Access key for Web3Forms API integration.
    -   Used for contact form and waitlist modal submissions.
    -   Stored in `.env.local` (gitignored) for security.
    -   Template provided in `.env.example`.
    -   Optional for development (only needed to test form submissions).

## 4. User Flows

### 4.1 Onboarding
-   **Landing Page**: A modern, responsive landing page with:
    -   **Sections**: Home, Overview, Product (Features), Pricing, Contact
    -   **Dark/Light Mode**: Toggle for user preference
    -   **Pricing Tiers**:
        -   **Individual** (Free): Up to 10 nodes, OpenRouter integration, local storage
        -   **Cloud Pro** (€20/month, Coming Soon): Up to 50 nodes, flagship models, collaboration
    -   **Waitlist Modal**: Users can join the waitlist for Cloud Pro features via Web3Forms
    -   **Contact Form**: Direct contact via Web3Forms integration (name, email, message)
-   **Auth**: Users must "Sign Up" or "Log In" to access the canvas.

### 4.2 Configuration
-   Upon entering the canvas, users are prompted to enter their OpenRouter API Key in "Settings".
-   Without a key, the chat functionality is disabled.
-   Settings Modal includes a "Save Changes" button to persist the key and reload the model list.

### 4.3 Interaction
-   **Add Node**: Start a new conversation thread.
-   **Chat**: Type a message and receive a streaming response.
-   **Branch**: Click "Branch" on any node to create a child node linked visually to its parent.
    -   **Positioning**: Branched nodes must appear in an empty space relative to the parent, ensuring no overlap with existing nodes (Resolution for Issue #1).
    -   **Context Display**: The visual chat interface of the child node shows *only* new messages starting from the branch point, while the underlying AI context retains the full parent history (Resolution for Issue #5).
    -   **Orphan Prevention**: Nodes that have active child nodes cannot be closed or deleted to prevent orphaning children (Resolution for Issue #4).
-   **Error Handling**: Specific feedback for invalid API keys or model errors. Error patterns are caught by an `ErrorBoundary` to prevent app crashing.

### 4.4 Theming
-   **Landing Page**: Text elements (Product, Contact, etc.) must maintain strict contrast ratios in both Light and Dark modes to ensure readability (Resolution for Issue #3).

## 5. Performance Requirements
-   **Bundle Optimization**: Vendor chunk splitting (React, Utils) to ensure fast load times and avoid large bundle warnings.
-   **Crash Resilience**: Error Boundaries wrapping complex renderers (Markdown) to prevent total app failure on malformed content.
