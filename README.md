# Obsidian Systems Showcase Platform

A Next.js showcase and lead-to-checkout platform for Obsidian Systems LLC. The app presents interactive demo websites, captures custom project requests, generates AI-assisted estimates, creates branded invoices, and processes deposits through a custom Square Web Payments checkout.

## What The App Does

The public site lets visitors browse industry-specific demos, open a request form, describe their project, receive a preliminary quote, accept the estimate, and continue to a custom invoice checkout page. The internal admin portal lets staff review requests, clients, quotes, invoices, payments, analytics, logs, demos, settings, users, and pipeline data from Prisma-backed records.

## Customer Flow

1. A visitor opens `/` or `/demos`.
2. They choose a demo style and click a quote/customization CTA.
3. `RequestQuoteModal` posts the request to `/api/requests`.
4. The API upserts the client, creates a `ProjectRequest`, generates an `AIQuote`, and stores both.
5. The visitor accepts the estimate.
6. `/api/checkout/accept-estimate` creates an invoice and returns `/invoices/:id`.
7. The invoice page loads invoice details, lets the client approve/revise/deny, and loads Square Web Payments SDK for deposit collection.

## Admin Portal

Admin is available at `/admin`.

- `/admin/login` signs staff in with the seeded database user.
- `/admin/password` handles forced password changes.
- `/admin/logout` clears the session cookie and returns to the login page.
- `/admin` is protected by the signed `obsidian_session` cookie.
- Admin data is loaded server-side from Prisma through `getAdminPortalData`.
- Admin API routes under `/api/admin/*` require an authenticated admin session and role permissions.

The portal currently shows live records for dashboard stats, project requests, clients, invoices, payment records, projects, retainers, demos, analytics, users, integration settings, and logs.

## AI Quote Assistant

The quote system lives in `lib/ai.ts` and `/api/requests`.

- Uses `OPENAI_API_KEY` and `OPENAI_QUOTE_MODEL` when configured.
- Falls back to deterministic local pricing when OpenAI is unavailable.
- Saves the generated quote to `AIQuote`.
- Saves the request to `ProjectRequest`.
- Accepting a quote creates an `Invoice`.
- Requesting manual review updates the request status and logs the action.

The fallback quote path is intentional so local development and demos remain usable without an OpenAI key.

## Square Payment Flow

The checkout is custom and does not redirect to Square-hosted checkout.

- Frontend loads Square Web Payments SDK on `/invoices/:id`.
- `/api/payments/square` `GET` returns only frontend-safe Square values: environment, application ID, location ID, and Afterpay enablement.
- The browser tokenizes card details through Square and sends the source token to `/api/payments/square`.
- The backend loads the invoice, validates the deposit amount server-side, creates a Square payment, stores a `PaymentRecord`, and updates invoice status.
- `/api/square/sync` receives Square webhooks, verifies the HMAC signature when `SQUARE_WEBHOOK_SIGNATURE_KEY` is configured, and updates local payment/invoice status.

Afterpay/Clearpay is attempted only when `SQUARE_ENABLE_AFTERPAY=1` and the Web Payments SDK reports support. If Square, the account, currency, amount, or location does not support it, the option is hidden/disabled without breaking card checkout.

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Required for local development:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Optional locally, required for production AI quotes:

```env
OPENAI_API_KEY="sk-..."
OPENAI_QUOTE_MODEL="gpt-4o-mini"
```

Required for Square custom checkout:

```env
SQUARE_ENVIRONMENT="sandbox" # or "production"
SQUARE_SANDBOX_ACCESS_TOKEN="..."
SQUARE_SANDBOX_APPLICATION_ID="..."
SQUARE_SANDBOX_LOCATION_ID="..."
SQUARE_PRODUCTION_ACCESS_TOKEN="..."
SQUARE_PRODUCTION_APPLICATION_ID="..."
SQUARE_PRODUCTION_LOCATION_ID="..."
SQUARE_WEBHOOK_SIGNATURE_KEY="..."
SQUARE_WEBHOOK_NOTIFICATION_URL="https://your-domain.com/api/square/sync"
SQUARE_ENABLE_AFTERPAY="0"
```

