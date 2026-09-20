// spec: tests/validation/test-plan.md § AC-001-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchant2Creds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { waitForMerchantLanding } from "../lib/merchantLanding";

// This spec ensures the registration itself (its own setup, so it also
// passes standalone), then asserts the pending-status invariant that is its
// actual criterion.
test("AC-001-b: after registering, the merchant's status is pending", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchant2Creds());
  let landing = await waitForMerchantLanding(page);

  if (landing === "register") {
    await page.getByRole("textbox", { name: "Business name" }).fill("Beta Traders Ltd");
    await page.getByRole("combobox", { name: "Country" }).click();
    await page.getByRole("option", { name: "South Africa" }).click();
    await page.getByRole("combobox", { name: "Currency" }).click();
    await page.getByRole("option", { name: "ZAR" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill("beta@test-users.invalid");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page).toHaveURL(/\/pending$/);
    landing = "pending";
  }

  // A merchant awaiting review sits on /pending with the "Pending" chip. If a
  // previous run's admin decision already resolved it to /dashboard, that
  // also proves it passed through "pending" on its way there.
  if (landing === "pending") {
    await expect(page.getByRole("heading", { name: "Registration submitted" })).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  } else {
    await expect(page).toHaveURL(/\/dashboard$/);
  }
});
