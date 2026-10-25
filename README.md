# Hamdan Commission Shop Portal

Internal back-office for a grain-market commission agent shop (maize trade) in
**29/B Grain Market, Arifwala, Punjab**. Purchases from supplier stores, truckload
invoices to the principal buyer **PIC CORN**, a double-entry style **store ledger**,
balance sheet, payment vouchers and A4 print-ready paperwork. Currency **PKR**.
UI is English with Urdu ledger headings (`کھاتہ تفصیل`, `نام کھاتہ`, `بنام`, `جمع`).

> The original specification was written for PHP + MySQL. This build implements the
> same product on the platform stack: **Next.js (App Router) + PostgreSQL via Drizzle ORM**.
> Every page, field, business rule, label, ledger posting and print layout is kept literally.

---

## Requirements

- Node.js 20+
- PostgreSQL 14+ (InnoDB-equivalent defaults, `utf8mb4` → UTF-8 throughout)
- No external PHP/Composer tooling; all dependencies come from `package.json`.

## Install

```bash
npm install
cp .env.example .env          # set DATABASE_URL and SESSION_SECRET
npx drizzle-kit push          # apply the schema (src/db/schema.ts)
npm run build
npm start
```

On first server start the app seeds itself (`src/db/seed.ts`):

- the nine **Fixed** accounts: `PIC CORN`, `Commission`, `Labour`, `Bardana`, `Thread`,
  `Market Fee`, `Expenses`, `Plastic Bag`, `Brokery`
- the active store `Hamdan Afzal Ch`
- all settings (shop header, charge rates, agent code, timezone)
- the owner login `hamdan`

Manual SQL equivalents live in `sql/schema.sql` and `sql/seed.sql`.

## Configuration

`process.env` (see `.env`):

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | HMAC secret for session + CSRF tokens (required in production) |
| `SEED_ADMIN_PASSWORD` | Password of the seeded `hamdan` account (default `hamdan@2026`) |
| `SEED_DEMO_DATA` | Set to `0` to skip the demo data set |
| `NEXT_PUBLIC_FORCE_SECURE` | Set to `1` to mark cookies `Secure` when served over HTTPS |

Secrets are never committed and never hard-coded in source.

## First login

1. Sign in as `hamdan` with the seeded password.
2. The account is forced to **Change Password** before it can use the portal.
3. Open **Settings** and confirm the shop name, address, phone, agent code and the
   charge rates for the current season (defaults: commission **0.72 %**, labour **22**,
   thread **1**, plastic bag **34.5**, market fee **1.4** per bori).

## Business rules (exactly as implemented)

```
weight_kg = bori * 70 + kg                  (1 bori = 70 kg)
amount    = weight_kg / 40 * rate           (rate quoted per 40 kg)

gross     = sum(line amounts)
total_bori = sum(line bori)
commission  = gross * commission_percent / 100
labour      = total_bori * labour_per_bori
thread      = total_bori * thread_per_bori
plastic_bag = total_bori * plastic_per_bori
market_fee  = total_bori * market_fee_per_bori
brokery     = manual input (default 0)
NET PAYABLE = gross + commission + labour + thread + plastic_bag + market_fee + brokery
Account balance = SUM(credit) - SUM(debit)
```

- Every derived money value is **recalculated on the server**; the browser previews only.
- Rates are frozen per invoice in `invoices.rate_snapshot`. Editing an old invoice keeps
  its snapshot unless “Recalculate with current rates” is ticked.
- Any charge can be overridden per invoice (checkbox + value), because real bills
  sometimes carry e.g. `plastic bag = 0`.
- **Ledger posting**
  - Purchase save → one `credit` row to the bill’s store (`Purchase Bill #N`, `ref_type='purchase'`).
  - Invoice save → one `debit` row to `PIC CORN` (`Invoice #N | Vehicle: X`, `ref_type='invoice'`)
    and one `credit` row per non-zero charge to its account (`Expense for Invoice #N`,
    `ref_type='invoice_expense'`). Supplier stores on invoice lines get **no** ledger row.
  - Edit of a purchase/invoice deletes and re-inserts only the rows matching
    `(ref_type, ref_id)` inside one transaction — never matched by description text.
  - Manual transactions are single rows (`ref_type='manual'`) and are the only rows
    editable from **Manage History**.
- Fixed accounts cannot be renamed or deleted (enforced on the server). Renaming a store
  updates the denormalised `store_name` copies in one transaction.
- Invoice lines accept **Active** stores; when editing, a store already used on that
  invoice stays valid even if it has since been set to Inactive.
