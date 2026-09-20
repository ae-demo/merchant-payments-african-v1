import payments_api.emailservice;
import payments_api.paymentgateway;
import payments_api.smsservice;

final paymentgateway:Client paymentGatewayClient = check new (serviceUrl = joinBase(paymentGatewayBaseUrl, "/v1"));
final emailservice:Client emailServiceClient = check new (serviceUrl = joinBase(emailServiceBaseUrl, "/v1"));
final smsservice:Client smsServiceClient = check new (serviceUrl = joinBase(smsServiceBaseUrl, "/v1"));

// Joins a `basePath` onto an injected base URL that may or may not end in
// `/`, and may be empty (this milestone's external credentials/addresses can
// be unconfigured — a build-time client still has to construct cleanly).
function joinBase(string base, string basePath) returns string {
    if base.trim() == "" {
        return "http://localhost:8080" + basePath;
    }
    string trimmed = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    return trimmed + basePath;
}
