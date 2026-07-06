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

### What to set up

1. Create a D1 database and a KV namespace in Cloudflare.
2. Add the bindings in the Cloudflare dashboard:
   - `DB` for the D1 database
   - `KV_SESSIONS` for the session namespace
3. Add a secret named `BOOTSTRAP_ADMIN_TOKEN` for the initial admin bootstrap route.
4. Apply the D1 migration in `migrations/0001_initial.sql`.
5. For local frontend testing, point the CMS client at the Worker with `VITE_CINEAST_API_BASE`.

### Available API routes

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

The site includes an account drawer in the top navigation for sign in, registration, and admin page editing.
Admins can also switch registration to invite-only from the same drawer and create member accounts manually.

### Local Cloudflare dev

Use `npm run dev:cf` to run Wrangler locally against the Worker entrypoint after building the site, or `npm run preview` for the build-plus-dev flow already in the repo.
