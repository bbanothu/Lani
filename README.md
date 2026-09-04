# Lani

Lani is a shopping companion that captures the products you browse, keeps them
organized, tracks their prices, and lets you chat about them with an AI model of
your choice. It is a monorepo containing a browser extension, a web app, and a
mobile app, all backed by a shared Supabase project.

---

## Table of contents

- [How it works](#how-it-works)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Getting started](#getting-started)
  - [1. Supabase backend](#1-supabase-backend)
  - [2. Web app (`apps/website`)](#2-web-app-appswebsite)
  - [3. Browser extension (`apps/extension`)](#3-browser-extension-appsextension)
  - [4. Mobile app (`apps/app`)](#4-mobile-app-appsapp)
- [LLM providers](#llm-providers)
- [Database schema](#database-schema)
- [Edge functions](#edge-functions)
- [Third-party integrations](#third-party-integrations)
- [Development notes](#development-notes)

---

## How it works

1. You install the **browser extension** and sign in with a Lani account.
2. As you browse, a content script checks each page. Known retailers (Amazon,
   eBay, Etsy, Walmart, Target, Best Buy) are matched by URL shape; every other
   site is passed to your configured **LLM** with a short excerpt and asked
   "is this a single product page?".
3. When a page is a product, the extension extracts the title, price, image, and
   a few descriptive tags, queues the capture locally, and the background worker
   syncs it to Supabase.
4. The **web app** and **mobile app** read from the same Supabase project, so
   your captures show up as cards on the dashboard. From there you can organize
   them into lists (including shareable/public lists), add them to a cart, turn
   on price tracking, and chat about them with the assistant ("Nora").

Captures are de-duplicated by URL: the extension never scrapes a page it has
already captured. Revisiting a captured page just moves its card back to the top
of the dashboard.

---

## Repository layout

```
Lani/
├── apps/
│   ├── extension/          Chrome MV3 extension (Vite + React + Tailwind)
│   │   ├── src/
│   │   │   ├── background/  service worker: auth, LLM calls, Supabase sync
│   │   │   ├── content/     detect.ts – per-page product detection
│   │   │   ├── lib/         extract, llm, storage, supabase, site-patterns
│   │   │   └── sidepanel/   side-panel UI (captures, logs, blacklist, AI settings)
│   │   └── dist/            build output – load this folder as an unpacked extension
│   │
│   ├── website/            Next.js 14 App Router web app (port 3001)
│   │   ├── app/            routes: /home, /dashboard, /lists, /cart, /chat,
│   │   │                   /profile, /login, /s (shared lists), /api/*
│   │   ├── components/     dashboard UI, product cards, popups
│   │   ├── lib/            supabase clients, auth, products, lists, cart,
│   │   │                   chat, integrations, llm
│   │   └── supabase/
│   │       ├── migrations/ ordered SQL migrations (source of truth for schema)
│   │       ├── schema.sql  consolidated snapshot of all migrations
│   │       └── functions/  Deno edge functions (rescrape-prices, delete-account)
│   │
│   └── app/                React Native / Expo mobile app (iOS + Android)
│       ├── screens/        Login, Dashboard, Lists, ListDetail, Cart, Chat, Profile
│       ├── components/     BottomNav, ProductCard, QuickFilters, IntegrationsPanel
│       └── lib/            supabase, auth, products, lists, cart, chat, integrations
│
├── package.json            npm workspaces: apps/website, apps/extension
└── README.md
```

`apps/app` is intentionally **not** part of the root npm workspace — it has its
own lockfile and Expo/React Native toolchain.

---

## Prerequisites

| Tool               | Version        | Used by                     |
| ------------------ | -------------- | --------------------------- |
| Node.js            | 20+ (26 works) | all apps                    |
| npm                | 9+             | root workspaces, mobile app |
| Supabase CLI       | latest         | migrations, edge functions  |
| Deno               | latest         | edge functions (via CLI)    |
| Expo / EAS CLI     | latest         | mobile app builds           |
| A Chromium browser | —              | loading the extension       |

You also need API keys for whichever LLM provider you want to use (see
[LLM providers](#llm-providers)). Ollama needs no key but must be running
locally.

---

## Environment variables

Nothing is committed. Create the files below from these templates.

### `apps/website/.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-only routes & OAuth callbacks
```

### `apps/app/.env`

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

### Extension

The extension currently has its Supabase URL and anon key **hardcoded** in
`apps/extension/src/lib/supabase.ts`. Point them at your project before building.

### Edge functions (set as Supabase secrets, not files)

```bash
supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
# OAuth integrations also need per-provider client id/secret secrets
```

---

## Getting started

```bash
git clone https://github.com/bbanothu/Lani.git
cd Lani
npm install            # installs apps/website + apps/extension workspaces
```

### 1. Supabase backend

Create a project at [supabase.com](https://supabase.com), then apply the schema.
The migrations in `apps/website/supabase/migrations/` are the source of truth.

```bash
cd apps/website
supabase link --project-ref <project-ref>
supabase db push                       # applies all migrations in order
supabase functions deploy rescrape-prices
supabase functions deploy delete-account
```

Or, for a quick start, paste `apps/website/supabase/schema.sql` into the
Supabase SQL editor — it is a consolidated snapshot of every migration.

> **Note:** the most recent migration,
> `20260901000000_dedupe_products_by_url.sql`, collapses duplicate product rows
> and adds a `unique (user_id, url)` index. The extension's sync path depends on
> that index existing, so make sure this migration is applied.

Schedule the price rescrape (once per day is plenty) with a Supabase cron job or
an external scheduler hitting the `rescrape-prices` function URL.

### 2. Web app (`apps/website`)

```bash
npm run dev:website        # from repo root – starts Next.js on http://localhost:3001
# or
cd apps/website && npm run dev
```

Build / run production:

```bash
npm run build:website
cd apps/website && npm start
```

Routes of note:

- `/` redirects to `/dashboard` (signed in) or `/home` (signed out)
- `/dashboard` — grid of captured products, quick filters, retailer rail, sorting
- `/lists` and `/s/<id>` — private, shared, and public lists
- `/cart` — a cart you can bulk-open in browser tabs (via the extension bridge)
- `/chat` — streaming chat with the assistant, can reference your products
- `/profile` — account settings, avatar upload, connected integrations, delete account
- `/api/chat` — server-side streaming proxy to Claude / OpenRouter / Ollama
- `/api/integrations/*` — OAuth start/callback/orders for eBay, Etsy, Reverb

### 3. Browser extension (`apps/extension`)

```bash
npm run dev:extension      # from repo root – Vite watch build into apps/extension/dist
# or
cd apps/extension && npm run dev
```

Then load it:

1. Open `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select `apps/extension/dist`.
3. Open the side panel, sign in, and open **Settings → AI** to choose a provider
   and enter an API key (or point at a local Ollama server).

Production build:

```bash
npm run build:extension
```

How the extension is wired:

- **`background.js`** (service worker) — owns the Supabase client and session,
  makes all LLM/network calls, and drains the local capture queue to Supabase
  every 5s (plus a 1-minute `chrome.alarms` backstop for suspended workers).
- **`detect.js`** — content script on every `http(s)` page. Skips paused state,
  signed-out state, blacklisted domains, and already-captured URLs. Uses
  `src/lib/site-patterns.ts` for known retailers and falls back to the LLM
  otherwise.
- **`bridge.js`** — content script that runs **only** on `localhost:3001` (the
  web app). It relays the "open all cart tabs" request, since browsers block
  multi-`window.open` from a page but allow it from an extension.
- Local state (settings, capture queue, seen URLs, non-product domain blacklist,
  activity log, pause flag) lives in `chrome.storage.local` — see
  `src/lib/storage.ts`.

### 4. Mobile app (`apps/app`)

```bash
cd apps/app
npm install
npm start                  # Expo dev server; press i / a for iOS / Android
```

Native builds use EAS (`eas build`); config is in `apps/app/eas.json` and
`apps/app/app.json`. Bundle IDs: `com.brainrotslop.lani`.

> Expo SDK 57 — read the versioned docs at
> <https://docs.expo.dev/versions/v57.0.0/> before changing native code.

---

## LLM providers

Every surface (extension, web chat, mobile chat) supports the same three
providers, and you bring your own key. Keys are stored client-side only
(`chrome.storage.local` / `localStorage` / Async Storage) and, for web chat, sent
per-request to the `/api/chat` proxy — never persisted server-side.

| Provider     | Key needed | Notes                                                                                      |
| ------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `claude`     | yes        | Anthropic Messages API. Default model `claude-sonnet-5`.                                   |
| `openrouter` | yes        | OpenAI-compatible; use any model slug, e.g. `anthropic/claude-sonnet-5`.                   |
| `ollama`     | no         | Local, OpenAI-compatible endpoint (default `http://localhost:11434/v1`). Default provider. |

The extension uses the LLM for a single yes/no classification per unknown page
(plus tags); the chat surfaces use it for streaming conversation.

---

## Database schema

All tables have row-level security; users only see their own rows unless a list
is explicitly shared or public.

| Table                 | Purpose                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `products`            | Captured/added products. Unique per `(user_id, url)`.                 |
| `lists`               | User lists. One auto-created `Favorites` list per user (undeletable). |
| `list_products`       | Membership join between lists and products.                           |
| `cart_items`          | Products in the user's cart.                                          |
| `chat_sessions`       | Chat threads with the assistant, ordered by last activity.            |
| `chat_messages`       | Messages within a session, with referenced product IDs.               |
| `tracked_products`    | Shared, de-duplicated-by-URL price-tracking targets.                  |
| `price_history`       | Time series of observed prices per tracked product.                   |
| `integrations`        | OAuth tokens for connected marketplaces (eBay, Etsy, Reverb).         |
| `blacklisted_domains` | Domains the user (or the extension's AI) marked as non-product.       |

Storage: a public `avatars` bucket, one folder per user, owner-only writes.

New-user and safety triggers (Favorites creation, Favorites protection) live in
`20260815115530_initial_schema.sql`.

---

## Edge functions

Located in `apps/website/supabase/functions/`, written for Deno.

| Function          | Trigger              | What it does                                                                                                                                                                                                                        |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rescrape-prices` | scheduled (daily)    | Fetches each `tracked_products.url`, extracts a price from static HTML, and appends to `price_history` when it changes. Plain `fetch` + regex — no headless browser, so JS-rendered or bot-walled prices (e.g. Amazon) are skipped. |
| `delete-account`  | authenticated `POST` | Deletes the caller's auth user and cascades away all of their data.                                                                                                                                                                 |

---

## Third-party integrations

`apps/website/app/api/integrations/<provider>/` implements a standard OAuth
flow (`start` → `callback` → `orders`) for **eBay**, **Etsy**, and **Reverb**,
used to pull a user's order / selling history. Tokens are stored in the
`integrations` table (RLS: owner only). Each provider needs its client
id/secret configured as environment/secret values.

---

## Development notes

- **Formatting:** Prettier is configured at the repo root. Run `npm run format`
  (root) or `npm run format` inside `apps/app`.
- **TypeScript:** every app is strict TS. Run `npx tsc --noEmit` in an app dir to
  type-check.
- **Extension hot-reload:** `npm run dev:extension` rewrites `dist/reload.json`
  after each rebuild; the background worker polls it and calls
  `chrome.runtime.reload()` — the closest thing to HMR for an extension.
- **`apps/extension/dist` is committed** so the build output can be loaded
  unpacked without a build step; keep it in sync when you change `src/`.
- **Ports:** the web app runs on **3001** (not 3000) because the extension's
  `bridge.js` content script is scoped to `localhost:3001`.
- **Schema changes:** add a new timestamped file to
  `apps/website/supabase/migrations/` **and** update `schema.sql` to match.
