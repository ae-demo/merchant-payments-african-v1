import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/payments-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

// Same-origin: nginx in this pod reverse-proxies /api to payments-api through
// the API gateway (its design declares exposesAPI.auth). No authorization rule
// belongs here — authorizationHeader() attaches the bearer and
// classifyResponse() applies the 401 rule; both live in src/authz/client.ts.
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const paymentsApi = createClient<paths>({ baseUrl: "/api" });
paymentsApi.use(authMiddleware);
