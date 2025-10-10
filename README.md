# AppTracker Web

AppTracker is a lightweight dashboard for tracking the lifecycle of software applications. You can log new products, attach domain and GitHub references, and manage application status throughout development.

## 🚀 Live Demo

**Production URL**: [apptracker.tickideas.org](https://apptracker.tickideas.org)

The application is fully functional and deployed to Vercel with PostgreSQL database.

## Features

- ✅ **Authentication**: Simple username/password authentication with route protection
- ✅ **App Management**: Full CRUD operations for applications (create, read, update, delete)
- ✅ **Status Tracking**: Complete lifecycle management (Idea → Planning → Building → Testing → Deploying → Live)
- ✅ **Modern UI**: shadcn/ui components with Tailwind CSS and toast notifications
- ✅ **Edit/Delete**: In-place editing with confirmation dialogs for safety
- ✅ **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- ✅ **Production Ready**: Optimized builds with proper error handling
- 🔍 **Enhanced Search**: Search apps by name, description, or domain with real-time filtering
- 📊 **Smart Sorting**: Sort applications by name, status, or last updated date
- 📈 **Progress Tracking**: Comprehensive updates workflow with timeline management
- 🏷️ **Rich Metadata**: Tag system, blocker tracking, and progress visualization
- 📱 **Responsive Design**: Modern card-based UI that works on all devices
- 🎨 **Enhanced Dashboard UI**: Modern modal-based forms, statistics dashboard, status filtering pills, improved app cards with hover effects, better empty states, and smooth micro-interactions
- 📊 **Real-time Statistics**: Live dashboard showing total apps, live applications, in-progress projects, and ideas count
- 🎯 **Quick Actions**: Intuitive modal forms for creating and editing applications with improved UX
- 🔧 **Status Filtering**: Quick filter pills for seamless status-based app filtering
- ✨ **Micro-interactions**: Smooth transitions, hover effects, and visual feedback throughout the interface

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- **Authentication**: Simple cookie-based sessions with middleware protection
- **UI**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod schemas for type safety
- **Deployment**: Vercel with Prisma Cloud PostgreSQL

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

### Dashboard Overview
- **View Statistics**: See real-time app statistics in the header (total apps, live projects, in-progress work, and ideas)
- **Quick Add**: Use the prominent "Add New App" button to create applications via modal forms
- **Status Filtering**: Click status filter pills to quickly view apps by their current status
- **Search & Sort**: Use the enhanced search bar and sorting controls to find and organize apps

### App Management
- **Create Apps**: Click "Add New App" to open a modal form for creating new applications
- **Edit Apps**: Click the edit icon on any app card to modify its details via modal
- **Delete Apps**: Use the delete icon with confirmation dialog for safe removal
- **Search & Sort**: Enhanced search by name, description, or domain with intuitive filtering
- **View Details**: Click on app names to navigate to detailed app pages

### Progress Tracking
- **Track Progress**: Add detailed progress updates with completion percentages, blockers, and tags
- **Timeline Management**: View chronological progress history with visual progress bars
- **Manage Details**: Add descriptions, domain links, and GitHub repositories
- **Status Updates**: Track application lifecycle from idea to production

### Enhanced Features
- **Hover Effects**: App cards have smooth hover transitions with elevation changes
- **Quick Actions**: Direct edit/delete buttons on each app card for efficient management
- **Responsive Design**: Optimized experience across desktop, tablet, and mobile devices
- **Empty States**: Helpful guidance when no apps exist or search returns no results

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

### Production Deployment ✅

**Live URL**: [apptracker.tickideas.org](https://apptracker.tickideas.org)

The application is successfully deployed to Vercel with:
- **Database**: Prisma Cloud PostgreSQL
- **Authentication**: Environment-based credentials
- **Build**: Optimized production build with Prisma client generation
- **Framework**: Next.js 15 compatibility fixes

### New Deployment Setup

To deploy a new instance:
1. Set up a managed Postgres database (Prisma Cloud, Neon, or Supabase)
2. Configure environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `LOGIN_USERNAME` - Admin username
   - `LOGIN_PASSWORD` - Secure password
   - `NEXTAUTH_SECRET` - Random secret for session security
3. Deploy to Vercel (build script includes `prisma generate`)

### Security Notes

- Change the default `LOGIN_USERNAME` and `LOGIN_PASSWORD` in production
- Use a strong, randomly generated `NEXTAUTH_SECRET`
- Consider using environment-specific secrets for enhanced security

### Future Enhancements

Based on the [NEXT_STEPS.md](./NEXT_STEPS.md) roadmap:

- **Deployments view**: Release management and version tracking
- **Testing & Quality**: Unit tests with Vitest and E2E tests with Playwright
- **Enhanced Filtering**: Advanced filtering by period and date ranges
- **Team Features**: Multi-tenant support and user roles
- **GitHub Integration**: API integration for repository insights
- **Analytics Dashboard**: Quick stats and completion metrics across apps

### Current Limitations

- Single user system (perfect for personal use)
- Manual progress updates (no automated tracking)
- No deployment tracking yet
- No mobile app version

---

## 🏗️ Development Journey

### Key Implementation Milestones

1. **Foundation** - Basic CRUD operations and authentication
2. **UI Enhancement** - Migration to shadcn/ui components with toast notifications
3. **Production Fixes** - Database configuration and build optimization
4. **Next.js 15 Compatibility** - Params Promise handling and middleware protection
5. **Production Deployment** - Successful Vercel deployment with PostgreSQL
6. **Enhanced Management** - Search, sorting, and improved app discovery
7. **Progress Tracking** - Comprehensive updates workflow with timeline management
8. **Enhanced Dashboard UI** - Modern modal-based forms, statistics dashboard, status filtering, improved app cards with hover effects, better empty states, and micro-interactions

### Technical Challenges Solved

- **Database Migration**: SQLite → PostgreSQL for production scalability
- **Build Process**: Prisma client generation in production environments
- **Framework Updates**: Next.js 15 params Promise compatibility
- **Authentication**: Route middleware implementation for security
- **UI/UX**: Modern component library integration with proper error handling
- **Enhanced UX**: Modal-based forms, statistics dashboard, status filtering, and micro-interactions for improved user experience

The application demonstrates a complete development cycle from local development to production deployment with proper error handling, modern UI patterns, and production-ready configuration.
