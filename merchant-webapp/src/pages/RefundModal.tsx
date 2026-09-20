import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, PageContent, PageTitle, Stack, TextField, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Transaction = components["schemas"]["Transaction"];

export function RefundModalPage(): JSX.Element {
  const navigate = useNavigate();
  const { transactionId = "" } = useParams<{ transactionId: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const { data } = await paymentsApi.GET("/me/transactions", {
        params: { query: { limit: 100 } },
      });
      if (!live) return;
      setTransaction(data?.data.find((t) => t.id === transactionId) ?? null);
    })();
    return () => {
      live = false;
    };
  }, [transactionId]);

  async function handleRefund(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: apiError } = await paymentsApi.POST(
        "/me/transactions/{transactionId}/refund",
        {
          params: { path: { transactionId } },
          body: { reason },
        },
      );
      if (apiError || !data) {
        setError(apiError?.message ?? "Could not issue the refund.");
        return;
      }
      navigate("/transactions", { replace: true });
    } catch {
      setError("Could not issue the refund.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Refund transaction</PageTitle.Header>
      </PageTitle>

      <Stack spacing={3} sx={{ maxWidth: 480 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Typography>Amount: {transaction ? transaction.amount.toFixed(2) : "—"}</Typography>
        <TextField
          label="Reason for refund"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={() => navigate("/transactions")}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={submitting || !reason.trim()}
            onClick={() => void handleRefund()}
          >
            Issue refund
          </Button>
        </Stack>
      </Stack>
    </PageContent>
  );
}
