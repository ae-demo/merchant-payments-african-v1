# Validation report

- **Issue:** #8
- **Commit:** 3cd5e8874bcbbeb29f473cd16b62f33945ec8877
- **Generated:** 2026-09-21T08:22:35.855Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 26 | 25 | 0 | 1 |
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
| AC-008-a | A merchant can view a list of their own transactions with each transaction's status | ✅ pass | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-009-a | A customer sees a payment success confirmation immediately after a successful payment | ✅ pass | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-010-a | A merchant is notified when a payment against one of their payment requests succeeds | ⏭️ not_run | — | — |
| AC-011-a | A merchant can save a payout bank account with bank name, account number and account holder name | ✅ pass | `tests/e2e/specs/AC-011-a.spec.ts` | — |
| AC-012-a | A merchant can view their current available balance | ✅ pass | `tests/e2e/specs/AC-012-a.spec.ts` | healed ×1 |
| AC-012-b | A merchant can view a history of their past payouts | ✅ pass | `tests/e2e/specs/AC-012-b.spec.ts` | healed ×1 |
| AC-013-a | A merchant can request a payout up to their available balance | ✅ pass | `tests/e2e/specs/AC-013-a.spec.ts` | healed ×1 |
| AC-013-b | A payout request for more than the available balance is refused | ✅ pass | `tests/e2e/specs/AC-013-b.spec.ts` | — |
| AC-014-a | A merchant can issue a refund for one of their own completed transactions | ✅ pass | `tests/e2e/specs/AC-014-a.spec.ts` | — |
| AC-015-a | A platform admin can view transactions across every merchant | ✅ pass | `tests/e2e/specs/AC-015-a.spec.ts` | — |
| AC-015-b | A platform admin can view payouts across every merchant | ✅ pass | `tests/e2e/specs/AC-015-b.spec.ts` | healed ×1 |
| AC-016-a | A platform admin can view a list of disputed or failed transactions | ✅ pass | `tests/e2e/specs/AC-016-a.spec.ts` | — |
| AC-016-b | A platform admin can resolve or reject a dispute | ✅ pass | `tests/e2e/specs/AC-016-b.spec.ts` | healed ×1 |

## Healing log

| Criterion | Classification | Change | Commit |
|---|---|---|---|
| AC-012-a | locator drift + timing | getByText(/^\d+\.\d{2}$/) -> getByRole('heading', {level:4}) scoped to the balance stat (now ambiguous with payout-history table cells since the payment-gateway fix lets real payouts accrue); also wait for the GET /me/balance response instead of reading the page's 0.00 placeholder heading | `3a80887` |
| AC-013-a | locator drift + timing + setup | same balance-locator/response-wait fix as AC-012-a; also added a fresh top-up charge before requesting the payout, since a prior run of this same spec can leave the merchant's balance at 0 (having just paid it all out), which the original spec never needed to handle when the balance was permanently 0 anyway | `0c1264d` |
| AC-012-b | environment drift (data) | the payment-gateway fix (PR #17) means this merchant now has real payout history, so the 'No payouts yet' empty-state assertion (correct only while every charge failed) no longer reflects reality; changed setup to guarantee a fresh, uniquely-amounted payout via the API and assert its row renders in the history table | `7e1f6b5` |
| AC-015-b | environment drift (data) | same reasoning as AC-012-b, for the admin's cross-merchant payouts view: replaced the 'No payouts' empty-state assertion with a fresh, uniquely-amounted payout (own setup, mirroring AC-015-a's transactions pattern) and an assertion that its row renders | `f28f85e` |
| AC-016-b | setup drift | the spec's setup assumed a fresh charge reliably fails and auto-opens a dispute; now that the payment-gateway fix means most charges succeed, that setup is no longer reliable. Changed setup to pick an already-open dispute from this environment's standing supply (left over from before the fix) instead of manufacturing a new one, then resolve that one and assert its row updates to 'resolved' | `c87fbe1` |

