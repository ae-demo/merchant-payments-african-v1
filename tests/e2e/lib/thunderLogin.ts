import { type Page, expect } from "@playwright/test";
import type { Credentials } from "./creds";

// Neither merchant-webapp nor admin-webapp render their own "Sign in" button:
// a private route redirects an unauthenticated visitor straight to Thunder's
// own hosted sign-in page (a separate origin). Drive that page, then wait for
// the redirect back to the app to settle.
export async function signIn(page: Page, creds: Credentials): Promise<void> {
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("textbox", { name: "Username" }).fill(creds.username);
  await page.getByRole("textbox", { name: "Password" }).fill(creds.password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // The redirect back to the app lands on /callback, which itself does a
  // client-side redirect to "/", which App.tsx's own <Navigate> then redirects
  // again to the first reachable screen. A caller issuing its own page.goto()
  // right after leaving the IdP host races that in-flight chain ("Navigation
  // interrupted by another navigation"), so wait for it to fully settle: past
  // the IdP, past /callback, and past the bare "/" redirect.
  await page.waitForURL(
    (url) => !url.hostname.includes("development-idp") && url.pathname !== "/" && !url.pathname.endsWith("/callback"),
    { timeout: 20_000 },
  );
}
