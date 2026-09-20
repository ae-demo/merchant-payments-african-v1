import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/payments-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

// Same-origin `/api`: nginx in this pod reverse-proxies to the payments-api
// sibling, through the API gateway (payments-api declares `exposesAPI.auth`).
// No authorization logic lives here — the bearer and the 401 rule both come
// from src/authz/client.ts.
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
