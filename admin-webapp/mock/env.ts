// The keys the platform actually emits for this component: the `thunder-app`
// OIDC dependency's four browser-facing outputs. src/env.ts throws without
// them, exactly as it would in a pod with a missing binding.
export const mockEnv = {
  THUNDER_APP_CLIENT_ID: "mock-client",
  THUNDER_APP_ISSUER: "https://mock-idp.test",
  THUNDER_APP_SCOPES:
    "openid profile email group ou merchants:read-all merchants:approve merchants:reject " +
    "transactions:read-all payouts:read-all disputes:read-all disputes:resolve",
  THUNDER_APP_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
