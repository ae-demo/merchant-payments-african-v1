// mockEnv carries exactly the keys the platform emits for this component: the
// `thunder-app` OIDC dependency's four browser-facing outputs. No sibling
// service address — the sibling lives at same-origin /api (src/api.ts).
export const mockEnv = {
  THUNDER_APP_CLIENT_ID: "mock-client",
  THUNDER_APP_ISSUER: "https://mock-idp.test",
  // No THUNDER_APP_JWKS_URL: the browser never validates a token, so src/env.ts
  // does not declare it and mock mode does not carry it either.
  THUNDER_APP_SCOPES:
    "openid profile email group ou merchants:read payment-requests:submit payment-requests:read " +
    "transactions:read transactions:refund payout-accounts:manage balances:read payouts:request payouts:read",
  THUNDER_APP_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
