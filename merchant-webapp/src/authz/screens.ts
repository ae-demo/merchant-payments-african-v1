// Adapted from thunder-authentication's screens.example.ts pattern for the
// merchant-webapp screens drawn in wireframes.dsl.
//
// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS, and all it says about each
// one is which API operation it LOADS. The gate follows: a screen is reachable
// when the caller may call that operation, and what the operation needs is in
// the contract, projected into ./operations.gen.ts. Nothing here names a scope,
// a role or a handle, and security.json carries no screen table at all.
//
// The order is the wireframes.dsl declaration order: RegisterBusiness and
// PendingApproval first (the F1 registration flow), then the F2 workspace
// screens in the sidebar's order, then the F3 public checkout screens last.
//
// Whether a Merchant sees RegisterBusiness, PendingApproval or the workspace
// is a DATA question (the merchant's own `status`), not a scope question — the
// Merchant role holds every one of these operations' scopes regardless of
// approval status. That extra gate lives in src/merchant/MerchantStatusGuard.tsx,
// layered on top of the RequireOperation gate this table drives; it is not
// something this file, or the platform's authz assets, models.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "register", label: "Register Business", path: "/register", loads: "POST /merchants" },
  { key: "pending", label: "Pending Approval", path: "/pending", loads: "GET /me/merchant" },
  { key: "dashboard", label: "Dashboard", path: "/dashboard", loads: "GET /me/balance" },
  {
    key: "paymentrequests",
    label: "Payment Requests",
    path: "/payment-requests",
    loads: "GET /me/payment-requests",
  },
  {
    key: "createpaymentrequest",
    label: "New Payment Request",
    path: "/payment-requests/new",
    loads: "POST /me/payment-requests",
  },
  { key: "transactions", label: "Transactions", path: "/transactions", loads: "GET /me/transactions" },
  {
    key: "refund",
    label: "Refund",
    path: "/transactions/:transactionId/refund",
    loads: "POST /me/transactions/{transactionId}/refund",
  },
  {
    key: "payoutaccount",
    label: "Payout Account",
    path: "/payout-account",
    loads: "GET /me/payout-account",
  },
  { key: "payouts", label: "Payouts", path: "/payouts", loads: "GET /me/payouts" },
  {
    key: "checkout",
    label: "Checkout",
    path: "/pay/:requestId",
    loads: "GET /payment-requests/{requestId}",
    public: true,
  },
  {
    key: "paymentresult",
    label: "Payment Result",
    path: "/pay/:requestId/result",
    loads: null,
    public: true,
  },
];

// FAIL LOUDLY, at module load — the first render, every time, in dev, in the
// mock walk and in the deployed pod. `loads` is typed as an OperationKey, so a
// name the contract does not declare is already a type error; this catches the
// case tsc cannot, a COMMITTED operations.gen.ts that went stale against a
// contract nobody regenerated from.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  // NOT "reachable and private": RegisterBusiness loads "POST /merchants",
  // which OPERATIONS gates on `signedIn` alone (self-service enrolment — any
  // authenticated caller may register), so every signed-in caller reaches it
  // whether or not they hold a single project scope. Counting that screen here
  // made a zero-scope caller (and PlatformAdmin, who holds none of THIS app's
  // scopes) register as having "scoped reach": NoAccess never rendered, landing
  // sent them to /register, and RegisterGuard's own GET /me/merchant call (which
  // DOES require a scope) came back Forbidden instead — the one state this gate
  // exists to keep them out of. Only a screen actually gated on a scope the
  // caller holds proves the caller has real reach into this app.
  return SCREEN_ROUTES.some((screen) => {
    if (screen.public || screen.loads === null) return false;
    const requirement = OPERATIONS[screen.loads];
    return requirement.kind === "scope" && canCall(requirement, scopes, signedIn);
  });
}
