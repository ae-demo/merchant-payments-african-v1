import type { APIRequestContext } from "@playwright/test";

// Fixture setup shared by the Checkout specs: create a fresh payment request
// as the merchant via the API (faster and more direct than driving the
// CreatePaymentRequest form again for every spec that just needs one to
// exist), then hand its id to the public /pay/:id flow the spec drives.
export async function createPaymentRequest(
  api: APIRequestContext,
  base: string,
  token: string,
  body: { amount: number; currency: string; description?: string },
): Promise<string> {
  const res = await api.post(`${base}/me/payment-requests`, {
    headers: { Authorization: `Bearer ${token}` },
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`failed to create payment request: ${res.status()} ${await res.text()}`);
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}
