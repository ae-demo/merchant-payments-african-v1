import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, ListingTable, PageContent, PageTitle } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Dispute = components["schemas"]["Dispute"];

const STATUS_COLOR: Record<Dispute["status"], "warning" | "success" | "error"> = {
  open: "warning",
  resolved: "success",
  rejected: "error",
};

export function DisputesPage(): JSX.Element {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    paymentsApi
      .GET("/disputes", { params: { query: { limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError(apiError.message ?? "Could not load disputes.");
          return;
        }
        setDisputes(data?.data ?? []);
      })
      .catch(() => {
        if (live) setError("Could not load disputes.");
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Disputes</PageTitle.Header>
        <PageTitle.SubHeader>Disputed or failed transactions</PageTitle.SubHeader>
      </PageTitle>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {disputes === null && !error ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {disputes !== null ? (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Transaction</ListingTable.Cell>
                <ListingTable.Cell>Raised by</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell align="right" />
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {disputes.length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={4}>
                    <ListingTable.EmptyState title="No disputes" description="Nothing has been escalated." />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                disputes.map((dispute) => (
                  <ListingTable.Row
                    key={dispute.id}
                    clickable
                    onClick={() => navigate(`/disputes/${dispute.id}`)}
                  >
                    <ListingTable.Cell>{dispute.transactionId}</ListingTable.Cell>
                    <ListingTable.Cell>{dispute.raisedBy ?? ""}</ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip label={dispute.status} size="small" color={STATUS_COLOR[dispute.status]} />
                    </ListingTable.Cell>
                    <ListingTable.Cell align="right">
                      <ListingTable.RowActions visibility="hover">Review</ListingTable.RowActions>
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
