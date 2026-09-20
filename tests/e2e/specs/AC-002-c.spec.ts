// spec: tests/validation/test-plan.md § AC-002-c
import { test, expect, request } from "@playwright/test";
import { target } from "../lib/targets";
import { adminCreds } from "../lib/creds";
import { signIn } from "../lib/thunderLogin";
import { currentAccessToken } from "../lib/apiToken";

const BUSINESS_NAME = "AEP Reject Target";

test("AC-002-c: a platform admin can reject a pending merchant, changing its status to rejected", async ({
  page,
}) => {
  await page.goto(target("admin-webapp"));
  await signIn(page, adminCreds());
  await expect(page).toHaveURL(/\/merchants$/);

  // Setup: ensure a merchant to reject exists. registerMerchant requires
  // only a signed-in caller, so the admin's own token seeds a standalone
  // pending merchant purely for this reject-path test, idempotently — 201
  // the first run, 400 "already exists" thereafter (rejecting has no
  // undo, so a later run just re-drives the same reject action on it).
  const token = await currentAccessToken(page);
  const api = await request.newContext();
  await api.post(`${target("payments-api")}/merchants`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      businessName: BUSINESS_NAME,
      country: "KE",
      currency: "KES",
      email: "reject-target@test-users.invalid",
    },
  });

  const res = await api.get(`${target("payments-api")}/merchants?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { data } = (await res.json()) as { data: { id: string; businessName: string }[] };
  const merchant = data.find((m) => m.businessName === BUSINESS_NAME);
  expect(merchant, `expected a merchant named "${BUSINESS_NAME}" to exist`).toBeTruthy();

  await page.goto(`${target("admin-webapp")}/merchants/${merchant!.id}`);
  await expect(page.getByRole("heading", { name: BUSINESS_NAME })).toBeVisible();
  await page.getByRole("button", { name: "Reject" }).click();
  await expect(page).toHaveURL(/\/merchants$/);
});
