
#  Product Specification: Canvas AI

## 1. High-Level Concept

A multi-model AI orchestration tool using a canvas metaphor. It allows users to manage parallel AI conversations via draggable "nodes" on a 2D grid, integrating multiple Large Language Models (LLMs) via the **OpenRouter API**.

---

## 2. Navigation & User Flow

### Landing & Auth

- **Landing Page:** A modern, responsive landing page with sections for **Home**, **Overview**, **Product**, **Pricing**, and **Contact**. Features a Dark/Light mode toggle and a "Get Started" button.
    
- **Authentication:** Clean login/sign-up interface requiring only email and password.
    
- **Data Persistence:** User credentials and the **OpenRouter API key** are stored in **LocalStorage**. A **"Clear Key"** button is provided in the settings to wipe this data instantly.
    

### Mobile vs. Desktop Experience

- **Desktop:** Full access to the 2D canvas, node dragging, and conversation branching.
    
- **Mobile:** Users **can** interact with the chatbot and view existing nodes. However, to preserve UI clarity on small screens, the **"+" (Branching) button is hidden**, preventing the creation of new branches on mobile devices.
    

---

## 3. The Canvas Workspace

- **Grid Environment:** A dark-themed, infinite gridded background that supports panning.
    
- **Node Limitations:** A maximum of **10 chat nodes** per canvas to maintain performance.
    
- **Branching (Snapshot System):**
    
    - **Action:** Clicking the **"+" button** (Desktop only) creates a new independent node.
        
    - **Logic:** The child node is a **static snapshot**; it inherits the message history of the parent at the moment of creation but evolves independently.
        
    - **Visuals:** A curved SVG line connects the parent node to the child node.
        

---

## 4. Integrated Chat Node Design

The nodes are designed to be clean and compact, merging management and interaction.

- **Unified Header & Searchable Selector:**
    
    - The top of the box displays the **active model name** (e.g., "GPT OSS 120B").
        
    - Clicking the model name opens a **Searchable Selector** to filter through the extensive list of OpenRouter models.
        
- **Visual Interface:**
    
    - **Styling:** Semi-transparent, rounded dark background with a "Close" (X) button at the top right.
        
    - **Input Container:** Integrated at the bottom with a placeholder "Enter a prompt..." and functional pills for settings like Search or Auto.
        
- **Attachments:** Each node includes an attachment button (link icon) to upload files or images supported by the selected model.
    

---

## 5. Technical Requirements

- **Progressive Onboarding:** Users can explore the UI and open nodes without an API key. If they attempt to send a message, the UI triggers a guide to configure their OpenRouter API key.
    
- **Error Handling:** Specific feedback for invalid API keys (401), rate limits (429), or model-specific constraints (e.g., a model not supporting file attachments).
    
- **Rich Text:** Support for Markdown, code blocks with syntax highlighting, and LaTeX for math formulas.
    

