// spec: tests/validation/test-plan.md § AC-016-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-016-b: a platform admin can resolve or reject a dispute", async ({ page }) => {
  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());
  await page.goto(`${target("admin-webapp")}/disputes`);

  // Take whichever dispute is currently open — a fresh charge is no longer a
  // reliable way to produce one now that the payment gateway generally
  // succeeds (see AC-016-a); this environment already carries a standing
  // supply of open disputes raised by earlier failed charges.
  const openRow = page.getByRole("row").filter({ hasText: "open" }).first();
  await expect(openRow).toBeVisible();
  const disputeId = (await openRow.getByRole("cell").first().textContent())?.trim();
  expect(disputeId).toBeTruthy();

  await openRow.click();
  await expect(page.getByText("Status: open")).toBeVisible();

  await page.getByRole("textbox", { name: "Resolution notes" }).fill("Investigated; closing as resolved.");
  await page.getByRole("button", { name: "Resolve dispute" }).click();

  await expect(page).toHaveURL(/\/disputes$/);
  const resolvedRow = page.getByRole("row").filter({ hasText: disputeId! });
  await expect(resolvedRow.getByText("resolved", { exact: true })).toBeVisible();
});
