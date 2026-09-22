# Validation report

- **Issue:** #8
- **Commit:** f22461dc7e6e6e11b4f969e1627a40db44b7794d
- **Generated:** 2026-09-22T15:57:42.621Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 26 | 24 | 1 | 1 |
| manual (human checklist) | 0 | — | — | — |
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
| AC-006-b | A successful mobile money payment marks the payment request as paid | ✅ pass | `tests/e2e/specs/AC-006-b.spec.ts` | — |
| AC-007-a | A customer can open a payment request and choose to pay by card | ✅ pass | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | A successful card payment marks the payment request as paid | ✅ pass | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | A merchant can view a list of their own transactions with each transaction's status | ❌ fail | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-009-a | A customer sees a payment success confirmation immediately after a successful payment | ✅ pass | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-010-a | A merchant is notified when a payment against one of their payment requests succeeds | ⏭️ not_run | — | — |
| AC-011-a | A merchant can save a payout bank account with bank name, account number and account holder name | ✅ pass | `tests/e2e/specs/AC-011-a.spec.ts` | — |
| AC-012-a | A merchant can view their current available balance | ✅ pass | `tests/e2e/specs/AC-012-a.spec.ts` | healed ×1 |
| AC-012-b | A merchant can view a history of their past payouts | ✅ pass | `tests/e2e/specs/AC-012-b.spec.ts` | — |
| AC-013-a | A merchant can request a payout up to their available balance | ✅ pass | `tests/e2e/specs/AC-013-a.spec.ts` | — |
| AC-013-b | A payout request for more than the available balance is refused | ✅ pass | `tests/e2e/specs/AC-013-b.spec.ts` | — |
| AC-014-a | A merchant can issue a refund for one of their own completed transactions | ✅ pass | `tests/e2e/specs/AC-014-a.spec.ts` | — |
| AC-015-a | A platform admin can view transactions across every merchant | ✅ pass | `tests/e2e/specs/AC-015-a.spec.ts` | — |
| AC-015-b | A platform admin can view payouts across every merchant | ✅ pass | `tests/e2e/specs/AC-015-b.spec.ts` | — |
| AC-016-a | A platform admin can view a list of disputed or failed transactions | ✅ pass | `tests/e2e/specs/AC-016-a.spec.ts` | — |
| AC-016-b | A platform admin can resolve or reject a dispute | ✅ pass | `tests/e2e/specs/AC-016-b.spec.ts` | — |

## Failures

### AC-008-a — A merchant can view a list of their own transactions with each transaction's status

Spec: `tests/e2e/specs/AC-008-a.spec.ts`
Location: `AC-008-a.spec.ts:9`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('row').filter({ hasText: '299.00' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('row').filter({ hasText: '299.00' }).first()

```

## Healing log

| Criterion | Classification | Change | Commit |
|---|---|---|---|
| AC-012-a | timing | capture the /me/balance response body eagerly instead of after the full-page navigation to /payouts settles, to avoid a CDP resource-teardown race | `ddf919e` |

