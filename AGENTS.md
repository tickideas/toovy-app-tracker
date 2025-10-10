 # AppTracker
 
 This is an overview of AppTracker. It's a simple app to track the lifecycle and deployment status of many applications.
 
 ## Core Commands
 
 - Type-check and lint: `npm run build` (type checks) and `npm run lint`
 - Auto-fix style: `npm run lint -- --fix`
 - Run full test suite: (not configured yet)
 - Run a single test file: (not configured yet)
 - Start dev server: `npm run dev`
 - Build for production: `npm run build` then `npm run start`
 
 All other scripts should wrap these core tasks as the project grows.
 
 ## Project Layout
 
 ```
 ├─ web/               → Next.js (App Router) app: UI + server actions/API routes
 │  ├─ src/            → Application code
 │  ├─ prisma/         → Prisma schema & migrations
 │  └─ public/         → Static assets
 ```
 
 - Frontend code lives in `web/src`
 - Backend logic lives in server actions and API routes under `web/src`
 - Shared, environment-agnostic helpers belong in `web/src/lib`
 
 ## Development Patterns & Constraints
 
 Coding style
 - TypeScript strict mode; prefer explicit types; avoid `@ts-ignore`.
 - Single quotes, trailing commas, no semicolons.
 - 100-char line limit; tabs for indent (2-space YAML/JSON/MD).
 - Use interfaces for public APIs.
 - Tests first when fixing logic bugs.
 - Visual diff loop for UI tweaks.
 - Never introduce new runtime deps without explanation in PR description.
 
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
