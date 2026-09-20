// Three route-level guards, all reading the same useMerchantStatus() hook,
// that keep an unapproved Merchant off the workspace and a registered Merchant
// off the registration form — the data-driven half of "an unapproved merchant
// sees PendingApproval, not the workspace" (the scope-driven half is
// src/authz/screens.ts + RequireOperation, which cannot see approval status
// at all since the Merchant role holds every scope regardless of it).
import type { ReactElement, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress, Stack, Typography } from "@wso2/oxygen-ui";
import { useMerchantStatus } from "./useMerchantStatus";

function Loading(): ReactElement {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "40vh" }} spacing={2}>
      <CircularProgress />
      <Typography color="text.secondary">Loading your business…</Typography>
    </Stack>
  );
}

function ErrorState(): ReactElement {
  return (
    <Box sx={{ p: 4 }}>
      <Typography color="error">
        We could not reach payments-api to check your business status. Reload to try again.
      </Typography>
    </Box>
  );
}

/** Wraps /register: only a caller with NO merchant record yet may see the form. */
export function RegisterGuard({ children }: { children: ReactNode }): ReactElement {
  const status = useMerchantStatus();
  if (status.kind === "loading") return <Loading />;
  if (status.kind === "error") return <ErrorState />;
  if (status.kind === "found") {
    return <Navigate to={status.merchant.status === "approved" ? "/dashboard" : "/pending"} replace />;
  }
  return <>{children}</>;
}

/** Wraps /pending: only a caller with a not-yet-approved merchant may see it. */
export function PendingGuard({ children }: { children: ReactNode }): ReactElement {
  const status = useMerchantStatus();
  if (status.kind === "loading") return <Loading />;
  if (status.kind === "error") return <ErrorState />;
  if (status.kind === "none") return <Navigate to="/register" replace />;
  if (status.kind === "found" && status.merchant.status === "approved") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

/** Wraps every workspace route (Dashboard, PaymentRequests, …): only an
 * APPROVED merchant may see them — this is the guard the issue's acceptance
 * criterion names. */
export function WorkspaceGuard({ children }: { children: ReactNode }): ReactElement {
  const status = useMerchantStatus();
  if (status.kind === "loading") return <Loading />;
  if (status.kind === "error") return <ErrorState />;
  if (status.kind === "none") return <Navigate to="/register" replace />;
  if (status.kind === "found" && status.merchant.status !== "approved") {
    return <Navigate to="/pending" replace />;
  }
  return <>{children}</>;
}
