import payments_api.paymentgateway;

import ballerina/log;

type ChargeOutcome record {|
    // "succeeded" | "failed" | "pending" — this component's own Transaction status vocabulary
    string status;
    string gatewayPaymentId;
|};

type PayoutOutcome record {|
    // "completed" | "failed" | "pending" — this component's own Payout status vocabulary
    string status;
    string gatewayPayoutId;
|};

// Charges a customer through the payment-gateway external resource for a
// payment request. `method` is this contract's own vocabulary
// (mobile-money|card); the gateway's is a channel (mobile|web).
function chargeCustomer(string merchantId, decimal amount, string currency, string method, string reference) returns ChargeOutcome {
    paymentgateway:Channel channel = method == "mobile-money" ? "mobile" : "web";
    paymentgateway:CreatePaymentRequest req = {
        merchantId,
        amount: toGatewayAmount(amount),
        currency,
        channel,
        reference
    };
    paymentgateway:Payment|error result = paymentGatewayClient->/payments.post(req);
    if result is error {
        // Indistinguishable from a genuine decline once mapped to "failed" —
        // this warning, with the underlying error, is the only place that
        // tells a technical/connectivity failure apart from a real decline.
        log:printWarn("payment-gateway request failed (technical error, not a decline)",
                'error = result, merchantId = merchantId, reference = reference);
        return {status: "failed", gatewayPaymentId: ""};
    }
    if result.status == "declined" {
        log:printInfo("payment-gateway declined the charge", merchantId = merchantId, reference = reference,
                gatewayPaymentId = result.paymentId);
    }
    return {status: fromGatewayPaymentStatus(result.status), gatewayPaymentId: result.paymentId};
}

// Pays a merchant's balance out through the payment-gateway external
// resource. `bankCode` stands in for the gateway's routing code — this
// component's own PayoutAccount carries a bank NAME, not a code, so the name
// is passed through; see the report for that gap.
function requestGatewayPayout(string merchantId, decimal amount, string currency, string bankName, string accountNumber, string reference) returns PayoutOutcome {
    paymentgateway:CreatePayoutRequest req = {
        merchantId,
        amount: toGatewayAmount(amount),
        currency,
        bankAccount: {accountNumber, bankCode: bankName},
        reference
    };
    paymentgateway:Payout|error result = paymentGatewayClient->/payouts.post(req);
    if result is error {
        log:printWarn("payment-gateway payout failed", 'error = result, merchantId = merchantId, reference = reference);
        return {status: "failed", gatewayPayoutId: ""};
    }
    return {status: fromGatewayPayoutStatus(result.status), gatewayPayoutId: result.payoutId};
}

function fromGatewayPaymentStatus(paymentgateway:PaymentStatus status) returns string {
    if status == "authorized" {
        return "succeeded";
    }
    if status == "declined" {
        return "failed";
    }
    return "pending";
}

function fromGatewayPayoutStatus(paymentgateway:PayoutStatus status) returns string {
    if status == "paid" {
        return "completed";
    }
    if status == "failed" {
        return "failed";
    }
    return "pending";
}
