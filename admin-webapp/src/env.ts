// Typed read of window._env_, the platform's runtime config. Declares only the
// keys this app actually reads: the `thunder-app` OIDC dependency's four
// browser-facing outputs (not `jwks_url` — the browser never validates a
// token, the API gateway does).
type Env = {
  THUNDER_APP_CLIENT_ID: string;
  THUNDER_APP_ISSUER: string;
  THUNDER_APP_SCOPES: string;
  THUNDER_APP_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
