// ROUTING STRUCTURE is prescribed by thunder-authentication (App.example.tsx):
//   - NoAccess sits ABOVE the shell route and REPLACES it.
//   - Forbidden sits INSIDE the shell, at /forbidden.
//   - /forbidden is wired into authz/client once, from the router root.
//   - Every gated route is wrapped in <RequireOperation op={screen.loads}>.
//   - /callback is routed OUTSIDE the provider.
// This app declares no public screen (sign-in owns the whole app; the only
// flow, F1 Platform oversight, carries a `role` line), so nothing is routed
// above the sign-in guard.

import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthzProvider, Forbidden, NoAccess, RequireOperation, useAuthz, useScopes } from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens, hasScopedReach } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { APP_NAME } from "./appName";
import { CallbackPage } from "./pages/Callback";
import { PendingMerchantsPage } from "./pages/PendingMerchants";
import { MerchantReviewPage } from "./pages/MerchantReview";
import { AllTransactionsPage } from "./pages/AllTransactions";
import { AllPayoutsPage } from "./pages/AllPayouts";
import { DisputesPage } from "./pages/Disputes";
import { DisputeDetailPage } from "./pages/DisputeDetail";

const PAGE_BY_KEY: Record<string, ReactElement> = {
  "pending-merchants": <PendingMerchantsPage />,
  "merchant-review": <MerchantReviewPage />,
  "all-transactions": <AllTransactionsPage />,
  "all-payouts": <AllPayoutsPage />,
  disputes: <DisputesPage />,
  "dispute-detail": <DisputeDetailPage />,
};

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Checking your session…</p>
    </main>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // The load-time guard. Only a MISSING session starts a sign-in.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  const landing = (reachable.find((s) => !s.public && s.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = PAGE_BY_KEY[screen.key];
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          return (
            <Route
              key={screen.key}
              element={<RequireOperation op={screen.loads} screen={screen.label} />}
            >
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
