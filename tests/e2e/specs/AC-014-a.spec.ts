// spec: tests/validation/test-plan.md § AC-014-a
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-014-a: a merchant can issue a refund for one of their own completed transactions", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  // Setup: produce a fresh transaction to refund. The amount is the unique,
  // run-specific marker (the table shows no description column).
  const amount = 100 + (Date.now() % 800);
  const token = await currentAccessToken(page);
  const api = await request.newContext();
  const base = target("payments-api");
  const requestId = await createPaymentRequest(api, base, token, {
    amount,
    currency: "KES",
    description: `refund-${Date.now()}`,
  });
  await api.post(`${base}/payment-requests/${requestId}/pay`, {
    data: { method: "mobile-money", customerContact: "+254700333444" },
  });

  await page.goto(`${target("merchant-webapp")}/transactions`);
  const row = page.getByRole("row").filter({ hasText: `${amount}.00` }).first();
  await expect(row).toBeVisible();

  // Live finding (test-plan.md, "gateway always declines"): the charge just
  // made above comes back "failed", never "succeeded", and the "Refund"
  // button is only enabled for a succeeded transaction — no transaction on
  // this environment has ever reached that state. Expected to fail
  // honestly: there is nothing refundable to click through.
  await expect(row.getByRole("button", { name: "Refund" })).toBeEnabled();
  await row.getByRole("button", { name: "Refund" }).click();
  await page.getByRole("textbox", { name: "Reason for refund" }).fill("Customer requested a refund");
  await page.getByRole("button", { name: "Issue refund" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
});
