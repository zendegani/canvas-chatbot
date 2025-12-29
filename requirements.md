# Canvas AI - Application Requirements & Specifications

## 1. Project Overview
Canvas AI is an infinite-canvas based chat interface that allows users to have branched conversations with various AI models. It moves beyond linear chat interfaces, enabling non-linear thought exploration, visualization of conversation paths, and multi-model comparison.

## 2. Core Features

### 2.1 Infinite Canvas
-   **Spatial Interface**: Users can pan and roam around an infinite 2D plane.
-   **Node-Based Chat**: Conversations are represented as nodes.
-   **Branching**: Users can branch off any node to explore alternative conceptual paths without losing the original context.
-   **Drag & Drop**: Nodes can be freely rearranged on the canvas.

### 2.2 Multi-Model Intelligence
-   **OpenRouter Integration**: Powered by the OpenRouter API, giving access to a vast array of LLMs (Google Gemini, OpenAI GPT, Anthropic Claude, etc.).
-   **Model Switching**: Users can select different models for different nodes or switch models mid-conversation.
-   **Dynamic Model Fetching**: The app dynamically retrieves the list of available models from OpenRouter.

### 2.3 Rich Text Experience
-   **Markdown Support**: Full rendering of Markdown syntax (bold, italic, lists, headers).
-   **Code Highlighting**: Syntax highlighting for code blocks (TypeScript, Python, JSON, etc.) using "Light" Prism themes for performance.
-   **Mathematical Notation**: LaTeX support for rendering complex mathematical formulas using `Katex`.

### 2.4 User Session & Security
-   **Local-First Architecture**: Application data (canvas nodes) and API keys are stored in the user's browser (`localStorage`).
-   **Session Isolation**: Data is scoped to the specific user account. Switching users on the same device clears the workspace and loads the new user's specific data.
-   **Mock Authentication**: A client-side authentication flow requiring users to Register and Login (Note: For demonstration; production requires a backend).
-   **API Key Management**: Users provide their own OpenRouter API Key, stored securely in local storage and never transmitted to a backend server (only to the OpenRouter API proxy).

## 3. Technical Stack

### 3.1 Frontend
-   **Framework**: React 18 with TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React

### 3.2 State Management
-   **Persistence**: `localStorage` used for persisting:
    -   `canvasNodes_{user}`: The chat graph.
    -   `openRouterApiKey_{user}`: The user's API credential.
    -   `registeredUsers`: Mock user database.
    -   `currentUser`: Session state.

### 3.3 Key Dependencies
-   `react-markdown`, `remark-gfm`, `rehype-katex`: For rich text rendering.
-   `react-syntax-highlighter`: For code blocks.
-   `framer-motion`: For smooth UI transitions (Landing page).

## 4. User Flows

### 4.1 Onboarding
-   Users land on a "Home" page describing the product value.
-   Users must "Sign Up" or "Log In" to access the canvas.

### 4.2 Configuration
-   Upon entering the canvas, users are prompted to enter their OpenRouter API Key in "Settings".
-   Without a key, the chat functionality is disabled.

### 4.3 Interaction
-   **Add Node**: Start a new conversation thread.
-   **Chat**: Type a message and receive a streaming response (simulated or real depending on API).
-   **Branch**: Click "Branch" on any node to create a child node linked visually to its parent.
-   **Clear Data**: "Danger Zone" option in settings to wipe local data.

## 5. Performance Requirements
-   **Bundle Optimization**: Vendor chunk splitting (React, Utils) to ensure fast load times.
-   **Crash Resilience**: Error Boundaries wrapping complex renderers (Markdown) to prevent total app failure on malformed content.
