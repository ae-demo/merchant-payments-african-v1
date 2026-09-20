// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchant2Creds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { waitForMerchantLanding } from "../lib/merchantLanding";

// Registration is a one-time action per account (no un-register). This spec
// drives the real submission the first time it ever runs against
// test-merchant-2; a later re-run finds the account already past /register
// and treats that as evidence the submission previously succeeded, per
// tests/validation/test-plan.md's "Independence & idempotency notes".
test("AC-001-a: a signed-in user can submit a business registration", async ({ page }) => {
  // 1. Sign in as a merchant with no business registered yet
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchant2Creds());

  // 2. Land on /register, /pending or /dashboard depending on prior runs
  const landing = await waitForMerchantLanding(page);

  if (landing === "register") {
    // 3. Submit business name, country, currency and email
    await page.getByRole("textbox", { name: "Business name" }).fill("Beta Traders Ltd");
    await page.getByRole("combobox", { name: "Country" }).click();
    await page.getByRole("option", { name: "South Africa" }).click();
    await page.getByRole("combobox", { name: "Currency" }).click();
    await page.getByRole("option", { name: "ZAR" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill("beta@test-users.invalid");
    await page.getByRole("button", { name: "Register" }).click();

    // 4. Submission redirects to the pending-review screen
    await expect(page).toHaveURL(/\/pending$/);
  } else {
    // Already registered by a previous run: the guarded /register form is
    // unreachable, which is itself evidence a prior submission succeeded.
    await expect(page).toHaveURL(/\/(pending|dashboard)$/);
  }
});
