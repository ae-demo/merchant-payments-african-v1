import { useEffect, useState, type JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  PageContent,
  PageTitle,
  Stack,
  Typography,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Merchant = components["schemas"]["Merchant"];

export function MerchantReviewPage(): JSX.Element {
  const { merchantId = "" } = useParams<{ merchantId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // No GET-by-id operation exists in payments-api for a single merchant: the
  // contract offers only the list and the two approve/reject actions. The row
  // clicked in PendingMerchants carries its own data via navigation state; a
  // direct visit or reload falls back to the list, since a pending merchant is
  // always on the first page of it.
  const stateMerchant = (location.state as { merchant?: Merchant } | null)?.merchant;
  const [merchant, setMerchant] = useState<Merchant | null>(stateMerchant ?? null);
  const [loading, setLoading] = useState(!stateMerchant);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    if (stateMerchant) return;
    let live = true;
    paymentsApi
      .GET("/merchants", { params: { query: { limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError(apiError.message ?? "Could not load this merchant.");
          setLoading(false);
          return;
        }
        const found = (data?.data ?? []).find((m) => m.id === merchantId) ?? null;
        setMerchant(found);
        if (!found) setError("This merchant could not be found.");
        setLoading(false);
      })
      .catch(() => {
        if (live) {
          setError("Could not load this merchant.");
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId]);

  async function decide(action: "approve" | "reject"): Promise<void> {
    setSubmitting(action);
    setError(null);
    try {
      const { error: apiError } = await paymentsApi.POST(
        action === "approve" ? "/merchants/{merchantId}/approve" : "/merchants/{merchantId}/reject",
        { params: { path: { merchantId } } },
      );
      if (apiError) {
        setError(apiError.message ?? `Could not ${action} this merchant.`);
        setSubmitting(null);
        return;
      }
      navigate("/merchants");
    } catch {
      setError(`Could not ${action} this merchant.`);
      setSubmitting(null);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/merchants")}>Back</PageTitle.BackButton>
        <PageTitle.Header>{merchant?.businessName ?? "Merchant review"}</PageTitle.Header>
      </PageTitle>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {merchant ? (
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography>Country: {merchant.country}</Typography>
            <Typography>Currency: {merchant.currency}</Typography>
            <Typography>Email: {merchant.email ?? ""}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Can op="POST /merchants/{merchantId}/reject">
              <Button
                variant="outlined"
                color="error"
                disabled={submitting !== null}
                onClick={() => void decide("reject")}
              >
                Reject
              </Button>
            </Can>
            <Can op="POST /merchants/{merchantId}/approve">
              <Button
                variant="contained"
                disabled={submitting !== null}
                onClick={() => void decide("approve")}
              >
                Approve
              </Button>
            </Can>
          </Stack>
        </Stack>
      ) : null}
    </PageContent>
  );
}
