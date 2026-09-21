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
  // call resolves; capture the response body itself so the assertion below
  // reflects the merchant's real current balance, not the placeholder.
  //
  // Read the body eagerly from the "response" event rather than awaiting
  // page.waitForResponse() alongside the goto(): the full-page navigation to
  // /payouts tears down the CDP target the response body lives on, and by
  // the time a Promise.all()-awaited handler gets around to calling
  // response.json(), that resource is sometimes already gone ("Network.
  // getResponseBody: No resource with given identifier found"). Starting the
  // body fetch the instant the response event fires avoids the race.
  let balanceJson: Promise<{ available: number }> | undefined;
  page.on("response", (res) => {
    if (!balanceJson && res.url().includes("/me/balance") && res.ok()) {
      balanceJson = res.json();
    }
  });
  await page.goto(`${target("merchant-webapp")}/payouts`);
  await expect.poll(() => balanceJson !== undefined).toBe(true);
  const available = (await balanceJson!).available;
  await expect(page.getByText("Available balance")).toBeVisible();
  // The balance stat is the page's only level-4 heading; a generic numeric
  // text regex also matches payout-history table cells once a merchant has
  // real payouts, and is ambiguous (strict-mode violation) there.
  await expect(page.getByRole("heading", { level: 4 })).toHaveText(available.toFixed(2));
});
