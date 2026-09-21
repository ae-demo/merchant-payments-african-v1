// spec: tests/validation/test-plan.md § AC-013-a
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-013-a: a merchant can request a payout up to their available balance", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  // A prior run of this same spec may have just paid out the merchant's
  // entire balance, leaving it at 0 — requesting a payout "up to the
  // available balance" needs that balance to be positive, so guarantee it
  // with a fresh successful charge rather than trusting whatever is left
  // over from previous runs.
  const token = await currentAccessToken(page);
  const api = await request.newContext();
  const base = target("payments-api");
  const topUpAmount = 100 + (Date.now() % 400);
  const requestId = await createPaymentRequest(api, base, token, {
    amount: topUpAmount,
    currency: "KES",
    description: `payout-topup-${Date.now()}`,
  });
  const payRes = await api.post(`${base}/payment-requests/${requestId}/pay`, {
    data: { method: "mobile-money", customerContact: "+254711222333" },
  });
  const transaction = (await payRes.json()) as { status: string };
  expect(transaction.status).toBe("succeeded");

  // The page renders a "0.00" placeholder heading before its GET /me/balance
  // call resolves, and that placeholder also matches the balance regex, so a
  // plain read races the fetch. Wait for the response itself, not just the
  // element's appearance.
  const [balanceResponse] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/me/balance") && res.ok()),
    page.goto(`${target("merchant-webapp")}/payouts`),
  ]);
  const available = ((await balanceResponse.json()) as { available: number }).available;
  expect(available).toBeGreaterThan(0);
  // The balance stat is the page's only level-4 heading; a generic numeric
  // text regex also matches payout-history table cells once a merchant has
  // real payouts, and is ambiguous there.
  await expect(page.getByRole("heading", { level: 4, name: /^\d+\.\d{2}$/ })).toHaveText(available.toFixed(2));

  await page.getByRole("button", { name: "Request payout" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(available));

  await expect(page.getByRole("button", { name: "Request" })).toBeEnabled();
  await page.getByRole("button", { name: "Request" }).click();
  await expect(page.getByRole("dialog", { name: "Request payout" })).toBeHidden();
});
