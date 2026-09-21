// spec: tests/validation/test-plan.md § AC-012-b
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-012-b: a merchant can view a history of their past payouts", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  // Guarantee at least one past payout exists, with a run-unique amount to
  // identify its row, rather than depending on whatever history happens to
  // be left over from other runs.
  const token = await currentAccessToken(page);
  const api = await request.newContext();
  const base = target("payments-api");
  const amount = 100 + (Date.now() % 400);
  const requestId = await createPaymentRequest(api, base, token, {
    amount,
    currency: "KES",
    description: `payout-history-${Date.now()}`,
  });
  await api.post(`${base}/payment-requests/${requestId}/pay`, {
    data: { method: "mobile-money", customerContact: "+254711333444" },
  });
  const payoutRes = await api.post(`${base}/me/payouts`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { amount },
  });
  expect(payoutRes.ok()).toBeTruthy();

  await page.goto(`${target("merchant-webapp")}/payouts`);
  await expect(page.getByRole("heading", { name: "Payouts" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Requested at" })).toBeVisible();

  // A merchant's own payout, just requested above, appears in their history.
  const row = page.getByRole("row").filter({ hasText: `${amount}.00` });
  await expect(row).toBeVisible();
});
