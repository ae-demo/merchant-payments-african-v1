// spec: tests/validation/test-plan.md § AC-007-b
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-007-b: a successful card payment marks the payment request as paid", async ({ page, browser }) => {
  const merchantContext = await browser.newContext();
  const merchantPage = await merchantContext.newPage();
  await merchantPage.goto(target("merchant-webapp"));
  await signIn(merchantPage, merchantCreds());
  await expect(merchantPage).toHaveURL(/\/dashboard$/);
  const token = await currentAccessToken(merchantPage);
  const api = await request.newContext();
  const requestId = await createPaymentRequest(api, target("payments-api"), token, {
    amount: 403,
    currency: "KES",
    description: `checkout-card-paid-${Date.now()}`,
  });
  await merchantContext.close();

  await page.goto(`${target("merchant-webapp")}/pay/${requestId}`);
  await page.getByRole("tab", { name: "Card" }).click();
  await page.getByRole("textbox", { name: "Card details" }).fill("4111 1111 1111 1111");
  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page).toHaveURL(new RegExp(`/pay/${requestId}/result$`));

  // Live finding (tests/validation/test-plan.md, "gateway always declines"):
  // expected to fail honestly against the deployed system.
  await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
});
