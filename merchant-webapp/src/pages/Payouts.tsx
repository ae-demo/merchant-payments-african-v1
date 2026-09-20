import { useEffect, useState, type JSX } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  ListingTable,
  PageContent,
  PageTitle,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Payout = components["schemas"]["Payout"];

const STATUS_COLOR: Record<Payout["status"], "warning" | "success" | "error"> = {
  pending: "warning",
  completed: "success",
  failed: "error",
};

export function PayoutsPage(): JSX.Element {
  const [balance, setBalance] = useState<{ available: number; currency: string } | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let live = true;
    void (async () => {
      const [balanceRes, payoutsRes] = await Promise.all([
        paymentsApi.GET("/me/balance"),
        paymentsApi.GET("/me/payouts", { params: { query: { limit: 100 } } }),
      ]);
      if (!live) return;
      setBalance(balanceRes.data ?? null);
      setPayouts(payoutsRes.data?.data ?? []);
    })();
    return () => {
      live = false;
    };
  }, [refreshKey]);

  function openDialog(): void {
    setAmount("");
    setError(null);
    setDialogOpen(true);
  }

  async function handleRequest(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: apiError } = await paymentsApi.POST("/me/payouts", {
        body: { amount: Number(amount) },
      });
      if (apiError || !data) {
        setError(apiError?.message ?? "The amount exceeds your available balance.");
        return;
      }
      setDialogOpen(false);
      setRefreshKey((k) => k + 1);
    } catch {
      setError("Could not request the payout.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payouts</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /me/payouts">
            <Button variant="contained" onClick={openDialog}>
              Request payout
            </Button>
          </Can>
        </PageTitle.Actions>
      </PageTitle>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Available balance
              </Typography>
              <Typography variant="h4">{balance ? balance.available.toFixed(2) : "0.00"}</Typography>
              <Typography variant="caption" color="text.secondary">
                ready to pay out
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
              <ListingTable.Cell>Requested at</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {payouts?.length === 0 ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <ListingTable.EmptyState
                    title="No payouts yet"
                    description="Request a payout of your available balance."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              (payouts ?? []).map((p) => (
                <ListingTable.Row key={p.id}>
                  <ListingTable.Cell>{p.amount.toFixed(2)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={p.status} color={STATUS_COLOR[p.status]} size="small" />
                  </ListingTable.Cell>
                  <ListingTable.Cell>
                    {p.requestedAt ? new Date(p.requestedAt).toLocaleDateString() : "—"}
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Request payout</DialogTitle>
        <DialogContent>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          <TextField
            autoFocus
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={submitting || !amount || Number(amount) <= 0}
            onClick={() => void handleRequest()}
          >
            Request
          </Button>
        </DialogActions>
      </Dialog>
    </PageContent>
  );
}
