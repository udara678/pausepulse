# PausePulse — Production Hardening & Premium Upgrade Plan

Instructions for the Antigravity agent. Save this file in the repo root and tell the agent: "Read PAUSEPULSE_ANTIGRAVITY_PROMPT.md and start Phase 0."

## Role and ground rules

You are a senior full-stack and application-security engineer taking PausePulse (Electron + React 19 + TypeScript desktop app; Node/Express + Prisma backend in `/server` ; Stripe billing; Resend email; HR admin dashboard at `/admin`) from a working prototype to a production, multi-tenant, globally sold B2B SaaS product priced per seat.

Follow these rules for every phase:

1. **Work one phase at a time.** At the start of each phase, produce an implementation plan and task list artifact and **wait for my approval before editing code.**
2. **Create a new git branch per phase** (`phase-N-short-name`). Small, focused commits with clear messages.
3. **Do not break existing features or user data.** Every schema change ships as a Prisma migration (`prisma migrate dev` locally, `prisma migrate deploy` in production — never db push in production). Write a data-migration script whenever existing rows must change.
4. **Add or update automated tests for everything you touch** (Vitest/Jest for units, Supertest for API, Playwright for Electron/E2E where practical). All tests must pass before you mark a phase done.
5. **Never hard-code or commit secrets.** All config goes through `server/src/config/env.ts` (Zod-validated) and `.env.example` gets updated with placeholder values only.
6. **At the end of each phase, update `CHANGELOG.md` and `docs/SECURITY.md`**, list anything you could not finish, and list any decision you need from me.
7. **If an instruction here conflicts with what you find in the code, stop and ask me instead of guessing.**

---

## Phase 0 — Audit only (no code changes)

Read the whole repository and write `docs/AUDIT.md` covering:

- **Architecture map:** processes (Electron main, preload, renderer), backend routes, data flows, where each piece of personal data is created, stored, transmitted and shown.
- **Electron security settings in every BrowserWindow** (`contextIsolation`, `sandbox`, `nodeIntegration`, `webSecurity`, preload exposure, IPC channels and how their inputs are validated, navigation/new-window handling, CSP).
- **Auth:** password hashing algorithm and parameters, token type, lifetime, storage location on the client, refresh/revocation logic.
- **Multi-tenancy:** every Prisma query that reads or writes tenant data and whether it is scoped by `companyId`. Flag any IDOR risk.
- **Licensing:** how keys are generated (is it a CSPRNG?), stored (plaintext?), verified, bound to devices/seats, revoked, and whether the desktop app can be unlocked offline by tampering.
- **Billing:** Stripe webhook signature verification (raw body?), idempotency, how plan/seat changes propagate, whether the client success redirect is trusted.
- **Admin dashboard:** how it is rendered, where `escapeHTML()` is and is not applied, cookie flags, CSRF exposure.
- **Rate limiting store** (in-memory vs shared) and whether it works behind a proxy (`trust proxy`).
- **Dependency list with outdated/vulnerable packages** (`npm audit` for root and `/server`), Node version in use.
- **A prioritized findings table:** Critical / High / Medium / Low, with file and line references and the phase that will fix each.

---

## Phase 1 — Desktop (Electron) hardening

