// spec: tests/validation/test-plan.md § AC-012-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-012-a: a merchant can view their current available balance", async ({ page }) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  // The page renders a "0.00" placeholder heading before its GET /me/balance
  // call resolves; wait for the response itself so the assertion below
  // reflects the merchant's real current balance, not the placeholder.
  const [balanceResponse] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/me/balance") && res.ok()),
    page.goto(`${target("merchant-webapp")}/payouts`),
  ]);
  const available = ((await balanceResponse.json()) as { available: number }).available;
  await expect(page.getByText("Available balance")).toBeVisible();
  // The balance stat is the page's only level-4 heading; a generic numeric
  // text regex also matches payout-history table cells once a merchant has
  // real payouts, and is ambiguous (strict-mode violation) there.
  await expect(page.getByRole("heading", { level: 4 })).toHaveText(available.toFixed(2));
});
