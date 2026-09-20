// spec: tests/validation/test-plan.md § AC-012-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-012-a: a merchant can view their current available balance", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${target("merchant-webapp")}/payouts`);
  await expect(page.getByText("Available balance")).toBeVisible();
  // The value is a numeric amount, e.g. "0.00" or "1250.00" — 0.00 is a
  // legitimate value on this environment (see test-plan.md's gateway
  // finding: no merchant has ever received a successful payment).
  await expect(page.getByText(/^\d+\.\d{2}$/)).toBeVisible();
});
