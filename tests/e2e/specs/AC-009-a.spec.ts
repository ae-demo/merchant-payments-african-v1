// spec: tests/validation/test-plan.md § AC-009-a
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";
import { createPaymentRequest } from "../lib/paymentRequest";

test("AC-009-a: a customer sees a payment success confirmation immediately after a successful payment", async ({
  page,
  browser,
}) => {
  const merchantContext = await browser.newContext();
  const merchantPage = await merchantContext.newPage();
  await merchantPage.goto(target("merchant-webapp"));
  await signIn(merchantPage, merchantCreds());
  await expect(merchantPage).toHaveURL(/\/dashboard$/);
  const token = await currentAccessToken(merchantPage);
  const api = await request.newContext();
  const requestId = await createPaymentRequest(api, target("payments-api"), token, {
    amount: 404,
    currency: "KES",
    description: `checkout-confirmation-${Date.now()}`,
  });
  await merchantContext.close();

  await page.goto(`${target("merchant-webapp")}/pay/${requestId}`);
  await page.getByRole("textbox", { name: "Phone number" }).fill("+254712345000");
  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page).toHaveURL(new RegExp(`/pay/${requestId}/result$`));

  // Live finding (tests/validation/test-plan.md, "gateway always declines"):
  // no payment ever reaches "succeeded" on this deployed environment, so
  // the success confirmation is never shown — expected to fail honestly.
  await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();
  await expect(page.getByText("A confirmation has been sent to your phone/email.")).toBeVisible();
});
