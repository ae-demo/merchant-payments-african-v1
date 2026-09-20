// spec: tests/validation/test-plan.md § AC-005-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { merchantCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";

test("AC-005-b: a newly created payment request appears in the merchant's list with pending status", async ({
  page,
}) => {
  await page.goto(target("merchant-webapp"));
  await signIn(page, merchantCreds());
  await expect(page).toHaveURL(/\/dashboard$/);

  const description = `e2e-${Date.now()}`;
  await page.goto(`${target("merchant-webapp")}/payment-requests/new`);
  await page.getByRole("spinbutton", { name: "Amount" }).fill("321");
  await page.getByRole("combobox", { name: "Currency" }).click();
  await page.getByRole("option", { name: "KES" }).click();
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/payment-requests$/);

  const row = page.getByRole("row").filter({ hasText: description });
  await expect(row).toBeVisible();
  await expect(row.getByText("pending", { exact: true })).toBeVisible();
});
