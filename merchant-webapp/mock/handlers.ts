// One handler per payments-api operation this app calls. State lives in module
// scope (react-webapp's mock-mode.md): a full page load re-runs this module and
// resets every row to the seed below; only in-app navigation carries a change
// forward.
//
// THE ONE APP-SPECIFIC WRINKLE: whether the mock caller's merchant is
// registered and approved is DATA, not a role, and the wireframes draw both
// "brand new merchant" (F1: RegisterBusiness -> PendingApproval) and "already
// approved" (F2: the whole workspace) journeys for the SAME single "Merchant"
// role security.json declares. The seed below starts UNREGISTERED — the
// natural state for `enrolment: "self-service"` — so F1 is what a fresh
// `npm run dev:mock` load walks. To walk F2 without going through admin-webapp's
// approval step (a different component, out of this mock's reach), add
// `?merchant=approved` to any URL: every /me/merchant read returns an approved
// view without touching the real (still-unregistered, or still-pending) seed
// row. This mirrors the existing `?role=`/`?auth=out` mock conventions — it is
// a viewing lever for the walk, not a widened gate: the gateway layer
// (mock/authz/gateway.ts) still enforces every operation's scope exactly as
// declared, whatever `?merchant=` says.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";

type Merchant = components["schemas"]["Merchant"];
type PayoutAccount = components["schemas"]["PayoutAccount"];
type PaymentRequest = components["schemas"]["PaymentRequest"];
type PaymentRequestInput = components["schemas"]["PaymentRequestInput"];
type PayInput = components["schemas"]["PayInput"];
type Transaction = components["schemas"]["Transaction"];
type RefundInput = components["schemas"]["RefundInput"];
type Payout = components["schemas"]["Payout"];

export const mockCaller = {
  merchantId: "merchant-1",
};

// UNREGISTERED by default — see the module comment.
let merchant: Merchant | null = null;

let payoutAccount: PayoutAccount | null = {
  bankName: "Equity Bank",
  accountNumber: "0123456789",
  accountHolderName: "Kilimanjaro Traders Ltd",
};

let paymentRequests: PaymentRequest[] = [
  {
    id: "pr-1",
    amount: 50.0,
    currency: "KES",
    description: "Order #123",
    status: "pending",
    createdAt: "2026-09-18T10:00:00Z",
  },
  {
    id: "pr-2",
    amount: 20.0,
    currency: "ZAR",
    description: "Order #124",
    status: "paid",
    createdAt: "2026-09-17T09:00:00Z",
  },
];

let transactions: Transaction[] = [
  {
    id: "txn-1",
    paymentRequestId: "pr-2",
    method: "card",
    amount: 50.0,
    currency: "KES",
    status: "succeeded",
    customerContact: "customer1@example.test",
    paidAt: "2026-09-18T10:05:00Z",
  },
  {
    id: "txn-2",
    paymentRequestId: "pr-2",
    method: "mobile-money",
    amount: 20.0,
    currency: "ZAR",
    status: "succeeded",
    customerContact: "+254700000000",
    paidAt: "2026-09-17T09:10:00Z",
  },
];

let payouts: Payout[] = [
  {
    id: "payout-1",
    merchantId: mockCaller.merchantId,
    amount: 100.0,
    status: "completed",
    requestedAt: "2026-09-10T12:00:00Z",
  },
  {
    id: "payout-2",
    merchantId: mockCaller.merchantId,
    amount: 40.0,
    status: "pending",
    requestedAt: "2026-09-19T08:00:00Z",
  },
];

let balance = 128.5;
const BALANCE_CURRENCY = "KES";

let nextId = 3;

/** The seed used for the `?merchant=approved` viewing override — see the header. */
const APPROVED_TEMPLATE: Merchant = {
  id: mockCaller.merchantId,
  businessName: "Kilimanjaro Traders",
  country: "KE",
  currency: "KES",
  email: "owner@kilimanjaro-traders.test",
  status: "approved",
  balance,
};

// `?merchant=approved` never reaches `/api/me/merchant` itself — it is a param
// on the PAGE the caller loaded, not on the API call, and by the time
// RegisterGuard's fetch fires, App.tsx's `<Navigate to={landing} replace>` has
// already replaced the URL with a bare `/register` (see App.tsx's SignedIn()),
// so neither `request.url` nor even a fresh `window.location.search` read at
// request time still carries it. This module loads and runs (mock/browser.ts,
// awaited in main.tsx) BEFORE that redirect — before React even mounts — so
// this is the one moment the param is still on the URL; persist it here,
// mirroring mock/authz/session.ts's ROLE_STORAGE_KEY for the same reason: an
// in-app navigation must not forget it.
const MERCHANT_OVERRIDE_KEY = "aep-mock-merchant-override";

(function persistMerchantOverride(): void {
  const param = new URLSearchParams(window.location.search).get("merchant");
  if (param === null) return;
  try {
    sessionStorage.setItem(MERCHANT_OVERRIDE_KEY, param);
  } catch {
    /* private mode: the override only lasts this one load */
  }
})();

function merchantOverride(): string | null {
  try {
    return sessionStorage.getItem(MERCHANT_OVERRIDE_KEY);
  } catch {
    return null;
  }
}

function requestedMerchant(): Merchant | null {
  const forceApproved = merchantOverride() === "approved";
  if (forceApproved) return { ...(merchant ?? APPROVED_TEMPLATE), status: "approved" };
  return merchant;
}

function errorBody(code: number, message: string): { code: number; message: string } {
  return { code, message };
}

