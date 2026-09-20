// Seed data straight off wireframes.dsl's demo rows (via wireframes' seed.mjs),
// so the numbers a reviewer sees agree with the wireframe by construction.
// State lives in this module's scope: it resets on every full page load/reload,
// and persists across in-app navigation — see react-webapp's mock-mode.md.
//
// No scope check here: whether an operation may be called at all is
// mock/authz/gateway.ts's answer, read from openapi.yaml. This module only
// ever answers its path's reach — every row outside /me/, since payments-api
// carries no /me/ operation this app calls.

import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";

type Merchant = components["schemas"]["Merchant"];
type Transaction = components["schemas"]["Transaction"];
type Payout = components["schemas"]["Payout"];
type Dispute = components["schemas"]["Dispute"];

let merchants: Merchant[] = [
  {
    id: "merchant-1",
    businessName: "Acme Traders",
    country: "Kenya",
    currency: "KES",
    email: "acme@example.com",
    status: "pending",
    balance: 0,
  },
  {
    id: "merchant-2",
    businessName: "Kaya Foods",
    country: "South Africa",
    currency: "ZAR",
    email: "kaya@example.com",
    status: "pending",
    balance: 0,
  },
];

const transactions: Transaction[] = [
  {
    id: "txn-101",
    paymentRequestId: "req-101",
    method: "card",
    amount: 50.0,
    currency: "KES",
    status: "succeeded",
    customerContact: "customer-a@example.com",
    paidAt: "2026-09-18T09:00:00Z",
  },
  {
    id: "txn-102",
    paymentRequestId: "req-102",
    method: "mobile-money",
    amount: 20.0,
    currency: "ZAR",
    status: "failed",
    customerContact: "+27-555-0102",
    paidAt: "2026-09-17T14:30:00Z",
  },
  {
    id: "txn-118",
    paymentRequestId: "req-118",
    method: "card",
    amount: 75.0,
    currency: "KES",
    status: "succeeded",
    customerContact: "customer-b@example.com",
    paidAt: "2026-09-15T11:00:00Z",
  },
];

const payouts: Payout[] = [
  {
    id: "payout-1",
    merchantId: "merchant-1",
    amount: 100.0,
    status: "completed",
    requestedAt: "2026-09-10T08:00:00Z",
  },
  {
    id: "payout-2",
    merchantId: "merchant-2",
    amount: 40.0,
    status: "pending",
    requestedAt: "2026-09-19T08:00:00Z",
  },
];

let disputes: Dispute[] = [
  {
    id: "dispute-1",
    transactionId: "txn-102",
    raisedBy: "customer",
    status: "open",
    resolutionNotes: "",
    createdAt: "2026-09-17T15:00:00Z",
  },
  {
    id: "dispute-2",
    transactionId: "txn-118",
    raisedBy: "merchant",
    status: "open",
    resolutionNotes: "",
    createdAt: "2026-09-16T10:00:00Z",
  },
];

function paged<T>(items: T[], url: URL): { count: number; next: null; previous: null; data: T[] } {
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  return { count: items.length, next: null, previous: null, data: items.slice(offset, offset + limit) };
}

export const handlers = [
  http.get("/api/merchants", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? merchants.filter((m) => m.status === status) : merchants;
    return HttpResponse.json(paged(filtered, url));
  }),

  http.post("/api/merchants/:merchantId/approve", ({ params }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) {
      return HttpResponse.json({ code: 404, message: "Merchant not found" }, { status: 404 });
    }
    merchant.status = "approved";
    return HttpResponse.json(merchant);
  }),

  http.post("/api/merchants/:merchantId/reject", ({ params }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) {
      return HttpResponse.json({ code: 404, message: "Merchant not found" }, { status: 404 });
    }
    merchant.status = "rejected";
    return HttpResponse.json(merchant);
  }),

  http.get("/api/transactions", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paged(transactions, url));
  }),

  http.get("/api/payouts", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paged(payouts, url));
  }),

  http.get("/api/disputes", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? disputes.filter((d) => d.status === status) : disputes;
    return HttpResponse.json(paged(filtered, url));
  }),

  http.get("/api/disputes/:disputeId", ({ params }) => {
    const dispute = disputes.find((d) => d.id === params.disputeId);
    return dispute
      ? HttpResponse.json(dispute)
      : HttpResponse.json({ code: 404, message: "Dispute not found" }, { status: 404 });
  }),

  http.patch("/api/disputes/:disputeId", async ({ params, request }) => {
    const dispute = disputes.find((d) => d.id === params.disputeId);
    if (!dispute) {
      return HttpResponse.json({ code: 404, message: "Dispute not found" }, { status: 404 });
    }
    const body = (await request.json()) as { status: "resolved" | "rejected"; resolutionNotes?: string };
    dispute.status = body.status;
    dispute.resolutionNotes = body.resolutionNotes ?? dispute.resolutionNotes;
    return HttpResponse.json(dispute);
  }),
];
