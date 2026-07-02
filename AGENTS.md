# AGENTS.md — Obsidian Systems Showcase Platform

This file defines the working rules for AI coding agents contributing to this repo.

The README is the living project specification. This file defines how agents should behave while implementing it.

---

## Core Rule

Do not treat this project as a simple demo app.

This platform is becoming the Obsidian Systems sales, quote, checkout, CRM, client portal, and retainer management platform.

Every implementation should move the system toward production readiness.

---

## Source of Truth

README.md is the source of truth.

Before starting work:

1. Read README.md.
2. Review the Feature Checklist.
3. Review the Production Architecture Pass Roadmap.
4. Review Completed vs Incomplete sections.
5. Work only on the requested focus area unless the user explicitly asks for a broader pass.

After finishing work:

1. Update README.md.
2. Move completed items from incomplete/planned into completed where accurate.
3. Update changelog.
4. Update technical debt.
5. Update environment variable docs if needed.
6. Update API/database documentation if changed.

No implementation pass is complete until README.md is updated.

---

## Development Philosophy

Work in focused passes.

Do not attempt to complete many large systems at once.

Prefer:

* one feature area
* one workflow
* one integration
* one production blocker

Avoid partial implementation across 5+ systems.

If a feature cannot be completed in the current pass, document the exact remaining work in README.md.

---

## Mobile-First Rule

All public, checkout, quote, client portal, and admin interfaces must be mobile-first.

Requirements:

* Single-column mobile layouts by default.
* Large tap targets.
* No desktop-only workflows.
* Avoid wide tables on mobile.
* Use responsive cards for mobile data views.
* Sticky mobile action bars where useful.
* Desktop layouts may enhance, but must not be required.

---

## No Dead UI Rule

Do not leave buttons, tabs, forms, or cards that appear functional but do nothing.

Every visible action must either:

1. Fully work.
2. Be hidden.
3. Be clearly labeled as planned/in development.

Production UI should not contain fake controls.

---

## Pricing Rules

The AI does not determine final pricing.

The server pricing engine determines all prices.

All prices must be stored in integer cents.

Core pricing rules:

* Minimum project price: $500.
* Basic Website: $500+
* Business Website: $1,000+
* Ecommerce Website: $2,000+
* Custom Web Application: $3,000+
* Complex Business Systems: custom pricing.
* Default retainer: $200/month.
* Promotional retainer may temporarily override default pricing.

Never allow AI output, client-submitted values, or frontend calculations to override server pricing.

---

## AI Quote / Consultant Rules

The AI consultant should act as:

* sales consultant
* scope advisor
* solutions consultant
* budget advisor

It should not act as the final pricing authority.

The AI should consider:

* website type
* selected demo
* business type
* requested features
* customer budget
* customer timeline
* active promotions
* retainer recommendation
* project complexity

If requested scope exceeds budget, generate multiple options:

1. Full solution.
2. Budget-fit solution.
3. Phased solution.

The system should offer:

* simpler scope
* phased implementation
* deposit options
* payment plans
* Afterpay/Clearpay where available
* future financing options

---

## AI Loading Experience

The AI quote process must never appear frozen.

When waiting for OpenAI:

* show immediate loading state
* disable duplicate submission
* preserve form data
* show progress messaging
* show retry/fallback option if delayed or failed

Suggested loading stages:

* Reviewing your project requirements...
* Analyzing requested features...
* Comparing your budget and goals...
* Evaluating possible solutions...
* Building your recommendations...
* Preparing your consultation...

The customer should never see a blank modal while waiting.

---

## Homepage Rules

The homepage must separate:

1. Live Production Websites
2. Showcase Demos

Live Production Websites are real client/production sites.

Showcase Demos are internal demo builds used for sales.

K&K Kustom Creations belongs under Live Production Websites and should link directly to the live K&K site.

Demo cards should support:

* View Demo
* Request Similar Website

Production cards should support:

* Visit Website
* Request Similar Website

---

## Quote Modal Rules

The AI quote modal should become a guided consultation.

Required flow:

1. Contact Information
2. Website Type
3. Budget
4. Timeline
5. Features
6. Additional Notes

Website type must be a dropdown and include:

* Business Website
* Landing Page
* Portfolio Website
* Restaurant Website
* Coffee Shop Website
* Law Firm Website
* Medical Website
* Service Business Website
* Ecommerce Store
* Booking Website
* Membership Website
* Customer Portal
* Dashboard Application
* CRM System
* Inventory System
* Internal Business Tool
* AI Application
* Demo Recreation
* Custom Web Application
* Custom Project
* Other / Custom

When launched from a demo, preselect:

* source demo
* website type
* recommended features

The customer must be able to change these selections.

---

## Checkout Rules

Checkout must be custom and embedded on the site.

Do not redirect customers to Square-hosted checkout.

Checkout flow:

