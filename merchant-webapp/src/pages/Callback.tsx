import { useEffect } from "react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Stack, CircularProgress, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";

export function CallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    void handleCallback().then(() => {
      navigate("/", { replace: true });
    });
  }, [navigate]);

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: "100vh" }}>
      <CircularProgress />
      <Typography color="text.secondary">Finishing sign-in…</Typography>
    </Stack>
  );
}
