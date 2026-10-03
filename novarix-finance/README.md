# Novarix Finance

Your money, understood. React + TypeScript + Tailwind + Supabase.

## Setup

```bash
npm install
cp .env.example .env   # add your Supabase project URL and anon key
npm run dev
```

Scripts: `dev`, `build` (typecheck + production build), `preview`, `typecheck`.

## Structure

- `src/lib` – Supabase client, constants (categories, routes, nav), utilities
- `src/context/AuthContext.tsx` – session, login, signup, logout, route guards
- `src/components/layout` – `AppShell`, desktop `Sidebar`, mobile `MobileNav`
- `src/pages` – `LandingPage`, `Auth`
- `src/routes/AppRoutes.tsx` – public, guest-only and protected routes
- `src/types` – `Profile`, `Account`, `Transaction`, `Budget`, `Goal`, `FinancialInsight`

Design tokens live in `src/index.css` (HSL variables, light and dark) and are mapped in `tailwind.config.js`.
