// spec: tests/validation/test-plan.md § AC-013-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-013-a: a merchant can request a payout up to their available balance", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${target("merchant-webapp")}/payouts`);
  const balanceText = await page.getByText(/^\d+\.\d{2}$/).first().textContent();
  const available = Number(balanceText);

  await page.getByRole("button", { name: "Request payout" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(available));

  // Live finding (test-plan.md, "gateway always declines"): no merchant on
  // this environment has ever received a successful payment, so available
  // balance is permanently 0 and the dialog's own "Request" button stays
  // disabled at amount <= 0 — the happy path cannot be driven through the
  // UI. This assertion fails honestly rather than being worked around.
  await expect(page.getByRole("button", { name: "Request" })).toBeEnabled();
  await page.getByRole("button", { name: "Request" }).click();
  await expect(page.getByRole("dialog", { name: "Request payout" })).toBeHidden();
});
