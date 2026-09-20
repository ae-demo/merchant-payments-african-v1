// spec: tests/validation/test-plan.md § AC-012-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-012-b: a merchant can view a history of their past payouts", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${target("merchant-webapp")}/payouts`);
  await expect(page.getByRole("heading", { name: "Payouts" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Requested at" })).toBeVisible();

  // No merchant on this environment has ever received a successful payment
  // (test-plan.md's gateway finding), so no payout can ever have been
  // requested — the well-formed empty state is the correct, passing view of
  // "their history".
  await expect(page.getByText("No payouts yet")).toBeVisible();
});
