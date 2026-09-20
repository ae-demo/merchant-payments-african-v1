import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";

export function PayoutAccountSettingsPage(): JSX.Element {
  const navigate = useNavigate();
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const { data } = await paymentsApi.GET("/me/payout-account");
      if (!live || !data) return;
      setBankName(data.bankName);
      setAccountNumber(data.accountNumber);
      setAccountHolderName(data.accountHolderName);
    })();
    return () => {
      live = false;
    };
  }, []);

  const canSubmit =
    bankName.trim() && accountNumber.trim() && accountHolderName.trim() && !submitting;

  async function handleSave(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: apiError } = await paymentsApi.PUT("/me/payout-account", {
        body: { bankName, accountNumber, accountHolderName },
      });
      if (apiError || !data) {
        setError(apiError?.message ?? "Could not save the payout account.");
        return;
      }
      navigate("/dashboard");
    } catch {
      setError("Could not save the payout account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payout bank account</PageTitle.Header>
      </PageTitle>

      <Form.Section>
        <Stack spacing={3} sx={{ maxWidth: 480 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Bank name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            fullWidth
          />
          <TextField
            label="Account holder name"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            fullWidth
          />
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" disabled={!canSubmit} onClick={() => void handleSave()}>
              Save
            </Button>
          </Stack>
        </Stack>
      </Form.Section>
    </PageContent>
  );
}