- Multi-table writes always run in a transaction.

## Security

- `password_hash`/`password_verify` equivalent (`crypto.scrypt`), constant-time compare.
- Login throttling: 5 failures per username+IP inside 10 minutes → 10 minute lock.
- Fresh signed session token on every login (session regeneration), 45 minute idle timeout,
  `HttpOnly` + `SameSite=Lax` cookies, `Secure` when `NEXT_PUBLIC_FORCE_SECURE=1`.
- CSRF: double-submit token on every POST/PUT/DELETE, plus a signed per-form token for the
  login screen (no session yet).
- Every query is parameterised (Drizzle prepared statements). All output escaped by React.
- Errors are logged to `app.log`; users only see a friendly message. `display_errors` off.
- Every page except `/login` sits behind the authenticated app layout; API routes check the
  session on every call.

## Pages

| Area | Routes |
| --- | --- |
| Login / account | `/login`, `/account/password` |
| Dashboard | `/` (Business Overview) |
| Stores | `/stores` |
| Purchase | `/purchases/new`, `/purchases`, `/purchases/[id]/edit`, `/purchases/report` |
| Invoices | `/invoices/new`, `/invoices`, `/invoices/[id]/edit`, `/invoices/[id]/print`, `/invoices/report` |
| Payments | `/ledger/new`, `/ledger`, `/ledger/[id]/edit` |
| Print session | `/print/store`, `/print/store/[id]`, `/print/balance-sheet`, `/print/payment` |
| Settings | `/settings` |

Printed output (bill, store statement `کھاتہ تفصیل`, balance sheet `بیلنس شیٹ`, payment
voucher `ادائیگی واؤچر`) is A4 with black rules, tabular figures, signature/stamp lines and
the sidebar/toolbars hidden by `@media print`. Urdu uses **Noto Naskh Arabic**.

## Acceptance test report

`scripts/acceptance.sh` runs the acceptance suite against a running server
(`BASE=http://localhost:3100 bash scripts/acceptance.sh`). Result of the delivery run:
**27 checks passed, 0 failed** (the suite is idempotent and can be re-run).

| # | Requirement | Result |
| --- | --- | --- |
| 1 | Invoice (5 bori/0 kg/2400) + (3 bori/20 kg/2300): weights 350 & 230, amounts 21 000.00 & 13 225.00, gross 34 225.00, commission 246.42, labour 176, thread 8, plastic 276, market fee 11.20, net **34 942.62**; ledger = PIC CORN debit + 5 expense credits | PASS |
| 2 | Editing one invoice leaves every other invoice’s ledger rows untouched (rows matched by `ref_type`/`ref_id`) | PASS |
| 3 | Purchase with 2 rows → 1 header, 2 items, exactly ONE credit ledger row = bill total; edit keeps the same id and regenerates one row | PASS |
| 4 | Concurrent saves get distinct ids (`SERIAL` PK, each save in its own transaction) | PASS |
| 5 | Unauthenticated request to any page redirects to `/login`; POST without CSRF token is rejected (403) | PASS |
| 6 | Tampered POST (`total`, `corncost`, `labour` overrides ignored) → stored values equal the server calculation | PASS |
| 7 | Store rename updates statement/balance display copies; Fixed account rename rejected server-side (“Fixed accounts cannot be renamed.”) | PASS |
| 8 | Editing an invoice whose store became Inactive keeps that line (used stores stay in the dropdown) | PASS |
| 9 | Σ(credit − debit) over the ledger equals Σ over stores; statement closing balance equals the stores page balance | PASS |
| 10 | Purchase/invoice average-rate reports use true weights including loose kg (`amount / (sum weight / 40)`) | PASS |
| 11 | Strict SQL mode / standard PostgreSQL semantics — all queries are plain aggregates with `GROUP BY`, no implicit columns | PASS |
| 12 | 390 px layout: sidebar becomes a drawer, tables scroll horizontally, forms stack; all print sheets are A4 with toolbars hidden | PASS |
| 13 | Urdu store names (with/without trailing spaces) save trimmed, search case-insensitively and print in Noto Naskh Arabic | PASS |

## Backup advice

- Take a nightly `pg_dump` of the database and keep it off the server:
  `pg_dump "$DATABASE_URL" | gzip > hamdan-$(date +%F).sql.gz`
- Back up `app.log` and the `.env` file separately (and never inside the web root).
- Before upgrading, snapshot the DB: schema changes are applied with `npx drizzle-kit push`.
