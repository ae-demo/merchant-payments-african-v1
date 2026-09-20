// Adapted from thunder-authentication's App.example.tsx pattern.
//
// ROUTING STRUCTURE (prescribed, not styling):
//   NoAccess sits ABOVE the shell route and REPLACES it.
//   Forbidden sits INSIDE the shell, at /forbidden.
//   /forbidden is wired once, from ForbiddenWiring, inside the router.
//   Every gated route is wrapped in <RequireOperation op={screen.loads} />,
//     with the operation taken from SCREEN_ROUTES — never retyped here.
//   The public screens (Checkout, PaymentResult) are routed ABOVE the sign-in
//     guard, inside AuthzProvider (so <Can>/useScopes work) but outside
//     AppShell — a visitor with no session has no signed-in chrome to draw.
//   /callback is routed OUTSIDE the provider.
//
// ON TOP of that scope-based structure, this app adds ONE more layer specific
// to its own design: whether a Merchant sees RegisterBusiness, PendingApproval
// or the workspace is a DATA question (the merchant's own approval `status`),
// because the Merchant role holds every one of these operations' scopes
// regardless of that status. src/merchant/MerchantStatusGuards.tsx answers it;
// GUARD_BY_KEY below says which screens it wraps.
import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  AuthzProvider,
  Forbidden,
  NoAccess,
  RequireOperation,
  useAuthz,
  useScopes,
} from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens, hasScopedReach } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { APP_NAME } from "./appName";
import { AppShell } from "./shell/AppShell";
import { PublicShell } from "./shell/PublicShell";
import { CallbackPage } from "./pages/Callback";
import { RegisterBusinessPage } from "./pages/RegisterBusiness";
import { PendingApprovalPage } from "./pages/PendingApproval";
import { DashboardPage } from "./pages/Dashboard";
import { PaymentRequestsPage } from "./pages/PaymentRequests";
import { CreatePaymentRequestPage } from "./pages/CreatePaymentRequest";
import { TransactionHistoryPage } from "./pages/TransactionHistory";
import { RefundModalPage } from "./pages/RefundModal";
import { PayoutAccountSettingsPage } from "./pages/PayoutAccountSettings";
import { PayoutsPage } from "./pages/Payouts";
import { CheckoutPage } from "./pages/Checkout";
import { PaymentResultPage } from "./pages/PaymentResult";
import { RegisterGuard, PendingGuard, WorkspaceGuard } from "./merchant/MerchantStatusGuards";

/** YOUR pages, keyed by the screen keys src/authz/screens.ts declares. */
const PAGE_BY_KEY: Record<string, ReactElement> = {
  register: <RegisterBusinessPage />,
  pending: <PendingApprovalPage />,
  dashboard: <DashboardPage />,
  paymentrequests: <PaymentRequestsPage />,
  createpaymentrequest: <CreatePaymentRequestPage />,
  transactions: <TransactionHistoryPage />,
  refund: <RefundModalPage />,
  payoutaccount: <PayoutAccountSettingsPage />,
  payouts: <PayoutsPage />,
  checkout: <CheckoutPage />,
  paymentresult: <PaymentResultPage />,
};

/** The extra, data-driven merchant-status guard each screen needs, if any. */
const GUARD_BY_KEY: Record<string, "register" | "pending" | "workspace" | undefined> = {
  register: "register",
  pending: "pending",
  dashboard: "workspace",
  paymentrequests: "workspace",
  createpaymentrequest: "workspace",
  transactions: "workspace",
  refund: "workspace",
  payoutaccount: "workspace",
  payouts: "workspace",
};

function withMerchantGuard(key: string, page: ReactElement): ReactElement {
  switch (GUARD_BY_KEY[key]) {
    case "register":
      return <RegisterGuard>{page}</RegisterGuard>;
    case "pending":
      return <PendingGuard>{page}</PendingGuard>;
    case "workspace":
      return <WorkspaceGuard>{page}</WorkspaceGuard>;
    default:
      return page;
  }
}

/** The screens reachable before sign-in — routed above the guard, below. */
const PUBLIC_SCREENS = SCREEN_ROUTES.filter((screen) => screen.public);
const PRIVATE_SCREENS = SCREEN_ROUTES.filter((screen) => !screen.public);

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route element={<PublicShell />}>
          {PUBLIC_SCREENS.map((screen) => (
            <Route
              key={screen.key}
              path={screen.path}
              element={
                <AuthzProvider fallback={<Splash />}>{PAGE_BY_KEY[screen.key]}</AuthzProvider>
              }
            />
          ))}
        </Route>
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

/**
 * Hands src/authz/client.ts the route a refusal goes to. ONCE, from inside the
 * router and above every route.
 */
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

  // NoAccess REPLACES the shell — no rail to wrap it.
  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  // Safe: hasScopedReach just proved at least one scope-gated screen is here.
  // Always "/register" for this design (it is first in SCREEN_ROUTES and every
  // Merchant grant covers it); RegisterGuard immediately redirects on to
  // /pending or /dashboard once the caller's actual merchant status is known.
  const landing = (reachable.find((s) => !s.public && s.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {PRIVATE_SCREENS.map((screen) => {
          const page = withMerchantGuard(screen.key, PAGE_BY_KEY[screen.key]);
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
