import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  ListingTable,
  PageContent,
  PageTitle,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Merchant = components["schemas"]["Merchant"];

export function PendingMerchantsPage(): JSX.Element {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    paymentsApi
      .GET("/merchants", { params: { query: { status: "pending", limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError(apiError.message ?? "Could not load pending merchants.");
          return;
        }
        setMerchants(data?.data ?? []);
      })
      .catch(() => {
        if (live) setError("Could not load pending merchants.");
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Pending merchants</PageTitle.Header>
        <PageTitle.SubHeader>Merchant registrations awaiting review</PageTitle.SubHeader>
      </PageTitle>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {merchants === null && !error ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {merchants !== null ? (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Business</ListingTable.Cell>
                <ListingTable.Cell>Country</ListingTable.Cell>
                <ListingTable.Cell>Currency</ListingTable.Cell>
                <ListingTable.Cell>Email</ListingTable.Cell>
                <ListingTable.Cell align="right" />
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {merchants.length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={5}>
                    <ListingTable.EmptyState
                      title="No pending merchants"
                      description="Every merchant registration has been reviewed."
                    />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                merchants.map((merchant) => (
                  <ListingTable.Row
                    key={merchant.id}
                    clickable
                    onClick={() => navigate(`/merchants/${merchant.id}`, { state: { merchant } })}
                  >
                    <ListingTable.Cell>{merchant.businessName}</ListingTable.Cell>
                    <ListingTable.Cell>{merchant.country}</ListingTable.Cell>
                    <ListingTable.Cell>{merchant.currency}</ListingTable.Cell>
                    <ListingTable.Cell>{merchant.email ?? ""}</ListingTable.Cell>
                    <ListingTable.Cell align="right">
                      <ListingTable.RowActions visibility="hover">
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/merchants/${merchant.id}`, { state: { merchant } });
                          }}
                        >
                          Review
                        </Button>
                      </ListingTable.RowActions>
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
