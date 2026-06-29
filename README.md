# Obsidian Systems Showcase Platform

Next.js showcase, lead capture, AI quote, admin, invoice, and Square checkout platform for Obsidian Systems LLC. This README is the living project specification; when code and documentation disagree, update one of them before shipping.

## Project Overview

The public site presents interactive demo websites for ecommerce, restaurants, healthcare, real estate, professional services, contractors, and repair operators. Visitors can request a customized platform, receive a pricing-system-backed AI estimate, optionally add a monthly retainer, accept the estimate, and pay the invoice deposit through an embedded Square Web Payments checkout.

The private admin portal is protected by the `obsidian_session` cookie and loads Prisma-backed operational data for requests, clients, invoices, payments, demos, users, logs, pricing, and promotions.

## Features

- Interactive landing page and demo showcase.
- Responsive demo layouts across mobile, tablet, and desktop.
- Request capture with client upsert and marketing consent tracking.
- AI-assisted quote generation with deterministic fallback.
- Central cents-only pricing rules used by homepage, AI quotes, promotions, checkout, and admin controls.
- Optional monthly retainer recommendations separated from one-time build pricing.
- Estimate acceptance creates invoices with build, optional retainer, and deposit line items.
- Custom Square Web Payments SDK card checkout.
- Optional Afterpay/Clearpay rendering when Square reports support.
- Square webhook endpoint with signature verification and local status updates.
- Admin login, forced password change, logout, route protection, and admin API guards.
- Prisma-backed admin dashboard, data panels, pricing controls, and promotion controls.

## Installation

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Required:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
AUTH_SECRET="long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

AI quotes:

```env
OPENAI_API_KEY="sk-..."
OPENAI_QUOTE_MODEL="gpt-4o-mini"
```

Square custom checkout:

```env
SQUARE_ENVIRONMENT="sandbox"
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

Analytics and seed helpers:

```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID="G-..."
NEXT_PUBLIC_GTM_ID="GTM-..."
NEXT_PUBLIC_META_PIXEL_ID="..."
SEED_SUPER_ADMIN_TEMP_PASSWORD="temporary-dev-password"
RESET_SUPER_ADMIN_PASSWORD="1"
```

## Database Setup

Prisma uses PostgreSQL.

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:push
npm run db:seed
```

The seed creates roles, an owner account, demo templates, pricing rules, retainer settings, and a disabled launch promotion template.

## AI Quote Assistant

The AI quote assistant lives in `lib/ai.ts` and is invoked by `/api/requests`.

- OpenAI may summarize scope, add-ons, package language, timeline, and complexity.
- Pricing numbers are determined by `lib/pricing.ts`, not by AI output.
- Quotes are normalized before save and never fall below the configured minimum.
- The fallback path is deterministic and keeps demos usable without `OPENAI_API_KEY`.
- Saved `AIQuote` records include normal price, promotional price, selected build price, optional retainer values, promotion ID, scope summary, timeline, and complexity.

## Pricing System

All pricing is stored in integer cents.

- Minimum project price: `50000` ($500).
- Basic Website: `50000` ($500+).
- Business Website: `100000` ($1,000+).
- Ecommerce Website: `200000` ($2,000+).
- Custom Web Application: `300000` ($3,000+).
- Complex Business System: custom discovery pricing with a configured floor.
- Essential Retainer: `20000` ($200/month).
- Commerce Retainer: `35000` to `50000` ($350-$500/month).
- Enterprise Retainer: custom.

Source files:

- `lib/pricing-config.ts` contains client-safe defaults and formatting.
- `lib/pricing.ts` loads active database rules, falls back to defaults, resolves categories, applies active promotions, and normalizes cents.
- `PricingRule` is the database-backed admin-editable pricing table.

## Promotions

Promotions are stored in `Promotion` and managed from the admin Pricing & Promotions module or `/api/admin/promotions`.

Fields:

- `name`
- `description`
- `active`
- `normalPrice`
- `promoPrice`
- `normalRetainer`
- `promoRetainer`
- `maxUses`
- `currentUses`
- `startDate`
- `endDate`

Active promotions automatically influence AI quote pricing when the promotion is active, within date bounds, and has remaining usage slots. Checkout increments `currentUses` after an invoice is created from a promoted quote.

## Retainers

Every quote displays:

- One-time project build price.
- Optional monthly services / retainer recommendation.

Retainers are not automatically included. The customer must select build + retainer in the quote UI before checkout includes the monthly retainer line item.

## Admin Portal

Admin is available at `/admin`.

- `/admin/login` signs staff in.
- `/admin/password` handles forced password changes.
- `/admin/logout` destroys the session cookie and redirects to login.
- `/admin` is protected by `getSessionUser`.
- `/api/admin/*` routes use `requireAdminSession`.

