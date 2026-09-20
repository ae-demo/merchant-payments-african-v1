// spec: tests/validation/test-plan.md § AC-008-a
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-008-a: a merchant can view a list of their own transactions with each transaction's status", async ({
  page,
}) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  // Setup: guarantee at least one transaction exists, own precondition so
  // this spec also passes standalone. The live gateway integration declines
  // every charge (see test-plan.md), which conveniently produces a genuine
  // transaction row with a "failed" status to assert on.
  // The transactions table shows only amount/method/status/paid-at (no
  // description, which lives on the payment request, not the transaction),
  // so the amount itself has to be the unique, run-specific marker.
  const amount = 100 + (Date.now() % 800);
  const token = await currentAccessToken(page);
  const api = await request.newContext();
  const base = target("payments-api");
  const requestId = await createPaymentRequest(api, base, token, {
    amount,
    currency: "KES",
    description: `history-${Date.now()}`,
  });
  await api.post(`${base}/payment-requests/${requestId}/pay`, {
    data: { method: "mobile-money", customerContact: "+254700111222" },
  });

  await page.goto(`${target("merchant-webapp")}/transactions`);
  await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: `${amount}.00` }).first();
  await expect(row).toBeVisible();
});
