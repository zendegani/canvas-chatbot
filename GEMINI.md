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
