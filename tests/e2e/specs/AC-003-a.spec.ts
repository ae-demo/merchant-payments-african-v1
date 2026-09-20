// spec: tests/validation/test-plan.md § AC-003-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-003-a: a merchant can sign in via SSO and land on their dashboard", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
