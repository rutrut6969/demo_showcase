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
- Estimate acceptance creates invoices with project build line items, separate deposit due, and separate optional retainer metadata.
- Mobile-first step checkout: review, approval, payment, and confirmation.
- Custom Square Web Payments SDK card checkout that activates only after invoice approval.
- Client portal payment methods with Square-vaulted saved cards.
- Remaining-balance and future-invoice payment support using saved Square cards.
- Optional Afterpay/Clearpay rendering when Square reports support.
- Square webhook endpoint with signature verification and local status updates.
- Square-backed retainer subscription records with active, pending setup, past due, and canceled status tracking.
- Admin login, forced password change, logout, route protection, and admin API guards.
- Prisma-backed admin dashboard, data panels, pricing controls, and promotion controls.
- Admin invoice review controls for approve, revise, deny, cancel, mark reviewed, and incomplete-checkout cleanup.
- Admin customer management for editing, archiving, deleting when safe, anonymizing paid-history clients, opt-out, tags, segments, notes, and consent data.

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
SQUARE_RETAINER_PLAN_VARIATION_ID="..."
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

Retainers are optional monthly services. They are tracked separately from one-time build cost and are not charged as one-time invoice line items.

When a customer selects a retainer and has a saved card on file, the app attempts to create a Square subscription and links the local `Retainer` to Square with `squareSubscriptionId`, `squareCustomerId`, `squareCardId`, billing cadence, next billing date, status, failure count, and last payment state. If `SQUARE_RETAINER_PLAN_VARIATION_ID` is not configured, the local retainer remains `PENDING_SETUP` and the notification queue receives a follow-up record instead of charging incorrectly.

Customers can view retainer status at `/client/retainers`. Customers and admins can cancel retainers; cancellation calls Square when a subscription ID exists and then marks the local retainer `CANCELED`.

## Admin Portal

Admin is available at `/admin`.

- `/admin/login` signs staff in.
- `/admin/password` handles forced password changes.
- `/admin/logout` destroys the session cookie and redirects to login.
- `/admin` is protected by `getSessionUser`.
- `/api/admin/*` routes use `requireAdminSession`.
- `/api/admin/login` returns `{ success, session, mustChangePassword, redirectTo }` and sets the HTTP-only session cookie; the login form redirects to `/admin/password` when password setup is required, otherwise to `redirectTo` or `/admin`.

Implemented admin surfaces include dashboard stats, requests, clients, invoices, payment tracking, pipeline summaries, demo records, AI control summary, retainers, analytics, users, logs, pricing rules, and promotions. Pricing, promotion, invoice review, incomplete invoice cleanup, and customer records can be edited through authenticated admin forms and APIs.

Invoice actions:

- `POST /api/admin/invoices/[id]/action` handles approve, revise, deny, cancel, mark reviewed, and delete/archive incomplete checkout.
- Paid invoices cannot be deleted from the cleanup control.
- Invoices with payment history but no paid deposit are archived/cancelled instead of hard-deleted.
- Admin invoice rows show invoice status, deposit paid amount, failed payment records, review state, and selected retainer follow-up details.
- Invoice actions write `AuditLog` records.

Customer actions:

- `GET/POST /api/admin/clients` lists and creates customers.
- `GET/PATCH/DELETE /api/admin/clients/[id]` views, edits, archives, restores, deletes safe records, or anonymizes paid-history customers.
- Customers with paid invoices are not hard-deleted; the admin API anonymizes and archives them.
- Customer records support notes, tags, segments, UTM metadata, selected demo, source, landing page, referrer, consent timestamp, and opt-out state.

Retainer actions:

- Admin retainer cards show payment status, Square subscription status, saved-card presence, next billing, failure count, and follow-up warnings.
- `POST /api/admin/retainers/[id]/cancel` cancels an active Square subscription when present and records an audit log.
- Past-due subscription signals from Square create notification records for follow-up.

## Square Payments

The checkout is custom and does not use Square-hosted checkout pages.

- `/api/payments/square` `GET` returns only public Square config: environment, application ID, location ID, and Afterpay enablement.
- The invoice page loads Square Web Payments SDK only after the invoice enters the payment step.
- The browser tokenizes card details and sends the token to `/api/payments/square`.
- The server reloads the invoice, verifies the invoice is approved and not archived/cancelled/denied/revision-requested, validates the deposit amount, creates the Square payment, stores `PaymentRecord`, and updates invoice status to `DEPOSIT_PAID`.
- Idempotency keys are sent to Square, stored on `PaymentRecord`, and checked before retrying duplicate payment attempts.
- Failed Square attempts are stored as failed payment records while the invoice remains approved for retry.

