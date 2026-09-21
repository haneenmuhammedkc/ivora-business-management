<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ivora — Business Management

## Project Overview

Ivora is a business management web application.

The current development phase is **UI implementation only**.

Backend development, database integration, authentication, APIs, and business logic will be implemented separately in a later phase.

## Technology Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Next.js App Router
- ESLint

Additional libraries should only be added when they are actually required by the UI.

## Current Development Phase

### UI ONLY

Focus exclusively on:

- Page layouts
- Components
- Navigation
- Forms
- Tables
- Cards
- Charts and visualizations
- Modals
- Dropdowns
- Tabs
- Responsive layouts
- Loading states
- Empty states
- Error-state UI
- Visual interactions

Do NOT implement:

- Backend APIs
- Database connections
- Prisma
- PostgreSQL
- Redis
- Authentication logic
- Authorization logic
- Real API requests
- Production business calculations

Use static/mock data only when necessary to reproduce the Figma UI.

## Design Source of Truth

The approved Figma design is the primary visual reference.

When implementing a page:

1. Inspect the provided Figma design/reference carefully.
2. Reproduce the visual hierarchy accurately.
3. Match spacing, sizing, typography, colors, borders, radius, shadows, and alignment.
4. Do not invent alternative visual designs unless explicitly requested.
5. Do not simplify important UI elements merely to make implementation easier.
6. Preserve the intended responsive behavior.

## Component Architecture

Build reusable components instead of duplicating UI.

Prefer:

- Shared layout components
- Reusable buttons
- Reusable inputs
- Reusable cards
- Reusable tables
- Reusable modals
- Reusable navigation components
- Reusable typography patterns

Avoid large monolithic page components.

Keep components focused and composable.

## TypeScript

Use TypeScript throughout the project.

Prefer explicit types for:

- Component props
- Data structures
- Event handlers
- Configuration objects
- Reusable component variants

Avoid `any` unless there is a documented technical reason.

## Styling

Use Tailwind CSS for styling.

Do not introduce another styling system unless explicitly required.

Keep styling consistent with the established Ivora design system.

Do not hard-code repeated design values throughout many components when they can be represented as reusable tokens or variables.

## Responsive Design

Every UI implementation must consider:

- Desktop
- Tablet
- Mobile

Do not assume that the desktop Figma layout can simply be scaled down.

Use responsive layouts intentionally.

## Assets

Use the actual provided design assets whenever available.

Do not replace real project assets with unrelated placeholders when the correct asset is available.

Do not embed external image URLs unless explicitly requested.

## Code Changes

Before making significant changes:

1. Inspect the existing project structure.
2. Reuse existing components when appropriate.
3. Avoid modifying unrelated files.
4. Do not overwrite working code unnecessarily.
5. Keep changes focused on the requested task.

## Dependencies

Do not install packages automatically just because they might be useful.

Before adding a dependency:

1. Check whether the functionality can be implemented with the existing stack.
2. Check whether an existing installed dependency already provides the functionality.
3. Add a new dependency only when there is a clear benefit.

## Validation

After implementing UI:

1. Run the development server.
2. Check the page in the browser.
3. Check for TypeScript errors.
4. Check for ESLint errors.
5. Verify responsive behavior.
6. Compare the implementation against the Figma reference.
7. Fix visual inconsistencies before considering the task complete.

## Important Rule

Do not claim that a feature or UI is complete without verifying the actual implementation.

Do not fabricate test results, screenshots, file contents, API responses, or design details.

If something is unclear from the design, inspect the available project files or ask for clarification rather than inventing requirements.