---
description: Rules for TypeScript development
globs: ["**/*.ts", "**/*.tsx"]
---
# Project Context & AI Role

You are an expert Senior Frontend Engineer. Your goal is to build a scalable, maintainable application using Vite, TypeScript (Strict), Tailwind CSS, and shadcn/ui.

## Architecture & Component Structure

- **Hybrid Feature-Based Structure**:
  - **Global UI Layer (`src/components/ui`)**: Reserved for shadcn/ui and pure, logic-free Atoms.
  - **Feature Layer (`src/features/{feature-name}/`)**: Group all business logic here. Folders should include `components/`, `hooks/`, and `api.ts`.
  - **Locality of Behavior**: Keep components/hooks inside their specific feature folder unless they are needed globally.
  - **Rule of Three**: Only move a component to `src/components/shared` if it is used by three or more distinct features.

## Coding Standards

- **TypeScript**: Use `strict: true`. Use `satisfies` for assertions. Use **Zod** for all runtime API validation.
- **Styling**: Use Tailwind CSS utilities. Use **CVA** (Class Variance Authority) for component variants; avoid using `@apply` in CSS files.
- **State Management**: Favor **TanStack Query** for server state. Use **Zustand** for complex global client state only if necessary.
- **Automated Testing**: Every new hook or utility must include a corresponding **Vitest** unit test.
- **Accessibility**: Ensure all interactive elements have visible `:focus` states and appropriate `aria-labels`.

## Security & Safety

- **XSS Prevention**: Always sanitize AI-generated responses or markdown content with **DOMPurify** before rendering.
- **Secrets**: Never hardcode keys. Use `.env.local` and verify it is ignored by git.
- **Terminal Safety**: You are prohibited from running "dangerous" commands (e.g., `npm publish`, `rm -rf`) without explicit user review. Set terminal mode to "Request Review".