Secrets such as Square access tokens and OpenAI keys are never exposed to the browser.

## Saved Cards

Saved cards are vaulted in Square, not in this database.

- `/client/payment-methods` requires a client session.
- The browser uses Square Web Payments SDK to tokenize card details.
- `/api/client/payment-methods` creates or links a Square Customer, stores the Square card through the Cards API, and saves only `squareCustomerId`, `squareCardId`, card brand, last four, expiration month/year when provided by Square, billing ZIP when safely provided, and default-card state.
- Customers can set a default card or remove a saved card. Removing a card disables it in Square and soft-disables it locally.
- Admin can see whether a client has a saved card, but never full card details.
- The app must never store PAN, CVV, raw card tokens, or full sensitive card data, and should not log source IDs or card tokens.
- `/api/client/invoices/[id]/pay-remaining` verifies client ownership, reloads the invoice server-side, prevents duplicate paid balances, and charges the remaining balance using a saved Square card.

## Webhooks

`/api/square/sync` receives Square webhook events.

- Verifies HMAC signature when `SQUARE_WEBHOOK_SIGNATURE_KEY` is configured.
- Updates local payment records and invoices.
- Maps Square statuses to local `PaymentStatus` / `InvoiceStatus`.
- Handles completed, pending, failed, canceled, and refunded-style state changes where Square payload data is available.
- Handles `subscription.created`, `subscription.updated`, `subscription.canceled`, `invoice.created`, `invoice.published`, `invoice.payment_made`, failed invoice payment events, `payment.created`, `payment.updated`, and refund-style payment state updates when Square includes the relevant IDs.
- Failed or declined retainer payments mark the retainer `PAST_DUE`, increment failure count, store a safe failure reason when available, and create a pending notification record.
- Later successful retainer payment events move the retainer back to `ACTIVE` and create a success notification record.
- Webhook site logs store event type and Square IDs/status only, not the full raw payload.

## Architecture Documentation

Data flow:

1. Visitor submits `RequestQuoteModal`.
2. `/api/requests` validates input, upserts `Client`, stores marketing/source metadata, creates `ProjectRequest`, resolves server pricing, generates/saves `AIQuote`, and logs analytics.
3. Quote UI displays one-time build and optional retainer separately.
4. `/api/checkout/accept-estimate` ignores client totals, reloads server quote/pricing, creates `Invoice` and project-build `InvoiceLineItem` records, stores deposit due separately, stores optional retainer metadata separately, and increments promotion usage.
5. `/invoices/[id]` opens a mobile-first checkout stepper.
6. Customer reviews the invoice, approves it, selects optional retainer follow-up, enters Square card details, and pays the deposit.
7. `/api/payments/square` validates invoice eligibility and amount server-side, stores the payment result, and updates paid invoices to `DEPOSIT_PAID`.
8. Paid invoices can generate a client portal claim link.
9. Authenticated clients can vault cards through Square, pay remaining balances with saved cards, and manage retainer billing.
10. `/api/square/sync` reconciles async Square payment and retainer subscription status changes.

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
- `Client` stores marketing metadata: consent timestamp, opt-out state, UTM fields, landing page, referrer, selected demo, device/browser info, tags, segments, archive/delete/anonymize timestamps.
- `ProjectRequest` stores request-level source metadata alongside selected demo and quote scope.
- `ProjectRequest` may have one `AIQuote` and many invoices.
- `AIQuote` may reference one `Promotion`.
- `Invoice` has many line items and payment records.
- `Invoice` stores admin review/cancel/archive timestamps and admin notes for operations review.
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
- `POST /api/invoices/[id]/respond` stores approve/revise/deny responses and returns `{ ok, invoice, nextStep, message }`.
- `GET /api/payments/square` returns frontend-safe Square config.
- `POST /api/payments/square` processes a tokenized Square payment only for approved, non-archived invoices.
- `POST /api/square/sync` processes Square webhook events.

Admin:

