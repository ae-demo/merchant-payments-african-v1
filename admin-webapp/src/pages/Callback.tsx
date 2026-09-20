import { useEffect, useState, type ReactElement } from "react";
import { handleCallback } from "../authz/session";
import { APP_NAME } from "../appName";

// The ONE registered redirect URI serves both the redirect leg and the silent
// renew's hidden iframe. `handleCallback()` (signinCallback()) dispatches on
// `request_type` and settles with no value either way — this page renders from
// the promise SETTLING, never from a value. On the redirect leg, landing is
// the app's own origin; the silent leg is inside a hidden iframe nobody sees.
export function CallbackPage(): ReactElement {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void handleCallback()
      .then(() => {
        if (live) window.location.assign(window.location.origin);
      })
      .catch((err) => {
        console.error("authz: sign-in callback failed", err);
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>{failed ? "Sign-in failed. Please try again." : "Signing you in…"}</p>
    </main>
  );
}
