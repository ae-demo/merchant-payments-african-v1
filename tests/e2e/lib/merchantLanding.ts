import type { Page } from "@playwright/test";

export type MerchantLanding = "register" | "pending" | "dashboard";

// App.tsx always routes a freshly-signed-in Merchant to "/register" first (it
// is the first private screen in SCREEN_ROUTES), then RegisterGuard's own
// async useMerchantStatus() fetch redirects on to /pending or /dashboard once
// the caller's real status is known. Waiting on the URL alone races that
// guard — it can observe the transient "/register" hit before the redirect
// fires. Wait for one of the three screens' own content instead.
export async function waitForMerchantLanding(page: Page): Promise<MerchantLanding> {
  await Promise.race([
    page.getByRole("textbox", { name: "Business name" }).waitFor({ state: "visible", timeout: 15_000 }),
    page.getByRole("heading", { name: "Registration submitted" }).waitFor({ state: "visible", timeout: 15_000 }),
    page.getByRole("heading", { name: "Dashboard" }).waitFor({ state: "visible", timeout: 15_000 }),
  ]);
  if (await page.getByRole("textbox", { name: "Business name" }).isVisible()) {
    return "register";
  }
  if (await page.getByRole("heading", { name: "Registration submitted" }).isVisible()) {
    return "pending";
  }
  return "dashboard";
}