Optional analytics:

```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID="G-..."
NEXT_PUBLIC_GTM_ID="GTM-..."
NEXT_PUBLIC_META_PIXEL_ID="..."
VERCEL="1"
```

Seed helpers:

```env
SEED_SUPER_ADMIN_TEMP_PASSWORD="temporary-dev-password"
RESET_SUPER_ADMIN_PASSWORD="1"
```

## Database

Prisma uses PostgreSQL. Schema objects include users/roles, clients, project requests, AI quotes, invoices, line items, payment records, retainers, projects, tasks, demo templates, analytics, logs, and integration settings.

Commands:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:push
npm run db:seed
```

The seed creates roles, a super admin, demo template records, and managed retainer settings.

## Deployment

Vercel deployment works with the included `build` script:

```bash
npm run build
```

Production must provide `DATABASE_URL`, `AUTH_SECRET`, Square variables, and `NEXT_PUBLIC_APP_URL`. Use `npm run prisma:deploy` for migration-based production deploys. The current `build` script also runs `prisma db push`; consider removing `db push` from production builds once migrations are the only schema path.

## Troubleshooting

- Admin login fails: run `npm run db:seed`, confirm `DATABASE_URL`, and use the generated temporary password.
- Admin redirects to password page: the seeded owner account has `mustChangePassword=true`.
- AI quote does not call OpenAI: set `OPENAI_API_KEY`; otherwise fallback quote mode is expected.
- Square form does not appear: set frontend-safe Square application/location IDs for the selected environment.
- Square payment fails: confirm access token, location ID, Web Payments application ID, sandbox vs production environment, and that the browser domain is allowed in Square.
- Webhook returns 401: verify `SQUARE_WEBHOOK_SIGNATURE_KEY` and `SQUARE_WEBHOOK_NOTIFICATION_URL` exactly match the Square dashboard notification URL.
- Afterpay is hidden: Square may not support it for the account, amount, currency, location, or environment.

## Checklist

Fully implemented:

- Interactive public landing page and demo showcase.
- Responsive demo layouts across mobile, tablet, and desktop.
- Project request capture with client upsert.
- AI quote generation with OpenAI and safe fallback.
- Quote persistence to database.
- Estimate acceptance creating a local invoice.
- Client invoice response persistence.
- Custom invoice page.
- Square Web Payments SDK card tokenization path.
- Server-side Square payment creation with local payment records.
- Server-side deposit amount validation.
- Idempotency key forwarding to Square.
- Square webhook endpoint with signature verification.
- Admin session login, forced password change, and logout.
- Admin page protection.
- Admin API route authentication guards.
- Prisma-backed admin dashboard and data panels.
- Seeded roles, owner account, demo templates, and retainer settings.

Partially implemented:

- Admin record mutation UI is mostly read/review oriented; some create/update actions exist through APIs but not full CRUD screens.
- Pipeline is database-backed but not drag-and-drop persisted.
- Retainers are visible, but Square subscription billing is not fully automated.
- Integration settings are persisted but do not yet have a polished editing screen.
- Afterpay/Clearpay support is wired opportunistically through Square SDK but depends on Square account/location eligibility.

Still needing implementation:

- Full admin CRUD forms for every module.
- Rich AI quote approval/editing screen with pricing overrides.
- Client portal login and project-progress views.
- File upload/media management.
- Task assignment workflow UI.
- Production-grade notification emails.
- Square refund handling UI, though webhook status mapping exists.
- Automated tests for quote, checkout, admin, and webhook routes.

Known issues / technical debt:

- The production `build` script currently runs `prisma db push`; migration-only deploys are safer.
- Public invoice response URLs rely on unguessable invoice IDs rather than a separate signed client token.
- Payment records do not have a dedicated idempotency column; idempotency is stored in metadata and sent to Square.
- Some admin modules are intentionally summarized rather than full management workspaces.
- Local development requires a reachable PostgreSQL database; no SQLite fallback is configured.
