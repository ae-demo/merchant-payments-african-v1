// spec: tests/validation/test-plan.md § AC-013-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-013-b: a payout request for more than the available balance is refused", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${target("merchant-webapp")}/payouts`);
  await page.getByRole("button", { name: "Request payout" }).click();
  // A very large amount is guaranteed to exceed any balance this account
  // could plausibly hold.
  await page.getByRole("spinbutton", { name: "Amount" }).fill("999999999");
  await page.getByRole("button", { name: "Request" }).click();

  await expect(page.getByRole("alert")).toContainText("amount exceeds available balance");
});
