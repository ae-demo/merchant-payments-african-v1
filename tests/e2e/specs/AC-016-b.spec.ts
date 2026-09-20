// spec: tests/validation/test-plan.md § AC-016-b
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds, merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-016-b: a platform admin can resolve or reject a dispute", async ({ page, browser }) => {
  // Setup: guarantee an OPEN dispute exists (see AC-016-a for why a failed
  // charge reliably produces one).
  const merchantContext = await browser.newContext();
  const merchantPage = await merchantContext.newPage();
  await merchantPage.goto(target("merchant-webapp"));
  await signIn(merchantPage, merchantCreds());
  await expect(merchantPage).toHaveURL(/\/dashboard$/);
  const token = await currentAccessToken(merchantPage);
  const api = await request.newContext();
  const base = target("payments-api");
  const requestId = await createPaymentRequest(api, base, token, {
    amount: 92,
    currency: "KES",
    description: `dispute-resolve-${Date.now()}`,
  });
  const payRes = await api.post(`${base}/payment-requests/${requestId}/pay`, {
    data: { method: "mobile-money", customerContact: "+254700777888" },
  });
  const transaction = (await payRes.json()) as { id: string };
  await merchantContext.close();

  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());
  await page.goto(`${target("admin-webapp")}/disputes`);

  const row = page.getByRole("row").filter({ hasText: transaction.id });
  await row.click();
  await expect(page.getByText("Status: open")).toBeVisible();

  await page.getByRole("textbox", { name: "Resolution notes" }).fill("Investigated; closing as resolved.");
  await page.getByRole("button", { name: "Resolve dispute" }).click();

  await expect(page).toHaveURL(/\/disputes$/);
  const resolvedRow = page.getByRole("row").filter({ hasText: transaction.id });
  await expect(resolvedRow.getByText("resolved", { exact: true })).toBeVisible();
});
