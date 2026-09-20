// spec: tests/validation/test-plan.md § AC-015-a
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds, merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-015-a: a platform admin can view transactions across every merchant", async ({ page, browser }) => {
  // Setup: guarantee at least one transaction exists (own precondition).
  // The amount itself is the unique, run-specific marker (AllTransactions
  // shows no description column — see AC-008-a for the same reasoning).
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
    description: `admin-view-${Date.now()}`,
  });
  await api.post(`${base}/payment-requests/${requestId}/pay`, {
    data: { method: "card", customerContact: "admin-view@example.com" },
  });
  await merchantContext.close();

  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());
  await page.goto(`${target("admin-webapp")}/transactions`);

  await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: `${amount}.00` }).first();
  await expect(row).toBeVisible();
});
