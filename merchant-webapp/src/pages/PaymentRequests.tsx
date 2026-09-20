import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  ListingTable,
  PageContent,
  PageTitle,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type PaymentRequest = components["schemas"]["PaymentRequest"];

const STATUS_COLOR: Record<PaymentRequest["status"], "warning" | "success" | "default" | "error"> = {
  pending: "warning",
  paid: "success",
  expired: "default",
  cancelled: "error",
};

export function PaymentRequestsPage(): JSX.Element {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PaymentRequest[] | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const { data } = await paymentsApi.GET("/me/payment-requests", {
        params: { query: { limit: 100 } },
      });
      if (live) setRequests(data?.data ?? []);
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payment requests</PageTitle.Header>
        <PageTitle.Actions>
          <Button variant="contained" onClick={() => navigate("/payment-requests/new")}>
            New payment request
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Currency</ListingTable.Cell>
              <ListingTable.Cell>Description</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
              <ListingTable.Cell>Created</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {requests?.length === 0 ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={5}>
                  <ListingTable.EmptyState
                    title="No payment requests yet"
                    description="Create one to start collecting payments."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              (requests ?? []).map((r) => (
                <ListingTable.Row key={r.id}>
                  <ListingTable.Cell>{r.amount.toFixed(2)}</ListingTable.Cell>
                  <ListingTable.Cell>{r.currency}</ListingTable.Cell>
                  <ListingTable.Cell>{r.description ?? "—"}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={r.status} color={STATUS_COLOR[r.status]} size="small" />
                  </ListingTable.Cell>
                  <ListingTable.Cell>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
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
