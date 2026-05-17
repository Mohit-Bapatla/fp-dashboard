# Architecture

FP Dashboard uses a Next.js App Router foundation with TypeScript and Tailwind CSS. The project is organized to keep user interface, shared utilities, server-side logic, service integrations, and future domain types separated as the application grows.

## Directory Overview

- `src/app`: App Router pages, layouts, and route-level UI.
- `src/components`: Shared React components.
- `src/lib`: Shared library helpers and framework utilities.
- `src/types`: Shared TypeScript types.
- `src/hooks`: Reusable React hooks.
- `src/services`: External service clients and integration boundaries.
- `src/server`: Server-only application logic.
- `src/utils`: General-purpose utilities.
- `prisma`: Future Prisma schema and migrations.
- `docs`: Product and engineering documentation.

## Future Infrastructure

- PostgreSQL for primary persistence.
- Prisma for schema management and typed database access.
- Clerk or Supabase Auth for authentication and authorization.
- Vercel for deployment and preview environments.
