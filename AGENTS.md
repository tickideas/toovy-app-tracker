# AppTracker

This is an overview of AppTracker. It's a simple app to track the lifecycle and status of many applications with a focus on personal use and simplicity.

## Current Status: ✅ Production Ready

**Deployment**: Live on Vercel at [apptracker.tickideas.org](https://apptracker.tickideas.org)
**Version**: Production stable with core CRUD functionality
**Last Updated**: October 2025 (Modern Color Scheme Implementation)

 ## Core Commands

 - Type-check and lint: `npm run build` (type checks) and `npm run lint`
 - Auto-fix style: `npm run lint -- --fix`
 - Run full test suite: (not configured yet)
 - Run a single test file: (not configured yet)
 - Start dev server: `npm run dev`
 - Build for production: `npm run build` then `npm run start`
 - Database operations: `npx prisma migrate dev`, `npx prisma studio`

 All other scripts should wrap these core tasks as the project grows.

 ## Project Layout

 ```
 ├─ src/               → Next.js (App Router) app: UI + API routes
 │  ├─ app/            → Application pages and API routes
 │  │  ├─ api/         → API endpoints (auth, apps, updates)
 │  │  │   ├─ apps/    → App management endpoints
 │  │  │   │   └─ [slug]/updates/ → Progress tracking endpoints
 │  │  │   └─ auth/    → Authentication endpoints
 │  │  ├─ apps/        → Individual app detail pages
 │  │  └─ page.tsx     → Main dashboard with search/sort
 │  ├─ components/     → Reusable UI components
 │  │  └── ui/         → shadcn/ui components
 │  ├─ lib/            → Shared utilities and Prisma client
 │  └─ generated/      → Prisma client output (gitignored)
 ├─ prisma/            → Prisma schema & migrations
 └─ public/            → Static assets
 ```

 - Frontend code lives in `src/app` with client components using React hooks
 - Backend logic lives in API routes under `src/app/api`
 - Shared helpers and database client belong in `src/lib`
 - Authentication uses simple cookie-based sessions
 
 ## Development Patterns & Constraints
 
 ### Coding Style
 - TypeScript strict mode; prefer explicit types; avoid `@ts-ignore`.
 - Single quotes, trailing commas, no semicolons.
 - 100-char line limit; tabs for indent (2-space YAML/JSON/MD).
 - Use interfaces for public APIs.
 - Tests first when fixing logic bugs.
 - Visual diff loop for UI tweaks.
 - Never introduce new runtime deps without explanation in PR description

### Architecture Notes
- **Authentication**: Simple cookie-based sessions with environment variables + route middleware protection
- **State Management**: React hooks (useState, useEffect) for client-side state
- **API Design**: RESTful endpoints with proper HTTP methods and error handling
- **Validation**: Zod schemas for input validation and type safety
- **Database**: Prisma ORM with SQLite for development, Postgres (Prisma Cloud) for production
- **Components**: Client components for interactivity, shadcn/ui + Tailwind CSS for styling
- **UI/UX**: Modern form components with toast notifications and confirmation dialogs
- **GitHub Integration**: Multi-account token management with automatic repository access control

### Implemented Features
- ✅ Full CRUD operations for applications (Create, Read, Update, Delete)
- ✅ Authentication middleware for route protection
- ✅ Edit/delete functionality with confirmation dialogs
- ✅ Modern UI with shadcn/ui components and toast notifications
- ✅ Production-ready build configuration
- ✅ Next.js 15 compatibility (params Promise handling)
- ✅ PostgreSQL database configuration for production
- ✅ Enhanced apps management with search and sorting capabilities
- ✅ Comprehensive updates workflow with progress tracking
- ✅ Timeline-based progress management with blockers and tags
- ✅ Rich metadata display with card-based responsive UI
- ✅ **Enhanced Dashboard UI**: Modern modal-based forms, statistics dashboard, status filtering, improved app cards with hover effects, better empty states, and micro-interactions
- ✅ **GitHub Integration**: Real-time repository insights with commit history, issues, and activity tracking
- ✅ **Multi-Account Support**: Manage multiple GitHub accounts with per-repository token resolution
- ✅ **Private Repository Access**: Secure handling of private repositories with proper authentication
- ✅ **Token Management**: Automatic token selection with fallback support and debugging tools
- ✅ **Modern Color Scheme**: Professional palette with Royal Blue primary, Lime Green accents, and clean Off White backgrounds

### Design System
- **Primary Color**: Royal Blue (#2563EB) - Professional, modern SaaS feel
- **Accent Color**: Lime Green (#6EE7B7) - Fresh contrast for completion/progress states  
- **Background**: Off White (#F9FAFB) with Light Gray (#E5E7EB) borders - Clean and airy
- **Text**: Charcoal (#273043) for optimal readability
- **Secondary Colors**: Violet (#7C3AED) and Sky Blue (#38BDF8) for highlights and special states
- **Dark Mode**: Deep Graphite (#1F2937) backgrounds with lighter color variants for accessibility
 
 ### Git Workflow Requirements (MANDATORY) - DO NOT SKIP
Before writing ANY code, you MUST:
1. **Create a feature branch: `git checkout -b feature/[name]`**
2. **Never work on the main branch directly**

## Git Workflow Essentials
 
 1. Branch from `main` with a descriptive name: `feature/<slug>` or `bugfix/<slug>`.
 2. Run checks locally before committing: `npm run build` and `npm run lint`.
 3. Force pushes allowed only on your feature branch using
    `git push --force-with-lease`. Never force-push `main`.
 4. Keep commits atomic; prefer checkpoints (`feat: …`, `test: …`).
 
 ## Evidence Required for Every PR
 
 A pull request is reviewable when it includes:
 
 - All tests green (once configured)
 - Lint & type check pass (`npm run lint`, `npm run build`)
 - Diff confined to agreed paths (see section 2)
 - Proof artifact
   - Bug fix → failing test added first, now passes
   - Feature → new tests or visual snapshot demonstrating behavior
 - One-paragraph commit / PR description covering intent & root cause
 - No drop in coverage, no unexplained runtime deps; also update the README.md and provide a "next steps" note when relevant
