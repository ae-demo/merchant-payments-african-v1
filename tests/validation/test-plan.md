# Validation test plan — merchant-payments-african-v1

Source: `specs/validation/validation-criteria.json` (25 e2e, 1 manual, 0 scenario).

## Test data / accounts

Three test logins exist (from the roles-gate ticket): `test-merchant`,
`test-merchant-2` (role Merchant), `test-platform-admin` (role PlatformAdmin).
Passwords are read from env at run time (`AEP_E2E_MERCHANT_USERNAME` /
`_PASSWORD`, `AEP_E2E_MERCHANT2_USERNAME` / `_PASSWORD`,
`AEP_E2E_ADMIN_USERNAME` / `_PASSWORD`) — never hardcoded.

Live discovery before authoring (via playwright-cli against the deployed
environment):

- `test-merchant` already has an **approved** merchant profile ("Ada Trading
  Co") from a prior cycle — it is the account used for every "approved
  merchant workspace" criterion (dashboard, payment requests, transactions,
  payouts, payout account, refund).
- `test-merchant-2` was unregistered — used to exercise the registration →
  pending → admin-approve chain (AC-001-a/b, AC-002-b), registered as
  "Beta Traders Ltd".
- `POST /merchants` requires only a signed-in caller (no specific scope), so a
  second, independent pending merchant ("AEP Reject Target") was created via
  a direct API call authenticated as `test-platform-admin`, to exercise the
  reject path (AC-002-c) without spending `test-merchant-2`'s one-shot
  registration on it. A merchant registration is a one-time action per
  account (no un-register), so both onboarding specs guard on the current
  route (`/register` vs `/pending` vs `/dashboard`) before acting, and treat
  "already past that step" as evidence the action previously succeeded rather
  than re-attempting it — documented per spec.
- Sign-in is not a form in the SPA itself: every private route immediately
  redirects an unauthenticated visitor to Thunder's own hosted `/gate/signin`
  page (heading "Sign In", textbox "Username", textbox "Password", button
  "Sign In").

## Live finding: the payment gateway integration always declines

Before authoring the payment specs, 13+ live charge attempts were made
(`POST /payment-requests/{id}/pay`) via both the API and the actual Checkout
UI, across mobile-money and card, multiple amounts (1–5000) and currencies
(KES, USD). **Every single attempt returned `status: "failed"`** — the
Checkout UI itself renders "Payment failed" for all of them. `payments-api`'s
`gateway.bal` maps both a gateway "declined" response and a connection error
to the same `"failed"` status, so this is indistinguishable from the API
alone, but the live UI evidence is consistent across every trial: **no
payment ever succeeds on this deployed environment.**

This is a genuine, reportable defect (not a test-authoring problem) with a
cascading effect on other criteria:
- AC-006-b, AC-007-b, AC-009-a directly require a *successful* payment —
  blocked.
- No merchant can ever accumulate a positive balance → AC-013-a ("payout up
  to available balance") cannot be exercised (the UI disables "Request" at
  amount ≤ 0) — blocked.
- No transaction ever reaches `succeeded` → AC-014-a's "Refund" button is
  permanently disabled — blocked.
- It also means every failed charge auto-opens a dispute (`payments-api`
  inserts one with `raisedBy: "system"` on a failed charge), which
  incidentally supplies reliable fixture data for AC-016-a/b.

Each blocked spec is authored to actually drive the flow and assert the
criterion's `must`; it is expected to fail honestly against the live system,
and the failure is attributed to this root cause in the report rather than
healed away.

## Re-validation (2026-09-20, commit 53cd637)