Implemented admin surfaces include dashboard stats, requests, clients, invoices, payment tracking, pipeline summaries, demo records, AI control summary, retainers, analytics, users, logs, pricing rules, and promotions. Pricing and promotion records can be edited through authenticated admin forms.

## Square Payments

The checkout is custom and does not use Square-hosted checkout pages.

- `/api/payments/square` `GET` returns only public Square config: environment, application ID, location ID, and Afterpay enablement.
- The invoice page loads Square Web Payments SDK.
- The browser tokenizes card details and sends the token to `/api/payments/square`.
- The server reloads the invoice, validates the deposit amount, creates the Square payment, stores `PaymentRecord`, and updates invoice status.
- Idempotency keys are sent to Square and stored in payment metadata.

Secrets such as Square access tokens and OpenAI keys are never exposed to the browser.

## Webhooks

`/api/square/sync` receives Square webhook events.

- Verifies HMAC signature when `SQUARE_WEBHOOK_SIGNATURE_KEY` is configured.
- Updates local payment records and invoices.
- Maps Square statuses to local `PaymentStatus` / `InvoiceStatus`.
- Handles completed, pending, failed, canceled, and refunded-style state changes where Square payload data is available.

## Architecture Documentation

Data flow:

1. Visitor submits `RequestQuoteModal`.
2. `/api/requests` validates input, upserts `Client`, creates `ProjectRequest`, resolves server pricing, generates/saves `AIQuote`, and logs analytics.
3. Quote UI displays one-time build and optional retainer separately.
4. `/api/checkout/accept-estimate` ignores client totals, reloads server quote/pricing, creates `Invoice` and `InvoiceLineItem` records, and increments promotion usage.
5. `/invoices/[id]` displays the invoice and Square checkout.
6. `/api/payments/square` validates invoice amount and stores the payment result.
7. `/api/square/sync` reconciles async Square status changes.

Authentication flow:

1. `/admin/login` verifies bcrypt password and signs a JWT with `AUTH_SECRET`.
2. The JWT is stored as an HTTP-only `obsidian_session` cookie.
3. Admin pages and APIs read the session through `getSessionUser`.
4. `/admin/logout` deletes the cookie.

Admin flow:

1. `/admin` loads `getAdminPortalData` server-side.
2. The client portal switches modules locally.
3. Mutating admin modules call guarded `/api/admin/*` endpoints.
4. After mutation, the portal refreshes server-loaded data.

## Database Documentation

Core models:

- `User`, `Role`, `TrustedDevice`, `AuditLog`, `SiteLog`
- `Client`, `ProjectRequest`, `AIQuote`
- `PricingRule`, `Promotion`
- `Invoice`, `InvoiceLineItem`, `PaymentRecord`
- `Retainer`, `Project`, `Task`
- `DemoTemplate`, `Announcement`, `Event`, `MediaAsset`, `CaseStudy`
- `AnalyticsEvent`, `IntegrationSetting`, `DeploymentProfile`

Important relationships:

- `Client` has many requests, invoices, projects, retainers, and media assets.
- `ProjectRequest` may have one `AIQuote` and many invoices.
- `AIQuote` may reference one `Promotion`.
- `Invoice` has many line items and payment records.
- `PaymentRecord` belongs to an invoice.
- `PricingRule` is standalone configuration used by pricing services.
- `Promotion` has many AI quotes and usage counters.

Migration note:

- The current build script runs `prisma db push`; production should move to migration-only deploys when schema churn settles.

## API Documentation

Public and checkout:

- `POST /api/requests` creates a request and AI quote.
- `POST /api/ai/quote` generates a quote preview.
- `POST /api/checkout/accept-estimate` creates an invoice from a server-validated estimate.
- `POST /api/checkout/manual-review` flags a request for manual review.
- `GET /api/invoices/[id]` returns invoice data.
- `POST /api/invoices/[id]/respond` stores approve/revise/deny responses.
- `GET /api/payments/square` returns frontend-safe Square config.
- `POST /api/payments/square` processes a tokenized Square payment.
- `POST /api/square/sync` processes Square webhook events.

Admin:

- `GET/PATCH /api/admin/pricing` lists and edits pricing rules.
- `GET/POST/PATCH /api/admin/promotions` lists, creates, and edits promotions.
- Other `/api/admin/*` routes manage clients, users, requests, demos, events, announcements, and integration settings.

Exports and analytics:

- `GET /api/exports/[audience]` exports audience data.
- `POST /api/analytics` records analytics events.
- `POST /api/logs/site` records site logs.

## Deployment

