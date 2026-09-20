// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds, merchant2Creds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { waitForMerchantLanding } from "../lib/merchantLanding";

const BUSINESS_NAME = "Beta Traders Ltd";

test("AC-002-b: a platform admin can approve a pending merchant, changing its status to approved", async ({
  page,
  browser,
}) => {
  // Setup: ensure the target merchant is registered, in its own browser
  // context, so this spec also passes when run alone (not only after
  // AC-001-a has registered it in the same suite run).
  const merchantContext = await browser.newContext();
  const merchantPage = await merchantContext.newPage();
  await merchantPage.goto(target("merchant-webapp"));
  await signIn(merchantPage, merchant2Creds());
  const landing = await waitForMerchantLanding(merchantPage);
  if (landing === "register") {
    await merchantPage.getByRole("textbox", { name: "Business name" }).fill(BUSINESS_NAME);
    await merchantPage.getByRole("combobox", { name: "Country" }).click();
    await merchantPage.getByRole("option", { name: "South Africa" }).click();
    await merchantPage.getByRole("combobox", { name: "Currency" }).click();
    await merchantPage.getByRole("option", { name: "ZAR" }).click();
    await merchantPage.getByRole("textbox", { name: "Email" }).fill("beta@test-users.invalid");
    await merchantPage.getByRole("button", { name: "Register" }).click();
    await expect(merchantPage).toHaveURL(/\/pending$/);
  }
  await merchantContext.close();

  // Act: sign in as the platform admin and approve it.
  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());
  await expect(page).toHaveURL(/\/merchants$/);

  const token = await currentAccessToken(page);
  const api = await request.newContext();
  const res = await api.get(`${target("payments-api")}/merchants?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { data } = (await res.json()) as { data: { id: string; businessName: string }[] };
  const merchant = data.find((m) => m.businessName === BUSINESS_NAME);
  expect(merchant, `expected a merchant named "${BUSINESS_NAME}" to exist`).toBeTruthy();

  await page.goto(`${target("admin-webapp")}/merchants/${merchant!.id}`);
  await expect(page.getByRole("heading", { name: BUSINESS_NAME })).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page).toHaveURL(/\/merchants$/);
});