- Every `BrowserWindow`: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity: true`, `allowRunningInsecureContent: false`, No `remote` module.
- Preload exposes a minimal, typed API via `contextBridge`; every IPC handler validates its arguments with Zod and checks the sender frame origin.
- Strict Content-Security-Policy for the renderer (no `unsafe-eval`; allow only the app's own origin and the API origin). Ensure the WebGL Energy Orb shader still works.
- Block unexpected navigation (`will-navigate`) and `setWindowOpenHandler` → open only allowlisted https URLs (e.g., the configured EAP helpline URL) in the system browser.
- Store auth/refresh tokens and license tokens with Electron `safeStorage`, never in `localStorage` or plain files.
- Enable Electron Fuses: disable `RunAsNode`, `EnableNodeCliInspectArguments`, `EnableNodeOptionsEnvironmentVariable`; enable `EnableEmbeddedAsarIntegrityValidation` and `OnlyLoadAppFromAsar`.
- Secure auto-update with `electron-updater` over HTTPS with signature verification. Prepare (but do not execute) code-signing config for Windows Authenticode and macOS notarization; document required certificates in `docs/RELEASE.md`.
- Add enterprise packaging targets: MSI (for Intune/GPO silent install with a pre-configured company/tenant ID) and macOS PKG (for Jamf), alongside existing EXE/DMG.
- Upgrade Electron to the latest supported stable major and Node to the current LTS; fix any breakage.

---

## Phase 2 — Backend authentication, authorization & tenant isolation

- Migrate PostgreSQL to be the primary target (keep SQLite only for local dev if it still works). Production uses `prisma migrate deploy`.
- Password hashing: Argon2id (migrate existing hashes on next successful login).
- Tokens: short-lived access JWT (≤15 min, asymmetric signing, `kid` header for key rotation) + rotating, revocable refresh tokens stored hashed in DB with device ID. Logout and "sign out all devices" endpoints.
- MFA (TOTP) required for `HR_ADMIN` and `SUPER_ADMIN`.
- Enterprise SSO: OIDC first (Microsoft Entra ID, Google Workspace, Okta), designed so SAML can be added; SCIM 2.0 endpoint for user provisioning/deprovisioning and automatic seat counting.
- Authorization middleware: central RBAC (`EMPLOYEE`, `HR_ADMIN`, `SUPER_ADMIN`) plus mandatory tenant scoping. Every tenant query goes through a helper/Prisma extension that injects `companyId`; add PostgreSQL Row-Level Security as defense in depth. Write tests that prove a user from company A cannot read or modify company B data on every route.
- Rate limiting: move `express-rate-limit` to a Redis store so it works across multiple server instances; set `app.set('trust proxy', ...)` correctly; limit auth by both IP and account; add progressive delay + account lockout notification instead of hard 5-per-15-min lockout for whole IP ranges (offices share IPs).
- Convert stringly-typed fields (`subscriptionStatus`, `plan`) to Prisma enums.
- Append-only `AuditLog` table for admin actions (logins, role changes, reward edits, exports, settings changes) visible to the company's HR admins.

---

## Phase 3 — Licensing, seats & billing

- Replace raw license-key lookups with signed license tokens: server issues an Ed25519-signed token (company, plan, seat limit, expiry, device ID); the desktop app verifies offline with an embedded public key and re-validates online at least every 7 days, with a 14-day offline grace period.
- Store license keys hashed (HMAC-SHA-256 with a server pepper), never plaintext. Generate keys with `crypto.randomBytes`. Support revocation and device deactivation from the admin portal.
- Server-side seat enforcement: active seats cannot exceed purchased seats; admin sees seat usage and can reassign seats.
- Billing provider abstraction: create a `BillingProvider` interface with a Stripe implementation and a Paddle (Merchant of Record) implementation, selected by env var. (Reason: the business is based in Sri Lanka; a Merchant of Record also handles global VAT/GST.)
- Webhooks: verify signatures using the raw request body; store processed event IDs for idempotency; derive plan state only from webhooks, never from the checkout success redirect.
- Plans and feature flags (single source of truth in code + DB): `FREE` (individual, core timer & breaks, local-only), `PRO` (individual, all activities, sync, analytics), `TEAM` (per seat, min 5 seats, admin portal, aggregate analytics), `ENTERPRISE` (per seat, SSO/SCIM, audit log, data residency, MSI/PKG, custom EAP, SLA). Monthly and annual (annual ≈ 2 months free).
- Regional (purchasing-power) pricing support: price IDs per region/currency configured in DB, not hard-coded.
- Dunning: failed payment → grace period → read-only mode → downgrade to FREE. Never delete user data on downgrade.

---

## Phase 4 — Privacy, compliance & trust (critical for selling globally)

- Data minimization: mood selections, Brain Dump text, gratitude/kudos text and per-activity history stay on the device by default (encrypted with `safeStorage`-protected key). Only opt-in, aggregated counters sync to the server.
- HR analytics anonymity: every aggregate shown to HR must cover at least N = 7 users (configurable, never below 5); hide or merge smaller groups. Apply this to every filter combination (team, location, date range) to prevent re-identification by subtraction. Add tests for this.
- Remove or redesign any metric that could be read as individual monitoring. `activeMinutes` / `idleMinutes` must never be shown per person to anyone except that person.
- No AI emotion inference. Mood remains strictly self-reported. Do not add features that infer mood, stress or burnout from typing, idle patterns, webcam, microphone or biometrics (EU AI Act workplace prohibition). Add a code comment and a test/lint rule guarding this in the mood module.
- Leaderboards and points-based competition are opt-in per user and per company, off by default.
- Explicit, granular consent screens at first run (what stays local, what syncs, what HR can see) with a "privacy view" showing the exact data the server holds about the user.
- GDPR/PDPA data-subject rights: self-service data export (JSON) and account deletion with cascading erasure; company-level offboarding that deletes all tenant data after a configurable period.
- Retention policy job (e.g., raw daily logs 13 months, then aggregated only).
- Data residency: support at least two regions (US and EU) selected per company at signup; tenant data never leaves its region.
- Encryption at rest for the database and backups; field-level encryption for any free-text the user chooses to sync.
- Localized crisis/EAP resources: company-configured EAP URL first, otherwise a country-appropriate helpline list maintained in a JSON config (not hard-coded in components).
- Generate `docs/PRIVACY_BY_DESIGN.md`, `docs/SUBPROCESSORS.md`, and a DPIA starter template customers can use.

---

## Phase 5 — Production infrastructure & secure SDLC

- Dockerfile (multi-stage, non-root user, minimal base image) and `docker-compose.yml` for local Postgres + Redis.
- Separate admin dashboard into its own React app on its own subdomain; cookies `HttpOnly; Secure; SameSite=Strict`; CSRF tokens for cookie-authenticated routes; strict CSP; HSTS.
- `/health` (liveness) and `/ready` (DB + Redis check) endpoints.
- Structured logging (`pino`) with PII redaction; error tracking (Sentry) with PII scrubbing; request IDs.
- Graceful shutdown, DB connection pooling, pagination on all list endpoints.
- CI pipeline (GitHub Actions): typecheck, lint, tests, `npm audit --audit-level=high`, CodeQL or Semgrep SAST, secret scanning (`gitleaks`), dependency update bot, SBOM generation, signed release builds.
- Automated daily backups with a documented and tested restore procedure.
- Write `docs/DEPLOYMENT.md` for a managed-Postgres + container host setup in two regions behind a CDN/WAF.

---

## Phase 6 — Product upgrades for competitive advantage

- Calendar integration (opt-in, read-only, Google + Microsoft 365): detect back-to-back meetings and suggest/auto-schedule micro-breaks; "meeting-free focus block" protection. Process calendar data on-device or discard after computing aggregates.
- Teams and Slack apps: break nudges, 1-tap mood check-in, weekly personal recap delivered in chat.
- Validated wellbeing pulse: optional monthly self-report check-in using a freely usable validated instrument (e.g., Copenhagen Burnout Inventory — confirm licensing), reported to HR only as anonymized aggregates with the threshold from Phase 4. Include before/after comparison to produce an ROI report for buyers.
- Manager insights (aggregate only): team-level trends (after-hours work, break adherence, pulse trend) with suggested actions; never individual data.
- Smart, adaptive reminders: respect fullscreen/presentations/do-not-disturb, learn the user's preferred break times locally, snooze limits.
- Internationalization: extract all strings (`react-i18next`); ship English first, then structure for Spanish, German, French, Portuguese, Japanese, Hindi, Sinhala, Tamil. Locale-aware units (ml/oz) and time formats.
- Accessibility: WCAG 2.2 AA (keyboard navigation, screen reader labels, reduced-motion mode that disables the WebGL orb and animations, color-contrast tokens).
- Onboarding: 60-second first-run setup; admin invite flow by email domain or SSO.
- Pricing page + in-app upgrade flows tied to the Phase 3 feature flags.

---

## Definition of done (whole project)

All Critical/High findings from `docs/AUDIT.md` are closed with tests; cross-tenant access tests pass; Electron security checklist passes; HR views never show groups below the anonymity threshold; signed installers build in CI; documentation in `/docs` is current; and a summary of remaining risks is written to `docs/SECURITY.md` for an external penetration test.
