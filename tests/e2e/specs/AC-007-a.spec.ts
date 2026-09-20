// spec: tests/validation/test-plan.md § AC-007-a
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-007-a: a customer can open a payment request and choose to pay by card", async ({ page, browser }) => {
  const merchantContext = await browser.newContext();
  const merchantPage = await merchantContext.newPage();
  await merchantPage.goto(target("merchant-webapp"));
  await signIn(merchantPage, merchantCreds());
  await expect(merchantPage).toHaveURL(/\/dashboard$/);
  const token = await currentAccessToken(merchantPage);
  const api = await request.newContext();
  const requestId = await createPaymentRequest(api, target("payments-api"), token, {
    amount: 402,
    currency: "KES",
    description: `checkout-card-${Date.now()}`,
  });
  await merchantContext.close();

  await page.goto(`${target("merchant-webapp")}/pay/${requestId}`);
  await page.getByRole("tab", { name: "Card" }).click();

  await expect(page.getByRole("tab", { name: "Card", selected: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Card details" })).toBeVisible();
});
