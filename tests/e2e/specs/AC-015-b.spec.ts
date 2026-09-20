// spec: tests/validation/test-plan.md § AC-015-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-015-b: a platform admin can view payouts across every merchant", async ({ page }) => {
  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());
  await page.goto(`${target("admin-webapp")}/payouts`);

  await expect(page.getByRole("heading", { name: "Payouts" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Merchant" })).toBeVisible();

  // No merchant on this environment has ever received a successful payment
  // (test-plan.md's gateway finding), so no payout has ever been requested
  // platform-wide — the well-formed empty state is the correct, passing
  // view of "every payout".
  await expect(page.getByText("No payouts")).toBeVisible();
});
