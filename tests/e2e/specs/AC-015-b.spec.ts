// spec: tests/validation/test-plan.md § AC-015-b
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds, merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-015-b: a platform admin can view payouts across every merchant", async ({ page, browser }) => {
  // Setup: guarantee at least one payout exists platform-wide (own
  // precondition), with a run-unique amount as its marker — the same
  // reasoning as AC-015-a for transactions.
  const amount = 100 + (Date.now() % 800);
  const merchantContext = await browser.newContext();
  const merchantPage = await merchantContext.newPage();
  await merchantPage.goto(target("merchant-webapp"));
  await signIn(merchantPage, merchantCreds());
  await expect(merchantPage).toHaveURL(/\/dashboard$/);
  const token = await currentAccessToken(merchantPage);
  const api = await request.newContext();
  const base = target("payments-api");
  const requestId = await createPaymentRequest(api, base, token, {
    amount,
    currency: "KES",
    description: `admin-payout-view-${Date.now()}`,
  });
  await api.post(`${base}/payment-requests/${requestId}/pay`, {
    data: { method: "mobile-money", customerContact: "+254711555666" },
  });
  const payoutRes = await api.post(`${base}/me/payouts`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { amount },
  });
  expect(payoutRes.ok(), await payoutRes.text()).toBeTruthy();
  await merchantContext.close();

  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());
  await page.goto(`${target("admin-webapp")}/payouts`);

  await expect(page.getByRole("heading", { name: "Payouts" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Merchant" })).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: `${amount}.00` }).first();
  await expect(row).toBeVisible();
});
