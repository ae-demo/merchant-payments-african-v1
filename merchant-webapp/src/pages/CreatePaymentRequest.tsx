import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, MenuItem, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";

const CURRENCIES = ["KES", "ZAR", "NGN", "GHS", "EGP", "TZS", "UGX", "RWF"];

export function CreatePaymentRequestPage(): JSX.Element {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsedAmount = Number(amount);
  const canSubmit = amount.trim() && parsedAmount > 0 && currency && !submitting;

  async function handleCreate(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: apiError } = await paymentsApi.POST("/me/payment-requests", {
        body: { amount: parsedAmount, currency, description: description || undefined },
      });
      if (apiError || !data) {
        setError(apiError?.message ?? "Could not create the payment request.");
        return;
      }
      navigate("/payment-requests", { replace: true });
    } catch {
      setError("Could not create the payment request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>New payment request</PageTitle.Header>
      </PageTitle>

      <Form.Section>
        <Stack spacing={3} sx={{ maxWidth: 480 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            fullWidth
          >
            {CURRENCIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined" onClick={() => navigate("/payment-requests")}>
              Cancel
            </Button>
            <Button variant="contained" disabled={!canSubmit} onClick={() => void handleCreate()}>
              Create
            </Button>
          </Stack>
        </Stack>
      </Form.Section>
    </PageContent>
  );
}
