import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Grid, PageContent, PageTitle, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";

interface DashboardStats {
  balance: { available: number; currency: string } | null;
  openPaymentRequests: number;
  thisMonthCollected: number;
  currency: string;
}

function StatTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}): JSX.Element {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4">{value}</Typography>
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    balance: null,
    openPaymentRequests: 0,
    thisMonthCollected: 0,
    currency: "",
  });

  useEffect(() => {
    let live = true;
    void (async () => {
      const [balanceRes, requestsRes, transactionsRes] = await Promise.all([
        paymentsApi.GET("/me/balance"),
        paymentsApi.GET("/me/payment-requests", { params: { query: { limit: 100 } } }),
        paymentsApi.GET("/me/transactions", { params: { query: { limit: 100 } } }),
      ]);
      if (!live) return;

      const balance = balanceRes.data ?? null;
      const openPaymentRequests =
        requestsRes.data?.data.filter((r) => r.status === "pending").length ?? 0;

      const now = new Date();
      const thisMonthCollected = (transactionsRes.data?.data ?? [])
        .filter((t) => {
          if (t.status !== "succeeded" || !t.paidAt) return false;
          const paidAt = new Date(t.paidAt);
          return paidAt.getFullYear() === now.getFullYear() && paidAt.getMonth() === now.getMonth();
        })
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        balance,
        openPaymentRequests,
        thisMonthCollected,
        currency: balance?.currency ?? "",
      });
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Dashboard</PageTitle.Header>
        <PageTitle.Actions>
          <Button variant="contained" onClick={() => navigate("/payment-requests/new")}>
            New payment request
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile
            label="Available balance"
            value={stats.balance ? stats.balance.available.toFixed(2) : "0.00"}
            caption="ready to pay out"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile
            label="Open payment requests"
            value={String(stats.openPaymentRequests)}
            caption="awaiting payment"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile
            label="This month"
            value={stats.thisMonthCollected.toFixed(2)}
            caption="collected"
          />
        </Grid>
      </Grid>
    </PageContent>
  );
}
