# AppTracker Web

AppTracker is a lightweight dashboard for tracking the lifecycle of software applications. You can log new products, attach domain and GitHub references, and manage application status throughout development.

## Features

- Simple username/password authentication (perfect for personal use)
- App catalog with status tracking (Idea → Planning → Building → Testing → Deploying → Live)
- Full CRUD operations for applications (create, read, update, delete)
- Individual app detail pages with editing capabilities
- Prisma ORM with SQLite (dev) / Postgres (production) migrations
- Tailwind CSS + shadcn/ui components for clean, fast UI

## Tech Stack

- Next.js 15 (App Router, TypeScript)
- Prisma ORM, SQLite in development
- Simple cookie-based authentication
- Tailwind CSS + shadcn/ui
- Zod for validation

## Project Structure

 ```
 ├─ src/               → Next.js (App Router) app: UI + API routes
 │  ├─ app/            → Application pages and API routes
 │  │  ├─ api/         → API endpoints (auth, apps)
 │  │  ├─ apps/        → Individual app pages
 │  │  └─ page.tsx     → Main dashboard
 │  ├─ lib/            → Shared utilities and Prisma client
 │  └─ generated/      → Prisma client output (gitignored)
 ├─ prisma/            → Prisma schema & migrations
 └─ public/            → Static assets
 ```

## Prerequisites

- Node.js 18+
- For production: Postgres connection string

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` (or `.env`) and set the following:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret

   # Simple authentication credentials
   LOGIN_USERNAME=admin
   LOGIN_PASSWORD=your-secure-password
   ```
3. Run database migrations and generate the Prisma client:
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Visit [http://localhost:3000](http://localhost:3000) and log in with your credentials.

## Usage

- **Create Apps**: Fill in the form on the main dashboard to add new applications
- **Edit Apps**: Click on any app to view its detail page, then click "Edit" to modify
- **Track Status**: Update app status through the development lifecycle
- **Manage Details**: Add descriptions, domain links, and GitHub repositories

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

Deploy to Vercel with a managed Postgres database (Neon/Supabase). Provide the production `DATABASE_URL`, authentication credentials, and `NEXTAUTH_SECRET` in the hosting environment, then run `npm run build`.

### Security Notes

- Change the default `LOGIN_USERNAME` and `LOGIN_PASSWORD` in production
- Use a strong, randomly generated `NEXTAUTH_SECRET`
- Consider using environment-specific secrets for enhanced security

### Future Enhancements

- Progress updates and timeline tracking
- Multiple user support with role-based access
- Deployment tracking and release management
- Enhanced search and filtering capabilities