1. Review invoice.
2. Approve invoice.
3. Select optional retainer/payment options.
4. Enter payment details.
5. Pay deposit.
6. Show confirmation.

Payment screen must clearly separate:

* project total
* deposit due today
* remaining balance
* optional monthly retainer

Deposit must not be treated as an extra line item that inflates the project total.

---

## Square Rules

Square is responsible for card data.

The app must never store:

* raw card numbers
* CVV
* full sensitive card data
* raw payment tokens
* raw source IDs in logs

The app may store:

* Square customer ID
* Square card ID
* card brand
* last four
* safe expiration metadata
* default card flag

Use Square Web Payments SDK for card tokenization.

Use Square APIs server-side for payments, saved cards, subscriptions, and webhooks.

---

## Retainer Rules

Retainers are optional and separate from build pricing.

Default retainer:

* $200/month

Promotional retainers may temporarily override this.

Retainers should support:

* selected during quote/checkout
* saved to invoice/client
* Square subscription when configured
* client portal management
* cancellation
* failed payment tracking
* admin follow-up

If Square subscription setup is unavailable, mark retainer as pending setup instead of charging incorrectly.

---

## Client Portal Rules

Client portal should support:

* login/claim account
* invoices
* payment history
* remaining balance
* saved cards
* retainer status
* retainer cancellation
* project status
* timeline
* support requests

Client auth must be separate from admin auth or safely role-scoped.

Clients must never see another client’s data.

All client APIs must validate ownership server-side.

---

## Admin Portal Rules

Admin portal must be functional, not decorative.

Dashboard cards should be clickable and route/filter into the correct module.

Admin modules should support real actions where applicable:

* requests
* clients
* invoices
* payments
* retainers
* pricing
* promotions
* demos
* analytics
* users
* logs
* AI controls
* settings

If a module is not functional, hide it or clearly mark it as planned.

---

## Invoice Timeline Rules

Track important invoice/project events:

* created
* viewed
* approved
* denied
* revision requested
* deposit checkout started
* deposit paid
* project started
* remaining balance link created
* remaining balance link sent
* remaining balance paid
* invoice paid in full
* retainer selected
* retainer activated
* retainer past due
* retainer canceled

Show timeline to admin.

Show simplified timeline to client.

---

## Remaining Balance Rules

After deposit is paid:

Admin should be able to:

* create remaining balance payment link
* copy payment link
* send payment link
* see whether link was sent
* see whether balance was paid

Client should be able to:

* pay remaining balance early
* pay remaining balance when link is sent
* use saved card where available

Final payment must update invoice to paid.

---

## Sandbox Cleanup Rules

In sandbox mode only:

Super Admin may delete/purge paid test invoices, payments, clients, and checkout data.

Production mode:

* Never hard-delete paid invoices.
* Never hard-delete payment records.
* Archive/anonymize instead.

Server must enforce sandbox deletion rules.

Do not rely only on frontend hiding.

---

## Security Rules

Protect all admin routes and APIs.

Protect all client routes and APIs.

Validate all payment amounts server-side.

Validate all invoice ownership server-side.

Validate all client ownership server-side.

Never expose:

* OpenAI API keys
* Square access tokens
* auth secrets
* database URLs
* raw card data

Use audit logs for:

* admin invoice actions
* customer deletion/anonymization
* payment-sensitive actions
* retainer cancellation
* sandbox data purge

---

## Environment Rules

Do not introduce new required environment variables without:

1. Updating `.env.example`.
2. Updating README.md.
3. Documenting whether it is required for development, sandbox, or production.

---

## Database Rules

When changing Prisma schema:

1. Update schema.
2. Generate Prisma client.
3. Add migration or document db push if migration is deferred.
4. Update README Database Documentation.
5. Update changelog.

Production should move toward migration-only deploys.

---

## Testing / Validation

Before marking work complete, run where possible:

```bash
npm ci
npm run lint
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
```

If a command cannot run due to missing environment/network/database, document the blocker in README.md.

---

## README Update Requirement

Every pass must update README.md.

At minimum update:

* Completed section
* Incomplete section
* Feature checklist
* Changelog
* Technical debt
* Environment variables if changed
* API docs if routes changed
* Database docs if schema changed

---

## Preferred Work Pattern

For future Codex passes:

1. Pick one incomplete README section.
2. Complete that section end-to-end.
3. Test it.
4. Update README.
5. Stop.

Do not continue into unrelated features unless explicitly requested.

---

## Current Recommended Focus Order

1. Homepage restructure.
2. AI consultant modal redesign.
3. Budget-aware quote options.
4. Invoice timeline.
5. Remaining balance workflow.
6. Dashboard clickable cards.
7. Admin module cleanup.
8. Retainer subscription production hardening.
9. Client portal expansion.
10. Notification emails.

---

## Final Rule

If code and README disagree, fix the disagreement before finishing.

If a feature is only partially completed, say so clearly in README.md.
