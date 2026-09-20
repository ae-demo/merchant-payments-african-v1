// The one extra gate this app needs beyond scope-based reachability: whether a
// signed-in Merchant has registered a business yet, and whether the platform
// has approved it. The Merchant role holds every scope this app needs
// regardless of that status (security.json grants them all up front), so the
// operation-scope gate in src/authz/screens.ts cannot tell RegisterBusiness,
// PendingApproval and the workspace apart — that is exactly what this hook
// answers, from the data `GET /me/merchant` returns.
import { useEffect, useState } from "react";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

export type Merchant = components["schemas"]["Merchant"];

export type MerchantStatus =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "error" }
  | { kind: "found"; merchant: Merchant };

export function useMerchantStatus(refreshKey = 0): MerchantStatus {
  const [status, setStatus] = useState<MerchantStatus>({ kind: "loading" });

  useEffect(() => {
    let live = true;
    setStatus({ kind: "loading" });
    void (async () => {
      try {
        const { data, response } = await paymentsApi.GET("/me/merchant");
        if (!live) return;
        if (response.status === 404) {
          setStatus({ kind: "none" });
        } else if (data) {
          setStatus({ kind: "found", merchant: data });
        } else {
          setStatus({ kind: "error" });
        }
      } catch {
        if (live) setStatus({ kind: "error" });
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return status;
}
