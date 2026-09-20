// Credentials for the three test logins (roles-gate ticket). Read from the
// environment only — never hardcode a password in a spec.
function must(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`missing required env var ${name}`);
  }
  return value;
}

export interface Credentials {
  username: string;
  password: string;
}

export function merchantCreds(): Credentials {
  return { username: must("AEP_E2E_MERCHANT_USERNAME"), password: must("AEP_E2E_MERCHANT_PASSWORD") };
}

export function merchant2Creds(): Credentials {
  return { username: must("AEP_E2E_MERCHANT2_USERNAME"), password: must("AEP_E2E_MERCHANT2_PASSWORD") };
}

export function adminCreds(): Credentials {
  return { username: must("AEP_E2E_ADMIN_USERNAME"), password: must("AEP_E2E_ADMIN_PASSWORD") };
}
