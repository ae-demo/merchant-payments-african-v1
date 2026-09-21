import payments_api.emailservice;
import payments_api.paymentgateway;
import payments_api.smsservice;

import ballerina/http;

// These external mock services are plain HTTP/1.1 backends; forcing HTTP/2
// (the client's default) against a server that doesn't negotiate it can fail
// the whole connection rather than transparently downgrading, which shows up
// indistinguishably from a business decline/error at the call site.
final paymentgateway:Client paymentGatewayClient = check new (
    {httpVersion: http:HTTP_1_1},
    serviceRoot(paymentGatewayBaseUrl, "http://localhost:8080/v1")
);
final emailservice:Client emailServiceClient = check new (
    {httpVersion: http:HTTP_1_1},
    serviceRoot(emailServiceBaseUrl, "http://localhost:8080/v1")
);
final smsservice:Client smsServiceClient = check new (
    {httpVersion: http:HTTP_1_1},
    serviceRoot(smsServiceBaseUrl, "http://localhost:8080/v1")
);

// The service URL for a generated client: the platform-injected base URL as
// given, or the contract's own default server when the environment has not
// wired one.
//
// The injected value IS the API root — the platform's route for
// `<dep>/...` already resolves to the service's `/v1` prefix, and the
// generated clients' resource paths are bare ("/payments", "/emails",
// "/sms"). Appending "/v1" here produced "/v1/v1/payments" and 404'd every
// outbound call, which `chargeCustomer` then mapped to a "failed"
// transaction — indistinguishable from a decline at the call site, and
// misread as one by two validation cycles.
//
// The fallback keeps "/v1" because it is part of the OpenAPI contract's
// default server (`http://localhost:8080/v1`), i.e. a root, not a join.
function serviceRoot(string base, string fallback) returns string {
    string trimmed = base.trim();
    if trimmed == "" {
        return fallback;
    }
    return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
}