export const handlers = [
  http.post("/api/merchants", async ({ request }) => {
    const input = (await request.json()) as Partial<Merchant>;
    if (!input.businessName || !input.country || !input.currency || !input.email) {
      return HttpResponse.json(errorBody(400, "businessName, country, currency and email are required"), {
        status: 400,
      });
    }
    merchant = {
      id: mockCaller.merchantId,
      businessName: input.businessName,
      country: input.country,
      currency: input.currency,
      email: input.email,
      status: "pending",
      balance: 0,
    };
    return HttpResponse.json(merchant, { status: 201 });
  }),

  http.get("/api/me/merchant", () => {
    const found = requestedMerchant();
    if (!found) {
      return HttpResponse.json(errorBody(404, "No merchant profile for the caller"), { status: 404 });
    }
    return HttpResponse.json(found);
  }),

  http.get("/api/me/payout-account", () => {
    if (!payoutAccount) {
      return HttpResponse.json(errorBody(404, "No payout account configured"), { status: 404 });
    }
    return HttpResponse.json(payoutAccount);
  }),

  http.put("/api/me/payout-account", async ({ request }) => {
    const input = (await request.json()) as Partial<PayoutAccount>;
    if (!input.bankName || !input.accountNumber || !input.accountHolderName) {
      return HttpResponse.json(errorBody(400, "bankName, accountNumber and accountHolderName are required"), {
        status: 400,
      });
    }
    payoutAccount = {
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      accountHolderName: input.accountHolderName,
    };
    return HttpResponse.json(payoutAccount);
  }),

  http.get("/api/me/payment-requests", () => {
    return HttpResponse.json({ count: paymentRequests.length, next: null, previous: null, data: paymentRequests });
  }),

  http.post("/api/me/payment-requests", async ({ request }) => {
    const input = (await request.json()) as PaymentRequestInput;
    if (!input.amount || !input.currency) {
      return HttpResponse.json(errorBody(400, "amount and currency are required"), { status: 400 });
    }
    const created: PaymentRequest = {
      id: `pr-${String(nextId++)}`,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    paymentRequests = [created, ...paymentRequests];
    return HttpResponse.json(created, { status: 201 });
  }),

  // Public — no gateway policy: mock/authz/gateway.ts lets these through
  // unconditionally (`security: []` in the contract).
  http.get("/api/payment-requests/:requestId", ({ params }) => {
    const found = paymentRequests.find((r) => r.id === params.requestId);
    if (!found) {
      return HttpResponse.json(errorBody(404, "Payment request not found"), { status: 404 });
    }
    return HttpResponse.json(found);
  }),

  http.post("/api/payment-requests/:requestId/pay", async ({ params, request }) => {
    const found = paymentRequests.find((r) => r.id === params.requestId);
    if (!found) {
      return HttpResponse.json(errorBody(404, "Payment request not found"), { status: 404 });
    }
    if (found.status !== "pending") {
      return HttpResponse.json(errorBody(400, "Payment request is not payable"), { status: 400 });
    }
    const input = (await request.json()) as PayInput;
    if (!input.method || !input.customerContact) {
      return HttpResponse.json(errorBody(400, "method and customerContact are required"), { status: 400 });
    }
    found.status = "paid";
    balance += found.amount;
    if (merchant) merchant.balance = balance;
    const transaction: Transaction = {
      id: `txn-${String(nextId++)}`,
      paymentRequestId: found.id,
      method: input.method,
      amount: found.amount,
      currency: found.currency,
      status: "succeeded",
      customerContact: input.customerContact,
      paidAt: new Date().toISOString(),
    };
    transactions = [transaction, ...transactions];
    return HttpResponse.json(transaction);
  }),

  http.get("/api/me/transactions", () => {
    return HttpResponse.json({ count: transactions.length, next: null, previous: null, data: transactions });
  }),

  http.post("/api/me/transactions/:transactionId/refund", async ({ params, request }) => {
    const found = transactions.find((t) => t.id === params.transactionId);
    if (!found) {
      return HttpResponse.json(errorBody(404, "Transaction not found"), { status: 404 });
    }
    if (found.status !== "succeeded") {
      return HttpResponse.json(errorBody(400, "Transaction not refundable"), { status: 400 });
    }
    const input = (await request.json()) as RefundInput;
    if (!input.reason) {
      return HttpResponse.json(errorBody(400, "reason is required"), { status: 400 });
    }
    const refundAmount = input.amount ?? found.amount;
    balance -= refundAmount;
    if (merchant) merchant.balance = balance;
    found.status = "failed";
    return HttpResponse.json(found);
  }),

  http.get("/api/me/balance", () => {
    return HttpResponse.json({ available: balance, currency: BALANCE_CURRENCY });
  }),

  http.post("/api/me/payouts", async ({ request }) => {
    const input = (await request.json()) as { amount?: number };
    if (!input.amount || input.amount <= 0) {
      return HttpResponse.json(errorBody(400, "amount is required"), { status: 400 });
    }
    if (!payoutAccount) {
      return HttpResponse.json(errorBody(400, "No payout account configured"), { status: 400 });
    }
    if (input.amount > balance) {
      return HttpResponse.json(errorBody(400, "Amount exceeds available balance"), { status: 400 });
    }
    balance -= input.amount;
    if (merchant) merchant.balance = balance;
    const payout: Payout = {
      id: `payout-${String(nextId++)}`,
      merchantId: mockCaller.merchantId,
      amount: input.amount,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    payouts = [payout, ...payouts];
    return HttpResponse.json(payout, { status: 201 });
  }),

  http.get("/api/me/payouts", () => {
    return HttpResponse.json({ count: payouts.length, next: null, previous: null, data: payouts });
  }),
];