- `GET/PATCH /api/admin/pricing` lists and edits pricing rules.
- `GET/POST/PATCH /api/admin/promotions` lists, creates, and edits promotions.
- `POST /api/admin/invoices/[id]/action` performs authenticated invoice review and cleanup actions.
- `GET/POST /api/admin/clients` and `GET/PATCH/DELETE /api/admin/clients/[id]` manage customer records with archive/anonymize safety rules.
- Other `/api/admin/*` routes manage users, requests, demos, events, announcements, and integration settings.

Exports and analytics:

- `GET /api/exports/[audience]` exports audience data and requires admin authentication. Filters include `marketingConsent`, `source`, `selectedDemo`, `createdFrom`, `createdTo`, `abandonedCheckout`, `paidClient`, and `retainerClient`.
- `POST /api/analytics` records analytics events.
- `POST /api/logs/site` records site logs.

## Deployment

Vercel deployment uses:

```bash
npm run build
```

Production must provide `DATABASE_URL`, `AUTH_SECRET`, Square variables, and `NEXT_PUBLIC_APP_URL`. Run `npm run prisma:deploy` for migration-based deployments. The current script still includes `prisma db push`; treat that as temporary technical debt.

Before relying on automatic Vercel deploys, verify production env values are non-empty in Vercel. The build requires `DATABASE_URL` because `npm run build` runs `prisma db push` before `next build`.

## Troubleshooting

- Admin login fails: run `npm run db:seed`, confirm `DATABASE_URL`, and use the generated temporary password.
- Admin redirects to password page: the seeded owner account has `mustChangePassword=true`.
- Admin login returns 200 but stays on the same page: inspect the `/api/admin/login` JSON response. A successful response must include `success: true` and `session.userId`; otherwise the client intentionally shows an incomplete-session error instead of navigating.
- Admin login works locally but not in production: confirm `AUTH_SECRET` is set, the app is served over HTTPS so the secure cookie can be stored, and the browser receives the `obsidian_session` `Set-Cookie` header from `/api/admin/login`.
- Admin export returns 401/403: exports are intentionally admin-only; sign in with a role that has `clients:manage`.
- Incomplete invoice cleanup is blocked: paid invoices are protected. Use archive/anonymize style workflows for records with financial history.
- AI quote uses fallback: set `OPENAI_API_KEY`; otherwise fallback quote mode is expected.
- Quote price seems wrong: check active `PricingRule` and `Promotion` records first.
- Promotion does not apply: confirm active status, dates, and remaining `maxUses`.
- Square form does not appear before approval: expected behavior. The Square SDK loads only after the invoice is approved and the checkout enters the payment step.
- Square form does not appear after approval: set application/location IDs for the selected Square environment and confirm the invoice status is `APPROVED`.
- Square payment fails: confirm access token, location ID, environment, browser domain, and deposit amount.
- Payment returns 409: the server blocks payment for denied, revision-requested, cancelled, draft, archived, or unapproved invoices.
- Webhook returns 401: verify `SQUARE_WEBHOOK_SIGNATURE_KEY` and notification URL.
- Saved card fails: confirm Square customer/card vaulting credentials, environment, and card tokenization are configured; never paste raw card data into logs or env files.
- Retainer stays pending setup: configure `SQUARE_RETAINER_PLAN_VARIATION_ID` and make sure the customer has a saved default card.
- Afterpay is hidden: Square may not support it for the account, amount, currency, location, or environment.

## Checkout Testing

Use Square sandbox credentials in non-production environments.

1. Generate a quote from a demo request.
2. Accept the estimate and confirm redirect to `/invoices/[id]`.
3. Review the mobile invoice summary.
4. Continue to approval and approve the invoice.
5. Confirm the UI moves to the payment step and scrolls the payment section into view.
6. Confirm the Square card form initializes.
7. Pay the deposit with a Square sandbox card.
8. Confirm the invoice moves to the confirmation screen and status becomes `DEPOSIT_PAID`.
9. Confirm admin invoices show paid deposit and payment record.
10. Confirm failed payments show a visible error and create failed payment records.
11. Confirm denied, revision-requested, cancelled, draft, and archived invoices cannot be paid.
12. Claim or sign in to the client portal and save a card at `/client/payment-methods`.
13. Confirm saved cards can be set default/removed and that admin sees only safe saved-card presence.
14. Select a retainer, save/use a card, and confirm the retainer moves to active when Square subscription configuration is available.
15. Send a Square failure webhook and confirm the retainer becomes `PAST_DUE` with a pending notification record.

