// The unauthenticated shell for Checkout/PaymentResult: a Customer following a
// payment link has no session and no sidebar to show — the wireframe draws
// only `navbar "Merchant Payments"` on both screens, no `sidebar` line.
import type { JSX } from "react";
import { Outlet } from "react-router-dom";
import { AppBar, Box, Container, Toolbar, Typography } from "@wso2/oxygen-ui";
import { APP_NAME } from "../appName";

export function PublicShell(): JSX.Element {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <Typography variant="h6">{APP_NAME}</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