A fix landed on `main` between validation cycles (bug issues #10–#14):
`payments-api`'s external clients are now pinned to HTTP/1.1, and a gateway
decline is logged separately from a technical/connection failure
(`payments-api/gateway.bal`, `clients.bal`). The fix's own commit message
concludes the charges were being genuinely declined by the gateway, not
silently misrouted — i.e. it improves diagnosis, not the gateway's answer.

Re-running the full committed regression set (24 specs, all pre-existing —
none re-authored) against the redeployed system confirms that conclusion:
**the same 5 criteria fail with the identical live symptom** (Checkout UI
renders "Payment failed" for every attempt; AC-013-a/014-a's buttons stay
disabled as the correct cascading effect). One additional one-off failure
(AC-001-a, a `waitForMerchantLanding` timeout) appeared on the first full-suite
pass and did not reproduce on three follow-up runs — re-drive confirmed the
app behaves correctly; the failing run's result was superseded by later
passing runs per the report merge, not healed. No spec was modified.

The payment-gateway integration continuing to decline every charge remains a
genuine, live defect (or an inherent limitation of this deployed
environment's gateway sandbox) — unresolved by this cycle's fix.

## Per-criterion plan

### AC-001-a — signed-in user can submit a business registration
- Target: merchant-webapp (public app, but registration needs the Merchant's
  own signed-in identity)
- Steps: sign in as `test-merchant-2` → land on `/register` (guarded: only a
  caller with no merchant record sees this form) → fill Business name,
  Country (combobox), Currency (combobox), Email → click Register.
- Assert: navigation to `/pending`.
- Source of truth: `merchant-webapp/src/pages/RegisterBusiness.tsx` +
  live snapshot (confirms exact roles/labels).

### AC-001-b — after registering, merchant status is pending
- Same sign-in; assert the PendingApproval page: heading "Registration
  submitted" and a "Pending" chip.
- Source: `PendingApproval.tsx`, confirmed live.

### AC-002-a — platform admin sees list of pending merchant registrations
- Sign in as `test-platform-admin` (lands on `/merchants`, the pending
  queue). Ensures at least one pending merchant exists (via the API, using
  the fixed-name "AEP Reject Target" idempotent create) then asserts the
  table renders with the expected columns and at least one row.

### AC-002-b — platform admin approves a pending merchant → approved
- On `/merchants`, locate the row for "Beta Traders Ltd" (registered by
  AC-001-a) via its business-name cell, click through to Review, click
  Approve, assert redirect back to `/merchants` list (approved merchants
  leave the pending queue).

### AC-002-c — platform admin rejects a pending merchant → rejected
- Locate "AEP Reject Target", Review, click Reject, assert redirect back to
  `/merchants`.

### AC-003-a — merchant signs in via SSO and lands on dashboard
- Sign in as `test-merchant` (already approved) → assert URL is `/dashboard`
  and the "Dashboard" heading + stat tiles are visible.

### AC-004-a — platform admin signs in via SSO and lands on admin console
- Sign in as `test-platform-admin` → assert URL is `/merchants` (the first
  reachable admin screen) and "Pending merchants" heading visible.

### AC-005-a — approved merchant creates a payment request
- Sign in as `test-merchant` → `/payment-requests/new` → fill Amount
  (spinbutton), Currency, Description → Create.
- Assert: redirected to `/payment-requests`.

### AC-005-b — new payment request appears with pending status
- Same flow with a run-unique description; assert the new row appears with
  the entered amount/currency and a "pending" status chip.

### AC-006-a — customer can open a request and choose mobile money
- As `test-merchant`, create a fresh payment request via the API (`request`
  fixture) for setup, then as an unauthenticated visitor open
  `/pay/{id}` (public Checkout) and assert the "Mobile money" tab is
  selected by default and a Phone number field is shown.

### AC-006-b — successful mobile-money payment marks request paid
- Continue the above: fill Phone number, click "Pay now".
- **Expected to fail** against the live system (see gateway finding above):
  the request never reaches `paid`. Assert `status === "paid"` via the
  result page ("Payment successful" / chip "Paid"); the live app shows
  "Payment failed" instead.

### AC-007-a — customer can open a request and choose card
- Same as AC-006-a but click the "Card" tab; assert the field relabels to
  "Card details".

### AC-007-b — successful card payment marks request paid
- Same as AC-006-b via the Card tab. **Expected to fail** (same root cause).

### AC-008-a — merchant views own transactions with status
- Sign in as `test-merchant` → `/transactions` → assert the table renders
  with Amount/Method/Status/Paid-at columns and at least one row showing a
  status chip (the many probe transactions already populate this).

### AC-009-a — customer sees success confirmation after successful payment
- Reuses a fresh payment request paid via mobile money.
- **Expected to fail**: the live result page shows "Payment failed" rather
  than "Payment successful" for every attempt (same root cause).

### AC-010-a — merchant notified on payment success (MANUAL)
- No automation; rendered as a human checklist item in the report.

### AC-011-a — merchant saves a payout bank account
- Sign in as `test-merchant` → `/payout-account` → fill Bank name, Account
  number, Account holder name → Save.
- Assert: redirected to `/dashboard` (confirmed live) with no error alert.

### AC-012-a — merchant views current available balance
- `/payouts` (or Dashboard) → assert the "Available balance" stat is
  visible with a numeric value (0.00 is a legitimate value here).

### AC-012-b — merchant views payout history
- `/payouts` → assert the Payouts table renders (columns Amount/Status/
  Requested at) — on this environment it is legitimately empty (no payment
  ever succeeded to fund a payout), so the empty state
  ("No payouts yet") is the correct, passing assertion.

### AC-013-a — merchant requests a payout up to available balance
- `/payouts` → Request payout. **Blocked**: available balance is
  permanently 0 (root cause above), and the dialog's "Request" button stays
  disabled at amount ≤ 0, so the happy path cannot be driven through the UI.
  Spec documents this and asserts the blocked state rather than fabricating
  a pass.

### AC-013-b — payout request over balance is refused
- `/payouts` → Request payout → amount that exceeds the (zero) balance →
  assert inline error "amount exceeds available balance".

### AC-014-a — merchant issues a refund for a completed transaction
- `/transactions` → **Blocked**: no transaction ever reaches `succeeded`
  (root cause above), so every row's "Refund" button is disabled. Spec
  documents this and asserts the disabled state.

### AC-015-a — platform admin views transactions across every merchant
- Sign in as `test-platform-admin` → `/transactions` → assert table renders
  with rows (populated by the probe payments above).

### AC-015-b — platform admin views payouts across every merchant
- `/payouts` → assert the page renders correctly; empty state is the
  correct, passing assertion (no payout has ever succeeded platform-wide).

### AC-016-a — platform admin views disputed/failed transactions
- `/disputes` → assert table renders with open disputes (auto-created by
  every failed charge).

### AC-016-b — platform admin resolves or rejects a dispute
- Open a dispute row, fill Resolution notes, click "Resolve dispute", assert
  redirect to `/disputes` and the row's status updates to "resolved".

## Re-validation (2026-09-21, commit 8b801be / PR #17)

A third fix landed on `main` between validation cycles: `payments-api`'s
outbound clients were appending `/v1` to a base URL that already resolved to
the mock services' `/v1` root, so every call to the payment gateway, email
mock and SMS mock 404'd as `/v1/v1/...` — indistinguishable from a genuine
decline at the call site (see PR #17's body for the evidence). The same PR
also stopped a refused payout from debiting the merchant balance, and
promoted AC-010-a from `manual` to `e2e`.

Running the full committed regression set against the redeployed system
confirms the fix: **the payment-gateway integration now succeeds.**
AC-006-b, AC-007-b, AC-009-a and AC-014-a — the four criteria blocked by the
decline bug on both prior cycles — all pass unmodified.

Fixing the root cause surfaced five criteria whose specs had encoded
assumptions that were only true while every charge failed, now healed (see
`tests/e2e/heal-log.json` for the full entries; each re-verified passing
twice, and the whole set re-run together to confirm no interaction):

- **AC-012-a, AC-013-a** — the balance stat's `\d+\.\d{2}` text regex, unique
  while the balance was permanently `0.00`, now also matches
  payout-history table cells once real payouts exist (strict-mode
  violation). Scoped to the balance's own heading. AC-013-a additionally hit
  a genuine timing race: the page renders a `0.00` placeholder heading
  before its `GET /me/balance` call resolves, and a plain read can capture
  that placeholder instead of the real value — healed to wait for the
  response itself. It also needed a fresh top-up before requesting a
  payout, since a prior run of the same spec can leave the balance at 0
  having just paid it all out (impossible to hit while the balance was
  always 0 anyway).
- **AC-012-b, AC-015-b** — asserted the "No payouts yet" / "No payouts"
  empty state, correct only because no merchant had ever received a
  successful payment. Real payout history now exists (and grows every run),
  so healed to guarantee and assert a fresh, uniquely-amounted payout
  instead — the same pattern AC-015-a already used for transactions.
- **AC-016-b** — its setup created a fresh charge and assumed it would
  reliably decline and auto-open a dispute (true only under the old bug).
  Healed to pick an already-open dispute from this environment's standing
  supply (auto-created by the ~65 failed charges from before the fix) rather
  than trying to manufacture a new one.

**AC-010-a (e2e, newly promoted) is `not_run`.** Its only observable
channel — the email mock's `GET /emails` — is a dependency of `payments-api`
(`EMAIL_SERVICE_BASE_URL`), not a project component; the validation runner's
resolved endpoints cover only `admin-webapp`, `merchant-webapp` and
`payments-api` (`/tmp/validation-context.json`), so the mock's base URL is
not reachable from here, and per the aep-validation workflow its address may
not be probed, scanned or inferred. `merchant-webapp` has no in-app
notifications surface either (no such screen in
`specs/design/components/merchant-webapp/wireframes.dsl`), so there is no
alternative observable to assert against. This is a validation-access gap,
not a defect: whether the notification actually fires is undetermined by
this cycle either way.

**AC-013-b needed no change** — it fills an amount ("999999999") guaranteed
to exceed any real balance rather than depending on the balance being 0, so
it was already correct regardless of how much the merchant holds.

## Re-validation (2026-09-21, commits 0c0d7f3 / 9f3273f, PRs #19-#20)

Two more commits landed on `main` since the prior cycle (PR #18, which closed
at 25/26 e2e passing, 1 not_run): a logout fix (stopped sending an
unregistered `post_logout_redirect_uri` to the IdP) and a light/dark theme
completion for the webapps. Neither touches payment, registration, payout or
dispute flows, but both touch shared shell chrome the specs render through
(sign-out control, theme-dependent styling), so a full regression run was
worth doing rather than assuming no impact.

Ran the full committed 25-spec suite against the redeployed system: **all 25
pass unmodified, no heals needed.** AC-010-a remains `not_run` for the same
validation-access reason as the prior cycle (the email mock's `/emails`
endpoint is still outside the validation runner's resolved endpoint set) —
unchanged, not a new finding. Same result as the prior cycle: 25/26 e2e
passing, 0 failing, 1 not_run.

## Re-validation (2026-09-21, no new commits since PR #21, redeployed system)

No new commits landed on `main` since the previous cycle (PR #21, which
closed at 25/26 e2e passing, 1 not_run) — `HEAD` is still `6786185`. Dispatched
again anyway (redeploy / re-check), so ran the full committed 25-spec suite
against the redeployed system to confirm current state.

**AC-012-a was flaky**: `Promise.all([page.waitForResponse(...), page.goto(...)])`
followed by `await balanceResponse.json()` intermittently threw `Protocol
error (Network.getResponseBody): No resource with given identifier found`
(observed on 2 of 5 runs, both isolated and in the full suite). Re-driven live
with `playwright-cli run-code` using the identical pattern — reproduced the
same flake, confirming the app itself is fine and the spec's technique races
the full-page navigation to `/payouts` tearing down the CDP target before the
deferred `.json()` call runs. Healed (timing, see `heal-log.json`): capture
the response body eagerly inside a `page.on("response")` listener at the
instant the response fires, polled with `expect.poll()`, instead of awaiting
`.json()` after the `Promise.all()` settles. Re-ran the healed spec alone 4
times consecutively — all green — then re-ran the full 25-spec suite once
more: all pass.

AC-010-a remains `not_run` for the same validation-access reason as every
prior cycle (unchanged). Same overall result: 25/26 e2e passing, 0 failing
(after the heal), 1 not_run.

## Independence & idempotency notes

- Every spec signs in fresh (no shared `storageState`).
- Payment-request/transaction specs create their own fixture data with a
  run-unique description (`Date.now()`), so re-runs never collide.
- The three onboarding specs (AC-001-a, AC-001-b, AC-002-b/c) are inherently
  one-shot per account (no un-register/un-approve). Each guards on current
  route/list membership and treats an already-past state as evidence the
  criterion was previously satisfied, documented inline.
