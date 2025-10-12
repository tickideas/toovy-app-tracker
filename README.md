# AppTracker Web

AppTracker is a lightweight dashboard for tracking the lifecycle of software applications. You can log new products, attach domain and GitHub references, and manage application status throughout development.

## 🚀 Live Demo

**Production URL**: [apptracker.tickideas.org](https://apptracker.tickideas.org)

The application is fully functional and deployed to Vercel with PostgreSQL database.

## Features

- ✅ **Authentication**: Secure JWT-based authentication with rate limiting and proper session management
- ✅ **App Management**: Full CRUD operations for applications (create, read, update, delete)
- ✅ **Status Tracking**: Complete lifecycle management (Idea → Planning → Building → Testing → Deploying → Live)
- ✅ **Modern UI**: shadcn/ui components with Tailwind CSS and toast notifications
- ✅ **Edit/Delete**: In-place editing with confirmation dialogs for safety
- ✅ **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- ✅ **Production Ready**: Optimized builds with proper error handling and logging
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
- 🔗 **Public Sharing**: Share application progress with external stakeholders via secure share links
- 🗺️ **Roadmap View**: Comprehensive roadmap visualization with timeline, kanban, and metrics views
- 🔧 **GitHub Integration**: Fetch real-time repository insights including commits, issues, and activity
- 👥 **Multi-Account Support**: Manage multiple GitHub accounts with automatic token resolution
- 🔒 **Private Repository Access**: Secure access to private repositories with proper authentication
- 🎯 **Smart Token Management**: Per-repository token selection with fallback support
- 🛠️ **GitHub Token Debugging**: Built-in tools for testing and troubleshooting GitHub token configuration
- 📝 **Task Tracking**: Detailed task management with progress tracking and blocker identification
- 🔔 **Feedback System**: Collect feedback on shared applications for stakeholder collaboration
- 🛡️ **Enhanced Security**: Rate limiting, JWT authentication, input validation, and secure credential management
- 📊 **Production Sharing**: Configurable public sharing with proper domain support and security controls
- 🧪 **Testing Infrastructure**: Comprehensive testing setup with Vitest and React Testing Library
- 📊 **Performance Optimizations**: Cached API responses, memoized components, and optimized queries
- 🎨 **Modern Color Scheme**: Professional palette with Royal Blue primary, Lime Green accents, and clean Off White backgrounds for enhanced visual hierarchy

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- **Authentication**: Simple cookie-based sessions with middleware protection
- **UI**: Tailwind CSS + shadcn/ui components with custom modern color scheme
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
   NEXT_PUBLIC_APP_URL="http://localhost:3000"  # ⚠️  Update this for production!

   # Simple authentication credentials
   LOGIN_USERNAME=admin
   LOGIN_PASSWORD=your-secure-password

   # GitHub Integration (optional but recommended)
   GITHUB_TOKEN="ghp_your_github_token"
   # Add account-specific tokens for multi-account support:
   # GITHUB_TOKEN_MICROSOFT="ghp_ms_token"
   # GITHUB_TOKEN_FACEBOOK="ghp_fb_token"
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

### GitHub Integration

#### Repository Insights
- **Real-time Data**: Fetch live repository statistics, commits, and issues from GitHub
- **Visual Indicators**: Private repository badges and access status indicators
- **Comprehensive Stats**: Stars, forks, language, open issues, and recent activity tracking

#### Multi-Account Support
- **Automatic Token Resolution**: Uses account-specific tokens based on repository owner
- **Flexible Configuration**: Support for unlimited GitHub accounts via environment variables
- **Fallback Safety**: Default token ensures continuous operation when specific tokens are missing

#### Token Configuration
```bash
# Default/fallback token
GITHUB_TOKEN="ghp_your_default_token"

# Account-specific tokens
GITHUB_TOKEN_MICROSOFT="ghp_ms_token"
GITHUB_TOKEN_FACEBOOK="ghp_fb_token"
GITHUB_TOKEN_YOURUSERNAME="ghp_personal_token"
```

#### Token Management
- **Debug Endpoint**: `/api/debug/github-tokens` for testing and troubleshooting
- **Security Features**: Owner-only access for private repositories
- **Rate Limiting**: Distributed API requests across multiple tokens
- **Comprehensive Docs**: See `docs/GITHUB_MULTI_ACCOUNT.md` for detailed configuration

#### Repository Access
| Repository Type | Token Required | Access Control |
|-----------------|----------------|----------------|
| Public          | Optional       | Owner only |
| Private         | Required       | Owner + Valid Token |
| Organization    | Required       | Owner + Org Access |

## Design System

The application features a cohesive modern color palette designed for professional SaaS aesthetics and optimal user experience:

### Color Palette
- **Primary**: Royal Blue (#2563EB) - Expresses trust, professionalism, and modern SaaS feel
- **Accent**: Lime Green (#6EE7B7) - For completion/progress states, providing fresh contrast against blues
- **Background**: Off White (#F9FAFB) with Light Gray (#E5E7EB) borders - Keeps things airy and clean
- **Text**: Charcoal (#273043) - Provides clarity and optimal readability
- **Secondary**: Violet (#7C3AED) and Sky Blue (#38BDF8) - Occasional highlights, giving vibrancy without crowding

### Dark Mode Support
- **Background**: Deep Graphite (#1F2937) - For reduced eye strain in low-light environments
- **Adaptive Colors**: Lighter variants of all colors ensure proper contrast and accessibility in dark mode

### Implementation
- All colors use CSS custom properties for easy theming and maintenance
- Gradient combinations follow the primary-to-accent pattern for visual consistency
- Color usage follows accessibility guidelines with proper contrast ratios
- Components leverage semantic color tokens for status indicators and interactive states

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
   - `NEXT_PUBLIC_APP_URL` - Your production domain (e.g., `https://yourapp.domain.com`)
3. Deploy to Vercel (build script includes `prisma generate`)

### Security Notes

- Change the default `LOGIN_USERNAME` and `LOGIN_PASSWORD` in production
- Use a strong, randomly generated `NEXTAUTH_SECRET`
- **CRITICAL**: Set `NEXT_PUBLIC_APP_URL` to your production domain for working share links
- Consider using environment-specific secrets for enhanced security

### Future Enhancements

Based on the [NEXT_STEPS.md](./NEXT_STEPS.md) roadmap:

- **Deployments view**: Release management and version tracking
- **Testing & Quality**: Unit tests with Vitest and E2E tests with Playwright
- **Enhanced Filtering**: Advanced filtering by period and date ranges
- **Team Features**: Multi-tenant support and user roles
- **Advanced GitHub Features**: Pull request tracking, release monitoring, and CI/CD integration
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
9. **GitHub Integration** - Multi-account token management, repository insights, and private repository support with comprehensive security controls
10. **Modern Color Scheme** - Professional palette implementation with Royal Blue primary, Lime Green accents, and enhanced visual hierarchy

### Technical Challenges Solved

- **Database Migration**: SQLite → PostgreSQL for production scalability
- **Build Process**: Prisma client generation in production environments
- **Framework Updates**: Next.js 15 params Promise compatibility
- **Authentication**: Route middleware implementation for security
- **UI/UX**: Modern component library integration with proper error handling
- **Enhanced UX**: Modal-based forms, statistics dashboard, status filtering, and micro-interactions for improved user experience
- **GitHub Integration**: Multi-account token management with automatic resolution and private repository security
- **API Security**: Proper access controls for GitHub API endpoints with owner-only restrictions

The application demonstrates a complete development cycle from local development to production deployment with proper error handling, modern UI patterns, and production-ready configuration.
