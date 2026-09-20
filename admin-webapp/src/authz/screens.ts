// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. Each row names the API
// operation the screen exists to perform; the gate follows from that
// operation's requirement in ./operations.gen.ts, itself projected from
// payments-api's openapi.yaml. No handle, role or scope is named here or in
// any component.
//
// RAIL ORDER = the wireframes' flow order: PendingMerchants -> MerchantReview
// -> AllTransactions -> AllPayouts -> Disputes -> DisputeDetail. Only
// PendingMerchants, AllTransactions, AllPayouts and Disputes carry a sidebar
// entry (wireframes.dsl draws exactly those four in the sidebar); MerchantReview
// and DisputeDetail are reached by clicking a row, not from the rail.
//
// MerchantReview has no GET-by-id operation in the contract — a pending
// merchant's fields arrive with the PendingMerchants list and are carried into
// this screen by navigation state. Its own reach is the primary action the
// wireframe marks `primary` (Approve): naming it here is what gates the route,
// enables the Approve button through <Can>, and keeps the two in step.

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
  { key: "pending-merchants", label: "Merchants", path: "/merchants", loads: "GET /merchants" },
  {
    key: "merchant-review",
    label: "Merchant Review",
    path: "/merchants/:merchantId",
    loads: "POST /merchants/{merchantId}/approve",
  },
  { key: "all-transactions", label: "Transactions", path: "/transactions", loads: "GET /transactions" },
  { key: "all-payouts", label: "Payouts", path: "/payouts", loads: "GET /payouts" },
  { key: "disputes", label: "Disputes", path: "/disputes", loads: "GET /disputes" },
  {
    key: "dispute-detail",
    label: "Dispute Detail",
    path: "/disputes/:disputeId",
    loads: "GET /disputes/{disputeId}",
  },
];

// FAIL LOUDLY at module load — in dev, in the walk and in the deployed pod — so
// a committed table that outlived the contract cannot become a screen nobody
// can reach and nobody notices.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

/** The screens a caller can actually open, in rail order. */
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

/** Does this caller reach anything their scopes actually earned them? */
export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}

/** The screens shown in the sidebar rail — the four every-row list views. */
export const SIDEBAR_SCREEN_KEYS = [
  "pending-merchants",
  "all-transactions",
  "all-payouts",
  "disputes",
] as const;