## Production Architecture Pass Roadmap

This section preserves the large production architecture pass as a step-by-step continuation plan. The two attached pass files from June 29, 2026 were identical, so they are tracked here as one consolidated pass.

### Pass Steps

1. Homepage restructure: split public work into Live Production Websites and Showcase Demos, add filters, remove K&K from internal demos, and link real client sites directly.
2. AI consultant modal redesign: replace the current quote modal with a mobile-first guided consultation with six steps, progress, saved progress, and demo-aware defaults.
3. AI consultant system: keep pricing server-controlled while AI acts as a sales consultant, scope advisor, risk reviewer, and phased implementation guide.
4. AI processing experience: make submission feel alive with duplicate-submit protection, progress messaging, retry, preserved data, delayed-state messaging, and fallback consultation.
5. Pricing rules: keep minimum pricing, typical package floors, promotions, and final pricing authority on the server.
6. Budget awareness: when requested scope exceeds budget, show full, budget, and phased options with deferrable features.
7. Payment options: support deposits, payment plans, Afterpay/Clearpay when eligible, future financing, and phased development messaging.
8. Retainer simplification: keep the default $200/month retainer, support promotional retainers, and keep retainers optional.
9. Saved payment methods: vault cards in Square and store only Square customer/card IDs plus safe card metadata.
10. Client portal: support account claim/login, invoices, payments, remaining balance, retainer status, saved cards, project status, timeline, and support requests.
11. Invoice timeline: track and show invoice/project/retainer milestones to admin and customer.
12. Remaining balance workflow: let admin create/copy/email balance payment links and let customers pay early or after completion.
13. Retainer subscriptions: use Square subscriptions with monthly billing, failed payment tracking, cancellation, and notifications.
14. Sandbox cleanup: let Super Admin purge paid invoices, payments, customers, and test data only in sandbox; never hard-delete paid production records.
15. Dashboard improvements: make dashboard cards clickable and route users into the proper module/filter.
16. Remove placeholders: implement or hide non-functional admin tabs and remove dead buttons.
17. Production hardening: run `npm ci`, `npm run lint`, `npx prisma validate`, `npx prisma generate`, `npx tsc --noEmit`, and `npm run build`.
18. README upkeep: keep features, changelog, architecture, pricing, retainers, AI, checkout, portal, roadmap, and technical debt current after each pass.

### Completed In This Repo

- Server-controlled pricing is implemented in `lib/pricing.ts` and `lib/pricing-config.ts`; AI quote output does not determine final pricing.
- Minimum and typical package pricing floors are represented in shared pricing config and database-backed `PricingRule` records.
- Promotions can override build and retainer pricing through the `Promotion` model and admin Pricing & Promotions module.
- Request capture stores contact details, business type, selected demo metadata, desired features, budget range, timeline, notes, marketing consent, UTM fields, landing page, referrer, device info, and browser info.
- Demo-launched quote requests already pass selected demo, demo category, recommended package, source page, and estimated complexity into the request modal.
- AI quote generation has an OpenAI path plus deterministic fallback, stores quotes in `AIQuote`, and keeps manual review notes.
- AI quote submission disables duplicate submit through loading state and falls back instead of leaving the customer on a blank/frozen page.
- Deposit checkout is implemented as a mobile-first invoice flow with review, approval, payment, and confirmation steps.
- Square Web Payments SDK tokenization is implemented for deposit checkout.
- Server-side payment validation reloads invoices, blocks denied/revision/cancelled/draft/archived/unapproved invoices, validates deposit amounts, stores idempotency keys, and prevents duplicate paid deposits.
- Afterpay/Clearpay rendering is wired opportunistically through Square SDK when account/location/amount eligibility allows it.
- Retainers are optional, separated from one-time build totals, and currently default through the pricing system at the $200/month tier when applicable.
- Saved payment methods are implemented in `/client/payment-methods`; Square vaults cards and the app stores only Square IDs plus safe metadata such as brand, last four, expiration month/year, billing ZIP, and default-card state.
- Customers can save, remove, and set default cards from the client portal.
- Client account claim/login exists through `ClientPortalInvite`, `ClientUser`, `/client/login`, and `/api/client/claim`.
- Remaining balance payment by saved card exists at `/api/client/invoices/[id]/pay-remaining` with client ownership checks.
- Retainer subscription records include Square subscription/customer/card IDs, monthly amount, billing cycle, next billing date, status, failed payment count, last payment status, failure reason, and cancellation timestamp.
- Retainer subscription creation is attempted when a selected retainer has a saved card and `SQUARE_RETAINER_PLAN_VARIATION_ID` is configured.
- Square webhook sync updates payment records, invoice state, retainer active/past-due/canceled state, failed payment counts, and pending notification records.
- Client retainer status and cancellation are available at `/client/retainers`.
- Admin retainer status and cancellation are available in the Retainers panel and `/api/admin/retainers/[id]/cancel`.
- Production delete safety exists for incomplete invoice cleanup; paid invoices are protected from hard delete in normal admin cleanup.
- Admin invoice review actions exist for approve, revise, deny, cancel, mark reviewed, and delete/archive incomplete checkout.
- Admin customer management exists for view/list, edit, archive, delete when safe, anonymize paid-history customers, notes, tags, segments, source, consent, and opt-out state.
- Admin customer exports are protected by admin authentication and support audience filters.
- Homepage restructure is implemented: live production websites and showcase demos are separated, filterable by All/Production Websites/Showcase Demos, and each card exposes the correct inspect/request actions.
- K&K Kustom Kreations is represented as a Live Production Website linked directly to the live client site instead of being surfaced as an internal demo project card.
- README is already treated as the source of truth and has current sections for features, architecture, pricing, retainers, checkout, portal, roadmap/status, technical debt, and changelog.

