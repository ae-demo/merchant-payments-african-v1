// Exercises the copied `gateway_assertion.bal` asset end-to-end through the
// real HTTP service (bal test starts `ep0` as part of module init), against
// a throwaway RSA keypair — never a real gateway or IdP. Run with
// GATEWAY_ASSERTION_CERTIFICATE/_ISSUER/_HEADER exported from
// tests/resources/test-cert.pem, or the interceptor falls back to its
// unverified mode and every case here passes for the wrong reason.
//
// `/me/payment-requests` is used as the protected probe: an accepted
// assertion still gets a 400 for a negative `amount` — proving the request
// reached business logic — while a refused assertion never gets past the
// interceptor, so neither case touches the database.

import ballerina/crypto;
import ballerina/http;
import ballerina/jwt;
import ballerina/lang.regexp;
import ballerina/test;

const string TEST_ISSUER = "test-gateway";
const string TEST_ASSERTION_HEADER = "x-jwt-assertion";

final http:Client gatewayTestClient = check new ("http://localhost:9090");

function signTestToken(string keyFile) returns string|error {
    crypto:PrivateKey privateKey = check crypto:decodeRsaPrivateKeyFromKeyFile(keyFile);
    return jwt:issue({
        issuer: TEST_ISSUER,
        username: "merchant-owner-1",
        expTime: 300,
        customClaims: {
            "username": "test-merchant",
            "scope": "payment-requests:submit",
            "ouHandle": "org-1"
        },
        signatureConfig: {
            algorithm: jwt:RS256,
            config: privateKey
        }
    });
}

// Flips one character of the signed payload segment so the signature no
// longer matches — "the payload was edited after signing", never a resign.
function tamperPayloadSegment(string token) returns string {
    string[] parts = regexp:split(re `\.`, token);
    string payload = parts[1];
    string flipped = payload.endsWith("A") ? "B" : "A";
    string mutatedPayload = payload.substring(0, payload.length() - 1) + flipped;
    return parts[0] + "." + mutatedPayload + "." + parts[2];
}

function postPaymentRequestWithAssertion(string? token, decimal amount) returns http:Response|error {
    http:Request request = new;
    if token is string {
        request.setHeader(TEST_ASSERTION_HEADER, token);
    }
    request.setJsonPayload({amount, currency: "KES"});
    return gatewayTestClient->post("/me/payment-requests", request);
}

@test:Config {}
function testPublicOperationServedWithNoAssertionAtAll() returns error? {
    http:Response response = check gatewayTestClient->get("/health");
    test:assertEquals(response.statusCode, 200);
}

@test:Config {}
function testValidAssertionIsAcceptedAndReachesBusinessLogic() returns error? {
    string token = check signTestToken("tests/resources/test-private-key.pem");
    // amount -5 fails validation in the handler itself — proof the request
    // got past the interceptor rather than proof of a healthy database.
    http:Response response = check postPaymentRequestWithAssertion(token, -5d);
    test:assertEquals(response.statusCode, 400);
}

@test:Config {}
function testAssertionSignedByADifferentKeyIsUnauthorized() returns error? {
    string token = check signTestToken("tests/resources/wrong-private-key.pem");
    http:Response response = check postPaymentRequestWithAssertion(token, 10d);
    test:assertEquals(response.statusCode, 401);
}

@test:Config {}
function testAssertionTamperedAfterSigningIsUnauthorized() returns error? {
    string token = check signTestToken("tests/resources/test-private-key.pem");
    string tampered = tamperPayloadSegment(token);
    http:Response response = check postPaymentRequestWithAssertion(tampered, 10d);
    test:assertEquals(response.statusCode, 401);
}

@test:Config {}
function testMissingAssertionOnAProtectedOperationIsUnauthorized() returns error? {
    http:Response response = check postPaymentRequestWithAssertion((), 10d);
    test:assertEquals(response.statusCode, 401);
}
