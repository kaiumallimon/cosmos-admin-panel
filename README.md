# Cosmos Admin Panel

A Next.js admin dashboard and content management UI for Cosmos ITS training content. This repository contains the admin web application, API routes, UI components, and utilities used to manage courses, questions, users, and related content.

Key highlights:

- Admin dashboard with analytics, content management, questions management, search, and user settings.
- Server-side and edge API routes under `app/api` for auth, course and question management, and CDN/file endpoints.
- Supabase integration for authentication and database access (`lib/supabaseClient.ts`).
- Reusable UI components in `components/` and `components/ui/` (Radix + Tailwind-inspired utilities).
- Built with the Next.js App Router (React Server Components + Client Components) and TypeScript.

## Project Structure (high level)

- `app/` — Next.js application routes and pages (including `dashboard/` subsections: `analytics`, `contents`, `questions`, `search`, `settings`, `users`).
- `app/api/` — API route handlers used by the frontend (auth, cdn, courses, questions, etc.).
- `components/` — Shared React components and UI primitives used across the app.
- `lib/` — Application libraries such as `supabaseClient`, `auth` helpers, and other utilities.
- `hooks/` — Custom React hooks (e.g. `use-mobile.ts`).
- `store/` — Client-side state stores (e.g. auth, upload) using `zustand`.
- `public/` — Static assets.
- `cosmos-its-training-client/` — A copy of the training client application included for reference and file copying. NOTE: this folder is provided as a vendor/reference copy and can be ignored for most development and deployments.

## Features

- Authentication via Supabase (sign-in routes and auth helpers).
- Course and question CRUD operations and routes for question counting and trimester-wise queries.
- File upload and CDN routes for managing media.
- Search and pagination components integrated in the dashboard UI.
- Theme support and client-side state management (dark/light theme toggle, responsive layout).

## Environment & Prerequisites

- Node.js (recommend >= 18) and a package manager (`npm`, `pnpm`, or `yarn`).
- A Supabase project (for auth and database). Create a `.env.local` with the following values:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # only for server-side/secure tasks
```

Adjust keys as required by your deployment and security model.

## Install & Run

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Available scripts (from `package.json`):

- `dev` — Run the Next.js development server (`next dev`).
- `build` — Build the application for production (`next build`).
- `start` — Run the production server (`next start`).
- `lint` — Run ESLint.

Open `http://localhost:3000` to view the app.

## Deployment

- This project is compatible with Vercel and other Node.js hosts that support Next.js. Deploy the built output or use the provider's Next.js integration.
- Ensure environment variables (Supabase keys, etc.) are configured in your deployment platform.

## Development Notes

- The application uses the Next.js App Router; server components and client components are used where appropriate.
- UI primitives live in `components/ui/` and the app uses Radix primitives and small utilities for styling.
- API handlers live inside `app/api/` and are used by frontend pages and the dashboard.
- Use `lib/supabaseClient.ts` to access Supabase from both server and client code.

## The `cosmos-its-training-client` Folder

This repository includes a copy of `cosmos-its-training-client` in the root for convenience (it contains a client app used in training and some reference server code). Treat it as a read-only vendor/reference folder used for copying specific files — it is not required to run the admin application, and you may ignore it for normal development and deployment workflows.

## Contributing

- Open an issue for feature requests or bugs.
- Fork the repository, make changes on a branch, and submit a PR with a clear description of changes.

## License

See repository settings or LICENSE file (if present).
