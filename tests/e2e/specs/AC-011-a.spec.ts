// spec: tests/validation/test-plan.md § AC-011-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-011-a: a merchant can save a payout bank account with bank name, account number and account holder name", async ({
  page,
}) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${target("merchant-webapp")}/payout-account`);
  await page.getByRole("textbox", { name: "Bank name" }).fill("Equity Bank");
  await page.getByRole("textbox", { name: "Account number" }).fill("0123456789");
  await page.getByRole("textbox", { name: "Account holder name" }).fill("Ada Trading Co");
  await page.getByRole("button", { name: "Save" }).click();

  // Saving redirects to the dashboard on success.
  await expect(page).toHaveURL(/\/dashboard$/);

  // Reload the settings screen and confirm the saved values were persisted.
  await page.goto(`${target("merchant-webapp")}/payout-account`);
  await expect(page.getByRole("textbox", { name: "Bank name" })).toHaveValue("Equity Bank");
  await expect(page.getByRole("textbox", { name: "Account number" })).toHaveValue("0123456789");
});