### Incomplete Or Needs A Focused Future Pass

- The quote modal is not yet the requested six-step guided AI consultation. It is a single modal form with contact, business, budget, timeline, features, notes, and quote preview.
- Consultation progress indicator, step navigation, save-progress behavior, and form-resume behavior are not implemented.
- Website type selection does not yet include the full requested dropdown list, and demo-specific recommended features are not pre-selected.
- AI system prompt still frames the model as generating conservative project estimates rather than the full senior solutions consultant prompt with risks, budget concerns, phased plans, and financing recommendations.
- Budget-aware output is incomplete. The current quote returns one recommended estimate rather than distinct full solution, budget solution, and phased solution options when the budget is too low.
- AI processing UX is partial. There is loading state and fallback, but not rotating loading messages, animated progress bar, step indicator, 10-30 second expectation text, delayed-state message, or explicit retry flow.
- Payment plan and future financing messaging are not fully modeled in quote output, checkout, or admin workflows.
- Client portal is partial. It currently covers login/claim, saved cards, retainer status, and saved-card balance payment APIs, but not a full portal dashboard with invoice list, project status, timeline, file sharing, invoice downloads, or support requests.
- Invoice timeline is incomplete. The schema has timestamps for created/viewed/approved/reviewed/cancelled/archived and payment records, but there is no unified customer/admin timeline for created, viewed, approved, deposit paid, project started, balance sent, final payment, retainer activated, and retainer canceled.
- Remaining balance admin workflow is incomplete. The customer payment API exists, but admin cannot yet create/copy/email a remaining-balance payment link from the panel.
- Retainer subscriptions are partial. Square subscription creation and webhook status tracking exist, but full recurring billing verification, retry/update-payment-method workflows, and production email notifications are not complete.
- Notification records exist, but actual customer email delivery for retainer start, payment success, payment failure, past due, and cancellation is not implemented.
- Sandbox cleanup is incomplete. There is no Super Admin-only sandbox purge tool for paid invoices, payments, customers, or full test data cleanup.
- Dashboard cards are not clickable and do not open modules with filters applied.
- Placeholder/admin module cleanup is incomplete. Several modules still render summary or placeholder surfaces through `GenericModule`, especially proposals, marketing, media, devices, tasks, client portal, case studies, and portions of feature toggles/AI control.
- Some admin buttons still perform broad refreshes after actions rather than targeted state updates.
- `npm run build` is environment-dependent because it starts with `prisma db push` and requires a populated `DATABASE_URL`; migration-only production deployment remains technical debt.
- Automated route/payment/webhook tests are still planned rather than implemented.

## Feature Checklist

Implemented:

