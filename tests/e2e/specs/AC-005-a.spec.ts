// spec: tests/validation/test-plan.md § AC-005-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-005-a: an approved merchant can create a payment request with an amount and currency", async ({
  page,
}) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${target("merchant-webapp")}/payment-requests/new`);
  await page.getByRole("spinbutton", { name: "Amount" }).fill("500");
  await page.getByRole("combobox", { name: "Currency" }).click();
  await page.getByRole("option", { name: "KES" }).click();
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(/\/payment-requests$/);
});
