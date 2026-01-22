# Core principles (in this order of importance)

1. KISS + YAGNI — never add complexity or features "just in case"
2. Security first — always follow OWASP best practices
3. Keep code readable and obvious to humans — clarity > cleverness
4. Tolerate small duplication until it actually hurts (Rule of Three)
5. Use functional patterns (immutability, pure functions) by default when possible
6. Apply SOLID/DDD only where the domain is genuinely complex

- When in doubt: choose the version with least code, least abstraction, least ceremony.
- Never create throwaway test scripts or ad hoc verification files. If you need to test functionality, write a proper test in the test suite.
When proposing a new idea or implementation, create or update a Markdown file in `./docs/spec/` using `proposal_template.md`. Do not explain the proposal in chat; ask for confirmation after the document is written.
- DO NOT WRITE CODE UNTIL THE PROPOSED APPROACH HAS BEEN EXPLAINED AND CONFIRMED.


This structure separates **UI primitives** (shadcn) from **Business Logic** (Features) and **Application Routing** (Pages).

```text
src/
├── api/                # Global API clients (Axios/TanStack instance)
├── assets/             # Global static files (fonts, logos)
├── components/         
│   ├── ui/             # shadcn/ui components (The "Atoms")
│   └── shared/         # Custom complex UI used everywhere (Table wrappers, Layouts)
├── config/             # Environment variables, constants, route definitions
├── features/           # THE CORE: Domain-driven modules
│   ├── auth/           
│   │   ├── components/ # Login/Register forms
│   │   ├── hooks/      # useAuth, useSession
│   │   ├── services/   # Auth-specific API calls
│   │   └── types/      # Auth-specific TS interfaces
│   └── profile/        
├── hooks/              # Truly global hooks (useLocalStorage, useTheme)
├── lib/                # Third-party configs (shadcn/utils.ts, queryClient.ts)
├── pages/              # SPA Route components (entry points for the router)
├── providers/          # Context providers (ThemeProvider, QueryProvider)
├── types/              # Global/shared TS definitions
└── utils/              # Pure helper functions (formatters, validators)

```