- Public landing page and demo showcase.
- Homepage split between Live Production Websites and Showcase Demos with All/Production Websites/Showcase Demos filters.
- Production website cards with direct `Visit Website` links and `Request Similar Website` quote actions.
- Showcase demo cards with `View Demo` and `Request Similar Website` actions.
- Responsive demo layouts.
- Project request capture with client upsert.
- AI quote generation with OpenAI plus safe fallback.
- Centralized cents-only pricing defaults and database-backed pricing rules.
- Promotion model, admin APIs, admin forms, date windows, slot counts, and AI quote influence.
- Optional retainer display and checkout inclusion.
- Quote persistence to database.
- Estimate acceptance creating local invoices.
- Client invoice response persistence with explicit next-step response shape.
- Mobile-first step invoice checkout with sticky mobile action bar.
- Square Web Payments SDK card tokenization path.
- Server-side Square payment creation with local payment records.
- Client portal login, claim flow, payment-method management, and saved-card vaulting through Square.
- Saved-card remaining-balance/future invoice payment route with server-side ownership checks.
- Server-side payment status, idempotency, duplicate deposit, and amount validation.
- Square webhook endpoint with signature verification, payment reconciliation, retainer subscription updates, past-due handling, and notification records.
- Square retainer subscription creation when a selected retainer has a saved card and plan variation configuration.
- Client/admin retainer cancellation controls.
- Admin session login, forced password change, and logout.
- Admin route and API protection.
- Admin-protected customer exports with marketing/audience filters.
- Admin invoice review actions and incomplete-checkout cleanup controls.
- Admin customer edit/archive/delete/anonymize controls.
- Marketing source capture for UTM fields, landing page, referrer, selected demo, consent timestamp, opt-out, tags, and segments.
- Prisma-backed admin dashboard and data panels.
- Seeded roles, owner account, demo templates, pricing rules, promotion template, and retainer settings.

Partially Implemented:

- Admin CRUD is functional for pricing/promotions/customers/invoice review and data-backed for review panels, but not every module has full create/edit/delete forms.
- Pipeline is database-backed but not drag-and-drop persisted.
- Retainer subscription billing requires Square plan variation configuration and webhook coverage for the account's enabled event types.
- Notification records are created, but production email delivery is still pending.
- Integration settings persist but do not have a polished editing workspace.
- Afterpay/Clearpay is wired opportunistically through Square SDK and depends on account/location eligibility.

Planned:

- Full admin CRUD forms for every module.
- AI quote approval/editing screen with staff overrides.
- Client portal project-progress views beyond payment methods and retainers.
- File upload/media management.
- Task assignment workflow UI.
- Production notification emails.
- Square refund handling UI.
- Automated tests for quote, checkout, admin, and webhook routes.
- Dedicated marketing segmentation UI beyond export filters.

Technical Debt:

- Production `build` currently runs `prisma db push`; migration-only deploys are safer.
- Public invoice URLs rely on unguessable invoice IDs rather than separate signed client tokens.
- Payment idempotency uses a dedicated `PaymentRecord.idempotencyKey`; more granular Square idempotency lifecycle tooling can still be added.
- Some admin modules summarize data rather than providing full management workspaces.
- `npm audit` reports inherited dependency vulnerabilities; review dependency upgrades separately because force-fixing may introduce breaking framework changes.
- Local development requires a reachable PostgreSQL database; no SQLite fallback is configured.

## Project Status

Production Ready:

- Public demo showcase.
- Public homepage separation for Live Production Websites and Showcase Demos.
- Request capture.
- Admin authentication/logout.
- Admin API protection.
- Admin-protected customer exports.
- Admin invoice/customer action APIs with audit logs.
- Server-side pricing validation.
- Square card payment path when environment variables are configured.
- Client saved-card vaulting and saved-card balance payments.
- Retainer subscription status tracking and cancellation when Square subscription configuration is present.

Beta:

- AI quote assistant.
- Pricing and promotions management.
- Square webhook reconciliation.
- Admin dashboard and review panels.
- Marketing/customer metadata capture and export filters.
- Client portal payment methods and retainer billing views.

In Development:

- Full admin CRUD across every operational module.
- Rich AI quote review and override tooling.
- Full client portal project-progress/file workflows.
- Production notification email delivery for pending notification records.

Planned:

- Notification emails.
- File/media uploads.
- Refund UI.
- Automated route and payment tests.

## Immediate Focus

The following systems should be completed before moving on to additional features.

### Completed Priority 1
- Homepage restructure
- Production websites vs showcase demos
- K&K migration

### Priority 2
- AI consultation modal redesign
- Website type dropdown
- Demo auto-selection
- Multi-step consultation

