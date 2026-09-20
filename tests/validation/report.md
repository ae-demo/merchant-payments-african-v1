# Validation report

- **Issue:** #8
- **Commit:** 3c32dd333aabff1b27e84a1b990205c446fc4080
- **Generated:** 2026-09-20T14:48:45.847Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 25 | 20 | 5 | 0 |
| manual (human checklist) | 1 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | A signed-in user can submit a business registration with business name, country, currency and email | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | After registering, the merchant's status is pending | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-002-a | A platform admin can see a list of pending merchant registrations | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A platform admin can approve a pending merchant, changing its status to approved | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-002-c | A platform admin can reject a pending merchant, changing its status to rejected | ✅ pass | `tests/e2e/specs/AC-002-c.spec.ts` | — |
| AC-003-a | A merchant can sign in via SSO and land on their dashboard | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-004-a | A platform admin can sign in via SSO and land on the admin console | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-005-a | An approved merchant can create a payment request with an amount and currency | ✅ pass | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-005-b | A newly created payment request appears in the merchant's list with pending status | ✅ pass | `tests/e2e/specs/AC-005-b.spec.ts` | — |
| AC-006-a | A customer can open a payment request and choose to pay by mobile money | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-006-b | A successful mobile money payment marks the payment request as paid | ❌ fail | `tests/e2e/specs/AC-006-b.spec.ts` | — |
| AC-007-a | A customer can open a payment request and choose to pay by card | ✅ pass | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | A successful card payment marks the payment request as paid | ❌ fail | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | A merchant can view a list of their own transactions with each transaction's status | ✅ pass | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-009-a | A customer sees a payment success confirmation immediately after a successful payment | ❌ fail | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-011-a | A merchant can save a payout bank account with bank name, account number and account holder name | ✅ pass | `tests/e2e/specs/AC-011-a.spec.ts` | — |
| AC-012-a | A merchant can view their current available balance | ✅ pass | `tests/e2e/specs/AC-012-a.spec.ts` | — |
| AC-012-b | A merchant can view a history of their past payouts | ✅ pass | `tests/e2e/specs/AC-012-b.spec.ts` | — |
| AC-013-a | A merchant can request a payout up to their available balance | ❌ fail | `tests/e2e/specs/AC-013-a.spec.ts` | — |
| AC-013-b | A payout request for more than the available balance is refused | ✅ pass | `tests/e2e/specs/AC-013-b.spec.ts` | — |
| AC-014-a | A merchant can issue a refund for one of their own completed transactions | ❌ fail | `tests/e2e/specs/AC-014-a.spec.ts` | — |
| AC-015-a | A platform admin can view transactions across every merchant | ✅ pass | `tests/e2e/specs/AC-015-a.spec.ts` | — |
| AC-015-b | A platform admin can view payouts across every merchant | ✅ pass | `tests/e2e/specs/AC-015-b.spec.ts` | — |
| AC-016-a | A platform admin can view a list of disputed or failed transactions | ✅ pass | `tests/e2e/specs/AC-016-a.spec.ts` | — |
| AC-016-b | A platform admin can resolve or reject a dispute | ✅ pass | `tests/e2e/specs/AC-016-b.spec.ts` | — |

## Failures

### AC-006-b — A successful mobile money payment marks the payment request as paid

Spec: `tests/e2e/specs/AC-006-b.spec.ts`
Location: `AC-006-b.spec.ts:9`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Payment successful' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Payment successful' })

```

### AC-007-b — A successful card payment marks the payment request as paid

Spec: `tests/e2e/specs/AC-007-b.spec.ts`
Location: `AC-007-b.spec.ts:9`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Payment successful' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Payment successful' })

```

### AC-009-a — A customer sees a payment success confirmation immediately after a successful payment

Spec: `tests/e2e/specs/AC-009-a.spec.ts`
Location: `AC-009-a.spec.ts:9`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Payment successful' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Payment successful' })

```

### AC-013-a — A merchant can request a payout up to their available balance

Spec: `tests/e2e/specs/AC-013-a.spec.ts`
Location: `AC-013-a.spec.ts:7`

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByRole('button', { name: 'Request' })
Expected: enabled
Received: disabled
Timeout:  10000ms

Call log:
  - Expect "toBeEnabled" with timeout 10000ms
  - waiting for getByRole('button', { name: 'Request' })
    24 × locator resolved to <button disabled tabindex="-1" type="button" class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary Mui-disabled MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary css-vboj8t">Request</button>
       - unexpected value "disabled"

```

### AC-014-a — A merchant can issue a refund for one of their own completed transactions

Spec: `tests/e2e/specs/AC-014-a.spec.ts`
Location: `AC-014-a.spec.ts:9`

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByRole('row').filter({ hasText: '433.00' }).first().getByRole('button', { name: 'Refund' })
Expected: enabled
Received: disabled
Timeout:  10000ms

Call log:
  - Expect "toBeEnabled" with timeout 10000ms
  - waiting for getByRole('row').filter({ hasText: '433.00' }).first().getByRole('button', { name: 'Refund' })
    24 × locator resolved to <button disabled tabindex="-1" type="button" class="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-outlinedError MuiButton-sizeSmall MuiButton-outlinedSizeSmall MuiButton-colorError Mui-disabled MuiButton-root MuiButton-outlined MuiButton-outlinedError MuiButton-sizeSmall MuiButton-outlinedSizeSmall MuiButton-colorError css-6fe1un">Refund</button>
       - unexpected value "disabled"

```

## Manual checklist

- [ ] **AC-010-a** — A merchant is notified when a payment against one of their payment requests succeeds

