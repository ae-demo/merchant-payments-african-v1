import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, ListingTable, PageContent, PageTitle, SearchBar } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Transaction = components["schemas"]["Transaction"];

const STATUS_COLOR: Record<Transaction["status"], "warning" | "success" | "error"> = {
  pending: "warning",
  succeeded: "success",
  failed: "error",
};

export function TransactionHistoryPage(): JSX.Element {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let live = true;
    void (async () => {
      const { data } = await paymentsApi.GET("/me/transactions", {
        params: { query: { limit: 100 } },
      });
      if (live) setTransactions(data?.data ?? []);
    })();
    return () => {
      live = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return transactions;
    return transactions.filter(
      (t) =>
        t.method.toLowerCase().includes(needle) ||
        t.status.toLowerCase().includes(needle) ||
        t.amount.toFixed(2).includes(needle),
    );
  }, [transactions, query]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Transactions</PageTitle.Header>
      </PageTitle>

      <SearchBar
        placeholder="Search transactions"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 3, maxWidth: 360 }}
      />

      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Method</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
              <ListingTable.Cell>Paid at</ListingTable.Cell>
              <ListingTable.Cell />
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {filtered.length === 0 ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={5}>
                  <ListingTable.EmptyState
                    title="No transactions yet"
                    description="Payments your customers make will show up here."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              filtered.map((t) => (
                <ListingTable.Row key={t.id}>
                  <ListingTable.Cell>{t.amount.toFixed(2)}</ListingTable.Cell>
                  <ListingTable.Cell>{t.method}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={t.status} color={STATUS_COLOR[t.status]} size="small" />
                  </ListingTable.Cell>
                  <ListingTable.Cell>
                    {t.paidAt ? new Date(t.paidAt).toLocaleDateString() : "—"}
                  </ListingTable.Cell>
                  <ListingTable.Cell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={t.status !== "succeeded"}
                      onClick={() => navigate(`/transactions/${t.id}/refund`)}
                    >
                      Refund
                    </Button>
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>
    </PageContent>
  );
}
