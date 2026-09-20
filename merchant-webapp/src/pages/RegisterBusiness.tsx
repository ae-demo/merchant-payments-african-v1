import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Form,
  MenuItem,
  PageContent,
  PageTitle,
  Stack,
  TextField,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";

const COUNTRIES = [
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "EG", name: "Egypt" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "RW", name: "Rwanda" },
];

const CURRENCIES = ["KES", "ZAR", "NGN", "GHS", "EGP", "TZS", "UGX", "RWF"];

export function RegisterBusinessPage(): JSX.Element {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = businessName.trim() && country && currency && email.trim() && !submitting;

  async function handleRegister(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: apiError } = await paymentsApi.POST("/merchants", {
        body: { businessName, country, currency, email },
      });
      if (apiError || !data) {
        setError(apiError?.message ?? "Registration failed. Check your details and try again.");
        return;
      }
      navigate("/pending", { replace: true });
    } catch {
      setError("Registration failed. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Register your business</PageTitle.Header>
      </PageTitle>

      <Form.Section>
        <Stack spacing={3} sx={{ maxWidth: 480 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            fullWidth
          >
            {COUNTRIES.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            fullWidth
          >
            {CURRENCIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" disabled={!canSubmit} onClick={() => void handleRegister()}>
              Register
            </Button>
          </Stack>
        </Stack>
      </Form.Section>
    </PageContent>
  );
}
