# AppTracker Web

AppTracker is a lightweight dashboard for tracking the lifecycle of software applications. You can log new products, attach domain and GitHub references, record weekly progress, and keep a running timeline of releases.

## Features

- Authentication via NextAuth (GitHub provider out of the box)
- App catalog with status, proposed domain, and repository link
- Progress updates with day/week/month cadence, blockers, and tag chips
- Prisma ORM with SQLite (dev) / Postgres (production) migrations
- Tailwind CSS + shadcn/ui components for fast iteration

## Tech Stack

- Next.js 15 (App Router, TypeScript)
- Prisma ORM, SQLite in development
- NextAuth v4, GitHub OAuth
- Tailwind CSS 4 + shadcn/ui

## Project Structure

```
web/
├─ src/
│  ├─ app/          # Routes, layouts, server components
│  ├─ actions/      # Server actions for apps & updates
│  ├─ lib/          # Prisma client and utilities
│  └─ generated/    # Prisma client output (gitignored)
├─ prisma/          # schema.prisma and migrations
└─ public/          # Static assets
```

## Prerequisites

- Node.js 18+
- GitHub OAuth app (Client ID + Secret)
- For production: Postgres connection string

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` (or `.env`) and set the following:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret
   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret
   DATABASE_URL="file:./dev.db"
   ```
3. Run database migrations and generate the Prisma client:
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Visit [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start development server with Turbopack
- `npm run build` — production build (includes type check)
- `npm run start` — serve the built app
- `npm run lint` — run ESLint checks (use `-- --fix` to auto-fix)

## Prisma Notes

- `npx prisma migrate dev` — apply migrations locally
- `npx prisma studio` — inspect the database via Prisma Studio
- `npx prisma migrate deploy` — apply migrations in production

## Deployment

Deploy to Vercel with a managed Postgres database (Neon/Supabase). Provide the production `DATABASE_URL`, GitHub OAuth credentials, and `NEXTAUTH_SECRET` in the hosting environment, then run `npm run build`.
