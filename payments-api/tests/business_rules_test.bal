import ballerina/test;

// Balance-sufficiency on a payout request (acceptance: "payouts (with
// balance-sufficiency check)").

@test:Config {}
function testPayoutAllowedWithinBalance() {
    test:assertTrue(isPayoutAllowed(50d, 100d));
}

@test:Config {}
function testPayoutAllowedExactBalance() {
    test:assertTrue(isPayoutAllowed(100d, 100d));
}

@test:Config {}
function testPayoutRejectedOverBalance() {
    test:assertFalse(isPayoutAllowed(150d, 100d));
}

@test:Config {}
function testPayoutRejectedNonPositiveAmount() {
    test:assertFalse(isPayoutAllowed(0d, 100d));
    test:assertFalse(isPayoutAllowed(-10d, 100d));
}

// Refund amount resolution — domain-model.md's refund invariant: default to
// the remaining refundable balance, never exceed it.

@test:Config {}
function testRefundDefaultsToFullRemainingAmount() returns error? {
    decimal resolved = check resolveRefundAmount((), 100d, 0d);
    test:assertEquals(resolved, 100d);
}

@test:Config {}
function testRefundDefaultsToWhatIsLeftAfterAPriorPartialRefund() returns error? {
    decimal resolved = check resolveRefundAmount((), 100d, 40d);
    test:assertEquals(resolved, 60d);
}

@test:Config {}
function testPartialRefundWithinRemainingIsAllowed() returns error? {
    decimal resolved = check resolveRefundAmount(30d, 100d, 40d);
    test:assertEquals(resolved, 30d);
}

@test:Config {}
function testRefundBeyondRemainingIsRejected() {
    decimal|error resolved = resolveRefundAmount(70d, 100d, 40d);
    test:assertTrue(resolved is error);
}

@test:Config {}
function testZeroOrNegativeRefundIsRejected() {
    test:assertTrue(resolveRefundAmount(0d, 100d, 0d) is error);
    test:assertTrue(resolveRefundAmount(-5d, 100d, 0d) is error);
}

// Transaction/payout status transitions — the payment-gateway's vocabulary
// mapped onto this component's own (domain-model.md's status enums).

@test:Config {}
function testGatewayAuthorizedMapsToSucceeded() {
    test:assertEquals(fromGatewayPaymentStatus("authorized"), "succeeded");
}

@test:Config {}
function testGatewayDeclinedMapsToFailed() {
    test:assertEquals(fromGatewayPaymentStatus("declined"), "failed");
}

@test:Config {}
function testGatewayPendingPaymentStaysPending() {
    test:assertEquals(fromGatewayPaymentStatus("pending"), "pending");
}

@test:Config {}
function testGatewayPaidPayoutMapsToCompleted() {
    test:assertEquals(fromGatewayPayoutStatus("paid"), "completed");
}

@test:Config {}
function testGatewayFailedPayoutMapsToFailed() {
    test:assertEquals(fromGatewayPayoutStatus("failed"), "failed");
}

@test:Config {}
function testGatewayPendingPayoutStaysPending() {
    test:assertEquals(fromGatewayPayoutStatus("pending"), "pending");
}

@test:Config {}
function testServiceRootUsesTheInjectedBaseVerbatim() {
    // The platform injects the API ROOT. The generated client's resource
    // paths are already "/payments", "/emails", "/sms" — appending "/v1"
    // produced "/v1/v1/payments" and 404'd every outbound call.
    test:assertEquals(
            serviceRoot("https://host.example/internal-payments-api", "http://localhost:8080/v1"),
            "https://host.example/internal-payments-api");
}

@test:Config {}
function testServiceRootTrimsOneTrailingSlash() {
    test:assertEquals(
            serviceRoot("https://host.example/internal-payments-api/", "http://localhost:8080/v1"),
            "https://host.example/internal-payments-api");
}

@test:Config {}
function testServiceRootFallsBackWhenUnconfigured() {
    // An unset env var must yield the contract's own default server, which
    // DOES carry /v1 — that prefix belongs in the serviceUrl, not in a join.
    test:assertEquals(serviceRoot("", "http://localhost:8080/v1"), "http://localhost:8080/v1");
    test:assertEquals(serviceRoot("   ", "http://localhost:8080/v1"), "http://localhost:8080/v1");
}

@test:Config {}
function testFailedPayoutDoesNotDebitTheBalance() {
    // The money never left the platform, so it must stay on the balance.
    test:assertFalse(shouldDebitForPayout("failed"));
}

@test:Config {}
function testCompletedPayoutDebitsTheBalance() {
    test:assertTrue(shouldDebitForPayout("completed"));
}

@test:Config {}
function testPendingPayoutDebitsTheBalance() {
    // A pending payout is in flight and the funds are committed; releasing
    // them would let the same balance be paid out twice.
    test:assertTrue(shouldDebitForPayout("pending"));
}
