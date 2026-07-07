# Agentic Workspace Boilerplate

This repository serves as a template for setting up a structured pair-programming workspace optimized for agentic coding models (like Claude, Gemini, etc.) using the **3-Layer Architecture** and a **Multi-Model Routing Strategy**.

## 🏗️ Structure Overview

```
.
├── .agents/
│   └── AGENTS.md           # Core agent instructions & persona triggers
├── directives/
│   └── README.md           # Layer 1: Standard Operating Procedures (SOPs)
├── execution/
│   └── README.md           # Layer 3: Deterministic execution scripts (Python)
├── .tmp/
│   └── .gitkeep            # Untracked workspace directory for intermediate files
├── .env.example            # Environment variables baseline
└── .gitignore              # Preconfigured Git ignore patterns
```

## 🚀 How to Use This Template

1. Click **"Use this template"** on GitHub to create your new repository.
2. Clone your new repository locally.
3. Configure your local `.env` by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Define your project goals in `directives/` and write automation scripts in `execution/`.
5. Start pair programming! The agent will automatically read `.agents/AGENTS.md` (or standard model configuration files) to follow the multi-model routing strategy and operating principles.

## Cloudflare CMS Backend

This project now includes a Cloudflare Worker entrypoint in `src/worker.js` plus a D1-backed CMS schema for users and pages.

### Cloudflare setup checklist

Follow these steps in order for the first deployment.

1. Create the Cloudflare resources.
   - Create a D1 database for users, pages, and settings.
   - Create a KV namespace for session tokens.

2. Add the bindings in `wrangler.jsonc` and in the Cloudflare dashboard.
   - `DB` should point to the D1 database.
   - `KV_SESSIONS` should point to the KV namespace.

3. Add the bootstrap secret.
   - Set `BOOTSTRAP_ADMIN_TOKEN` in Cloudflare Secrets.
   - Use a long random value and keep it private.

4. Apply the database migration.
   - Run the SQL in `migrations/0001_initial.sql` against the D1 database.
   - This creates the `users`, `pages`, and `settings` tables.

5. Set the local API origin if you are running the site against a Worker during development.
   - Copy `.env.example` to `.env`.
   - Set `VITE_CINEAST_API_BASE` to your local Worker URL, for example `http://127.0.0.1:8788`.

6. Build or start the Worker-backed local setup.
   - `npm run build` for a production-style bundle.
   - `npm run dev:cf` for Wrangler local dev after the build.

7. Open the bootstrap screen once.
   - Visit `/setup` or `/setup.html`.
   - Enter the bootstrap token.
   - Create the first admin user.
   - After that first account exists, bootstrap is disabled automatically.

8. Sign in through the account drawer.
   - Use the new admin account in the top navigation drawer.
   - Set invite-only registration if you want manual account creation only.
   - Create member users from the admin panel when needed.

9. Sync the site content.
   - Use the CMS drawer to search and edit pages.
   - Use the article sync flow to bring journal entries into the CMS when needed.
   - Deploy once the content and users are in place.

### Local development notes

- The CMS client points at `VITE_CINEAST_API_BASE` when that variable is set.
- If it is empty, the frontend will try same-origin requests.
- For a local Worker, `wrangler dev` typically serves on port `8788`.

### Available API routes

- `GET /api/auth/bootstrap` returns bootstrap status
- `POST /api/auth/bootstrap` creates the first admin user
- `POST /api/auth/login` creates a session
- `POST /api/auth/register` creates a member account
- `POST /api/auth/logout` clears a session
- `GET /api/auth/me` returns the current user
- `GET /api/admin/users` lists users
- `POST /api/admin/users` creates a user
- `PATCH /api/admin/users/:id` updates a user
- `DELETE /api/admin/users/:id` deletes a user
- `GET /api/pages` lists pages
- `POST /api/pages` creates a page
- `GET /api/pages/search?q=...` searches pages
- `GET /api/pages/:id-or-slug` reads a page
- `PATCH /api/pages/:id-or-slug` updates a page
- `DELETE /api/pages/:id-or-slug` deletes a page

### Roles

- `admin`: full read/write access
- `member`: read access only

The site includes an account drawer in the top navigation for sign in, registration, account status, and admin member management.
Admins can switch registration to invite-only from the same drawer, create member accounts manually, and start a new journal article from the CMS panel.
Page and article editing happens directly on the page after an admin signs in.
For first deployment, open `/setup.html` or `/setup` to bootstrap the very first admin account using `BOOTSTRAP_ADMIN_TOKEN`.

### Local Cloudflare dev

Use `npm run dev:cf` to run Wrangler locally against the Worker entrypoint after building the site, or `npm run preview` for the build-plus-dev flow already in the repo.

### Local maintenance

Run `npm run maintenance` every now and then to refresh the local IMDb score cache and report PNG/JPEG assets that need WebP versions.
Run `npm run maintenance:fix` when you want the WebP conversion script to create missing `.webp` siblings.
The IMDb refresh updates `public/data/imdb_scores.json`; if IMDb blocks a local request, the script keeps the existing score instead of breaking the run.
