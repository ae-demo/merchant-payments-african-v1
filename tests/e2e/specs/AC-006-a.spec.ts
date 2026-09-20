// spec: tests/validation/test-plan.md § AC-006-a
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-006-a: a customer can open a payment request and choose to pay by mobile money", async ({
  page,
  browser,
}) => {
  // Setup: sign in as the merchant to create a fresh payment request.
  const merchantContext = await browser.newContext();
  const merchantPage = await merchantContext.newPage();
  await merchantPage.goto(target("merchant-webapp"));
  await signIn(merchantPage, merchantCreds());
  await expect(merchantPage).toHaveURL(/\/dashboard$/);
  const token = await currentAccessToken(merchantPage);
  const api = await request.newContext();
  const requestId = await createPaymentRequest(api, target("payments-api"), token, {
    amount: 400,
    currency: "KES",
    description: `checkout-mm-${Date.now()}`,
  });
  await merchantContext.close();

  // Act: an unauthenticated customer opens the payment link.
  await page.goto(`${target("merchant-webapp")}/pay/${requestId}`);

  // Mobile money is the default-selected tab.
  await expect(page.getByRole("tab", { name: "Mobile money", selected: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Phone number" })).toBeVisible();
});
