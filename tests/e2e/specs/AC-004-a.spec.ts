// spec: tests/validation/test-plan.md § AC-004-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-004-a: a platform admin can sign in via SSO and land on the admin console", async ({ page }) => {
  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());

  // "Merchants" (the pending-merchants queue) is the first reachable admin
  // screen — the admin console's landing oversight tool.
  await expect(page).toHaveURL(/\/merchants$/);
  await expect(page.getByRole("heading", { name: "Pending merchants" })).toBeVisible();
});