### Priority 3
- Budget-aware AI recommendations
- Full/budget/phased quote options
- Financing recommendations

### Priority 4
- Invoice timeline system
- Remaining balance workflow
- Admin remaining balance links

### Priority 5
- Dashboard clickable cards
- Admin module cleanup
- Remove placeholder interfaces

No new major features should be added until the current Immediate Focus items are completed.

## Future Obsidian Core Integration

Planned future integrations:

- Obsidian Core CRM
- Prospecting Engine
- Executive Dashboard
- Obsidian POS
- Marketing Automation
- Obsidian Customer Portal
- Project Management System

Current implementation should avoid hard-coded assumptions that prevent future integration.

## Production Requirements

The following requirements must be satisfied before public production launch:

- npm run build passes
- npm ci passes
- TypeScript passes
- Prisma validate passes
- Square sandbox testing complete
- Remaining balance workflow complete
- Invoice timeline complete
- Client portal complete
- Dashboard placeholders removed
- Retainer billing verified
- Backup strategy documented
- Production environment variables documented
- README updated

## Development Rules

1. Mobile-first development.
2. No dead buttons.
3. No placeholder functionality in production.
4. AI never determines final pricing.
5. Server determines all pricing.
6. Financial calculations must be server-side.
7. README is the source of truth.
8. New features must update the README.
9. New APIs must be documented.
10. New database fields must be documented.
11. Customer data must be protected.
12. Admin routes must require authentication.
13. Client routes must require ownership validation.
14. Payment systems must be idempotent.
15. Production features must have error states.

## Changelog

2026-07-02:

- Restructured the homepage so Live Production Websites and Showcase Demos are separate, filterable sections.
- Moved K&K Kustom Kreations into the Live Production Websites lane with a direct live-site link and production-site quote metadata.
- Added explicit `Visit Website`, `View Demo`, and `Request Similar Website` actions so homepage cards no longer rely on one combined project link.
- Validated this pass with ESLint, TypeScript, and `next build`.

2026-06-29:

- Reworked invoice checkout into a mobile-first stepper: review, approval, payment, and confirmation.
- Approval now returns a clean next-step response, shows loading/error states, and advances the customer directly into payment.
- Square Web Payments now loads only in the active payment step and the payment API blocks unapproved, denied, revision-requested, cancelled, draft, and archived invoices.
- Added payment idempotency storage and duplicate paid deposit detection.
- Separated project total, deposit due today, remaining balance, and optional retainer follow-up so deposit/retainer do not inflate one-time build totals.
- Added invoice retainer selection fields and admin visibility for selected retainer follow-up.
- Confirmed `Invoice.projectId` is singular in `prisma/schema.prisma`; regenerated Prisma Client successfully.
- Added customer marketing metadata fields, archive/delete/anonymize timestamps, tags, segments, and opt-out tracking.
- Added request-level UTM, landing page, referrer, device, and browser capture.
- Added invoice review/archive fields and admin notes.
- Added admin invoice action API with approve, revise, deny, cancel, mark reviewed, and incomplete checkout delete/archive behavior.
- Added audit logs for invoice and customer admin actions.
- Added admin customer detail/update/archive/delete/anonymize API.
- Added visible invoice and customer action buttons in the admin portal.
- Protected customer export API with admin auth and added audience filters.
- Ran `npm install`, `npm ci`, `prisma generate`, `npm run build`, and `npx tsc --noEmit`.
- Added Square-vaulted saved cards, client payment methods, saved-card remaining-balance payments, and safe admin saved-card visibility.
- Added Square retainer subscription linkage, webhook-driven active/past-due/canceled status updates, pending notification records, and client/admin retainer cancellation controls.
- Added a Production Architecture Pass Roadmap that records completed and incomplete pass items so future work can be tackled one focused slice at a time.

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

- Run Prisma generate and push/deploy schema before using the new checkout fields: `Invoice.retainerSelected`, `Invoice.retainerTier`, `Invoice.retainerMonthlyAmount`, and `PaymentRecord.idempotencyKey`.
- Confirm Vercel production env values are populated before deploy. Empty `DATABASE_URL` or `AUTH_SECRET` will block builds or admin auth.
- Run Prisma generate and push/deploy schema before using the new pricing and promotion tables.
- Existing AI quotes may not have the new optional pricing fields populated.
