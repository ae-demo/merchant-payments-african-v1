import type { Page } from "@playwright/test";

// The SPA stores its oidc-client-ts session under a key named
// "oidc.user:<issuer>:<client_id>". Reading the already-signed-in page's own
// access token lets a spec do fixture setup (create a payment request,
// look a merchant up by name) against the real API without a second,
// separate login.
export async function currentAccessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("oidc.user:")) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          return (JSON.parse(raw) as { access_token?: string }).access_token ?? null;
        }
      }
    }
    return null;
  });
  if (!token) {
    throw new Error("no active oidc session found in localStorage — sign in before calling currentAccessToken");
  }
  return token;
}
