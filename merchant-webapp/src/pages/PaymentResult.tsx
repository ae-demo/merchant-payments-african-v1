import type { JSX } from "react";
import { useLocation } from "react-router-dom";
import { Chip, Stack, Typography } from "@wso2/oxygen-ui";

interface ResultState {
  status?: "pending" | "succeeded" | "failed";
  method?: "mobile-money" | "card";
}

export function PaymentResultPage(): JSX.Element {
  const { state } = useLocation();
  const { status } = (state ?? {}) as ResultState;

  if (status === "failed") {
    return (
      <Stack spacing={2}>
        <Typography variant="h5">Payment failed</Typography>
        <Chip label="Failed" color="error" sx={{ alignSelf: "flex-start" }} />
        <Typography>The charge could not be completed. You can try again from the payment link.</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Payment successful</Typography>
      <Chip label="Paid" color="success" sx={{ alignSelf: "flex-start" }} />
      <Typography>A confirmation has been sent to your phone/email.</Typography>
    </Stack>
  );
}
