import { useEffect, useMemo, useState, type JSX } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  ListingTable,
  PageContent,
  PageTitle,
  SearchBar,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Transaction = components["schemas"]["Transaction"];

const STATUS_COLOR: Record<Transaction["status"], "success" | "error" | "warning"> = {
  succeeded: "success",
  failed: "error",
  pending: "warning",
};

// NOTE — design gap: the wireframe draws a "Merchant" column, but neither
// Transaction nor PaymentRequest (its only reachable relation) carries a
// merchantId or business name anywhere in payments-api's openapi.yaml, and no
// other list operation joins a transaction back to a merchant. There is no
// request this page can make to fill that column, so it is omitted here; see
// the coding report for the same note back to the design.
export function AllTransactionsPage(): JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let live = true;
    paymentsApi
      .GET("/transactions", { params: { query: { limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError(apiError.message ?? "Could not load transactions.");
          return;
        }
        setTransactions(data?.data ?? []);
      })
      .catch(() => {
        if (live) setError("Could not load transactions.");
      });
    return () => {
      live = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => (t.customerContact ?? "").toLowerCase().includes(q));
  }, [transactions, query]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Transactions</PageTitle.Header>
        <PageTitle.SubHeader>Every transaction across all merchants</PageTitle.SubHeader>
      </PageTitle>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box sx={{ mb: 3 }}>
        <SearchBar
          placeholder="Search by customer"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
        />
      </Box>

      {transactions === null && !error ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {transactions !== null ? (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Method</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Paid at</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {filtered.length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState
                      title="No transactions"
                      description="No transaction matches this view."
                    />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                filtered.map((txn) => (
                  <ListingTable.Row key={txn.id}>
                    <ListingTable.Cell>
                      {txn.amount.toFixed(2)} {txn.currency}
                    </ListingTable.Cell>
                    <ListingTable.Cell>{txn.method}</ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip label={txn.status} size="small" color={STATUS_COLOR[txn.status]} />
                    </ListingTable.Cell>
                    <ListingTable.Cell>
                      {txn.paidAt ? new Date(txn.paidAt).toLocaleString() : ""}
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
