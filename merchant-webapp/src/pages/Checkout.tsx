import { useEffect, useState, type JSX, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type PaymentRequest = components["schemas"]["PaymentRequest"];

export function CheckoutPage(): JSX.Element {
  const navigate = useNavigate();
  const { requestId = "" } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [method, setMethod] = useState<"mobile-money" | "card">("mobile-money");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const { data, response } = await paymentsApi.GET("/payment-requests/{requestId}", {
        params: { path: { requestId } },
      });
      if (!live) return;
      if (response.status === 404 || !data) {
        setNotFound(true);
        return;
      }
      setRequest(data);
    })();
    return () => {
      live = false;
    };
  }, [requestId]);

  function handleTabChange(_event: SyntheticEvent, value: "mobile-money" | "card"): void {
    setMethod(value);
  }

  async function handlePay(): Promise<void> {
    setError(null);
    setPaying(true);
    try {
      const { data, error: apiError } = await paymentsApi.POST("/payment-requests/{requestId}/pay", {
        params: { path: { requestId } },
        body: { method, customerContact: contact },
      });
      if (apiError || !data) {
        setError(apiError?.message ?? "Payment failed. Check your details and try again.");
        return;
      }
      navigate(`/pay/${requestId}/result`, {
        replace: true,
        state: { status: data.status, method: data.method },
      });
    } catch {
      setError("Payment failed. Check your details and try again.");
    } finally {
      setPaying(false);
    }
  }

  if (notFound) {
    return <Alert severity="error">This payment link is no longer valid.</Alert>;
  }

  if (!request) {
    return <Typography color="text.secondary">Loading…</Typography>;
  }

  if (request.status !== "pending") {
    return <Alert severity="info">This payment request is {request.status}.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Pay {request.description ?? `Order ${request.id}`}</Typography>
      <Typography>
        Amount due: {request.amount.toFixed(2)} {request.currency}
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Tabs value={method} onChange={handleTabChange}>
        <Tab label="Mobile money" value="mobile-money" />
        <Tab label="Card" value="card" />
      </Tabs>

      <TextField
        label={method === "card" ? "Card details" : "Phone number"}
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        fullWidth
      />

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" disabled={paying || !contact.trim()} onClick={() => void handlePay()}>
          Pay now
        </Button>
      </Stack>
    </Stack>
  );
}