Vercel deployment uses:

```bash
npm run build
```

Production must provide `DATABASE_URL`, `AUTH_SECRET`, Square variables, and `NEXT_PUBLIC_APP_URL`. Run `npm run prisma:deploy` for migration-based deployments. The current script still includes `prisma db push`; treat that as temporary technical debt.

## Troubleshooting

- Admin login fails: run `npm run db:seed`, confirm `DATABASE_URL`, and use the generated temporary password.
- Admin redirects to password page: the seeded owner account has `mustChangePassword=true`.
- AI quote uses fallback: set `OPENAI_API_KEY`; otherwise fallback quote mode is expected.
- Quote price seems wrong: check active `PricingRule` and `Promotion` records first.
- Promotion does not apply: confirm active status, dates, and remaining `maxUses`.
- Square form does not appear: set application/location IDs for the selected Square environment.
- Square payment fails: confirm access token, location ID, environment, browser domain, and deposit amount.
- Webhook returns 401: verify `SQUARE_WEBHOOK_SIGNATURE_KEY` and notification URL.
- Afterpay is hidden: Square may not support it for the account, amount, currency, location, or environment.

## Feature Checklist

Implemented:

- Public landing page and demo showcase.
- Responsive demo layouts.
- Project request capture with client upsert.
- AI quote generation with OpenAI plus safe fallback.
- Centralized cents-only pricing defaults and database-backed pricing rules.
- Promotion model, admin APIs, admin forms, date windows, slot counts, and AI quote influence.
- Optional retainer display and checkout inclusion.
- Quote persistence to database.
- Estimate acceptance creating local invoices.
- Client invoice response persistence.
- Custom invoice page.
- Square Web Payments SDK card tokenization path.
- Server-side Square payment creation with local payment records.
- Server-side payment amount validation.
- Square webhook endpoint with signature verification.
- Admin session login, forced password change, and logout.
- Admin route and API protection.
- Prisma-backed admin dashboard and data panels.
- Seeded roles, owner account, demo templates, pricing rules, promotion template, and retainer settings.

Partially Implemented:

- Admin CRUD is functional for pricing/promotions and data-backed for review panels, but not every module has full create/edit/delete forms.
- Pipeline is database-backed but not drag-and-drop persisted.
- Retainers are optional line items, but Square subscription billing is not automated.
- Integration settings persist but do not have a polished editing workspace.
- Afterpay/Clearpay is wired opportunistically through Square SDK and depends on account/location eligibility.

Planned:

- Full admin CRUD forms for every module.
- AI quote approval/editing screen with staff overrides.
- Client portal login and project-progress views.
- File upload/media management.
- Task assignment workflow UI.
- Production notification emails.
- Square refund handling UI.
- Automated tests for quote, checkout, admin, and webhook routes.

Technical Debt:

- Production `build` currently runs `prisma db push`; migration-only deploys are safer.
- Public invoice URLs rely on unguessable invoice IDs rather than separate signed client tokens.
- Payment idempotency is stored in metadata rather than a dedicated database column.
- Some admin modules summarize data rather than providing full management workspaces.
- Local development requires a reachable PostgreSQL database; no SQLite fallback is configured.

## Project Status

Production Ready:

- Public demo showcase.
- Request capture.
- Admin authentication/logout.
- Admin API protection.
- Server-side pricing validation.
- Square card payment path when environment variables are configured.

Beta:

- AI quote assistant.
- Pricing and promotions management.
- Optional retainer checkout line items.
- Square webhook reconciliation.
- Admin dashboard and review panels.

In Development:

- Full admin CRUD across every operational module.
- Rich AI quote review and override tooling.
- Retainer subscription billing.
- Client portal.

Planned:

- Notification emails.
- File/media uploads.
- Refund UI.
- Automated route and payment tests.

## Changelog

2026-06-28:

- Added centralized cents-only pricing defaults and server pricing resolver.
- Added `PricingRule` and `Promotion` Prisma models.
- Added quote fields for normal price, promotional price, selected build price, retainer pricing, and promotion linkage.
- Added admin Pricing & Promotions module with editable pricing and promotion forms.
- Added guarded `/api/admin/pricing` and `/api/admin/promotions` endpoints.
- Updated AI quotes so AI can explain pricing but server rules decide final numbers.
- Updated checkout to validate build totals server-side and keep retainers optional.
- Updated homepage pricing references to use shared pricing configuration.
- Documented payment, webhook, pricing, promotion, architecture, API, database, checklist, and project status.

Breaking / deployment notes:

- Run Prisma generate and push/deploy schema before using the new pricing and promotion tables.
- Existing AI quotes may not have the new optional pricing fields populated.
