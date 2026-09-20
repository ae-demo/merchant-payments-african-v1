// spec: tests/validation/test-plan.md § AC-016-a
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds, merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-016-a: a platform admin can view a list of disputed or failed transactions", async ({ page, browser }) => {
  // Setup: guarantee at least one dispute exists. payments-api auto-opens a
  // dispute (raisedBy "system") whenever a charge comes back failed — and
  // every charge on this environment does (test-plan.md's gateway finding),
  // so this is a reliable, repeatable way to produce fixture data.
  const merchantContext = await browser.newContext();
  const merchantPage = await merchantContext.newPage();
  await merchantPage.goto(target("merchant-webapp"));
  await signIn(merchantPage, merchantCreds());
  await expect(merchantPage).toHaveURL(/\/dashboard$/);
  const token = await currentAccessToken(merchantPage);
  const api = await request.newContext();
  const base = target("payments-api");
  const requestId = await createPaymentRequest(api, base, token, {
    amount: 91,
    currency: "KES",
    description: `dispute-${Date.now()}`,
  });
  await api.post(`${base}/payment-requests/${requestId}/pay`, {
    data: { method: "mobile-money", customerContact: "+254700555666" },
  });
  await merchantContext.close();

  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());
  await page.goto(`${target("admin-webapp")}/disputes`);

  await expect(page.getByRole("heading", { name: "Disputes" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "open" });
  await expect(row.first()).toBeVisible();
});
