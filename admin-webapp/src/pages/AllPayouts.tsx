import { useEffect, useState, type JSX } from "react";
import { Alert, Box, Chip, CircularProgress, ListingTable, PageContent, PageTitle } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Payout = components["schemas"]["Payout"];

const STATUS_COLOR: Record<Payout["status"], "success" | "error" | "warning"> = {
  completed: "success",
  failed: "error",
  pending: "warning",
};

export function AllPayoutsPage(): JSX.Element {
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  // Payout carries a merchantId but no business name; the Merchant column is
  // filled by one bulk join against the merchant list, keyed on that id —
  // never one request per row.
  const [merchantNames, setMerchantNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      paymentsApi.GET("/payouts", { params: { query: { limit: 100 } } }),
      paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } }),
    ])
      .then(([payoutsRes, merchantsRes]) => {
        if (!live) return;
        if (payoutsRes.error) {
          setError(payoutsRes.error.message ?? "Could not load payouts.");
          return;
        }
        setPayouts(payoutsRes.data?.data ?? []);
        const names: Record<string, string> = {};
        for (const m of merchantsRes.data?.data ?? []) names[m.id] = m.businessName;
        setMerchantNames(names);
      })
      .catch(() => {
        if (live) setError("Could not load payouts.");
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payouts</PageTitle.Header>
        <PageTitle.SubHeader>Every payout across all merchants</PageTitle.SubHeader>
      </PageTitle>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {payouts === null && !error ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {payouts !== null ? (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Merchant</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Requested at</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {payouts.length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState title="No payouts" description="No payout has been requested yet." />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                payouts.map((payout) => (
                  <ListingTable.Row key={payout.id}>
                    <ListingTable.Cell>
                      {(payout.merchantId && merchantNames[payout.merchantId]) ?? payout.merchantId ?? ""}
                    </ListingTable.Cell>
                    <ListingTable.Cell>{payout.amount.toFixed(2)}</ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip label={payout.status} size="small" color={STATUS_COLOR[payout.status]} />
                    </ListingTable.Cell>
                    <ListingTable.Cell>
                      {payout.requestedAt ? new Date(payout.requestedAt).toLocaleString() : ""}
                    </ListingTable.Cell>
                  </ListingTable.Row>
                ))
              )}
            </ListingTable.Body>
          </ListingTable>
        </ListingTable.Container>
      ) : null}
    </PageContent>
  );
}
