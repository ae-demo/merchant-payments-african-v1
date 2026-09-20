import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Dispute = components["schemas"]["Dispute"];

export function DisputeDetailPage(): JSX.Element {
  const { disputeId = "" } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState<"resolved" | "rejected" | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    paymentsApi
      .GET("/disputes/{disputeId}", { params: { path: { disputeId } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError(apiError.message ?? "Could not load this dispute.");
          setLoading(false);
          return;
        }
        setDispute(data ?? null);
        setNotes(data?.resolutionNotes ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (live) {
          setError("Could not load this dispute.");
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [disputeId]);

  async function decide(status: "resolved" | "rejected"): Promise<void> {
    setSubmitting(status);
    setError(null);
    try {
      const { error: apiError } = await paymentsApi.PATCH("/disputes/{disputeId}", {
        params: { path: { disputeId } },
        body: { status, resolutionNotes: notes || undefined },
      });
      if (apiError) {
        setError(apiError.message ?? "Could not update this dispute.");
        setSubmitting(null);
        return;
      }
      navigate("/disputes");
    } catch {
      setError("Could not update this dispute.");
      setSubmitting(null);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/disputes")}>Back</PageTitle.BackButton>
        <PageTitle.Header>
          {dispute ? `Dispute on ${dispute.transactionId}` : "Dispute"}
        </PageTitle.Header>
      </PageTitle>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {dispute ? (
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography>Raised by: {dispute.raisedBy ?? ""}</Typography>
            <Typography>Status: {dispute.status}</Typography>
          </Stack>

          <TextField
            label="Resolution notes"
            multiline
            minRows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={dispute.status !== "open"}
            fullWidth
          />

          {dispute.status === "open" ? (
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Can op="PATCH /disputes/{disputeId}">
                <Button
                  variant="outlined"
                  color="error"
                  disabled={submitting !== null}
                  onClick={() => void decide("rejected")}
                >
                  Reject dispute
                </Button>
              </Can>
              <Can op="PATCH /disputes/{disputeId}">
                <Button variant="contained" disabled={submitting !== null} onClick={() => void decide("resolved")}>
                  Resolve dispute
                </Button>
              </Can>
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </PageContent>
  );
}
