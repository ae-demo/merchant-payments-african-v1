import payments_api.emailservice;
import payments_api.smsservice;

import ballerina/log;

// Notification failures never fail the request they were triggered from —
// the payment, approval or payout already happened; a delivery hiccup on the
// (mocked) email/sms provider is logged, not surfaced to the caller.

function notifyEmail(string to, string subject, string body) {
    if to.trim() == "" {
        return;
    }
    emailservice:SendEmailRequest req = {to, subject, body};
    emailservice:EmailMessage|error result = emailServiceClient->/emails.post(req);
    if result is error {
        log:printWarn("email notification failed", 'error = result, to = to, subject = subject);
    }
}

function notifySms(string to, string body) {
    if to.trim() == "" {
        return;
    }
    smsservice:SendSmsRequest req = {to, body};
    smsservice:SmsMessage|error result = smsServiceClient->/sms.post(req);
    if result is error {
        log:printWarn("sms notification failed", 'error = result, to = to);
    }
}

function notifyMerchantApproval(MerchantRow merchant, boolean approved) {
    string subject = approved ? "Your merchant account has been approved" : "Your merchant registration was rejected";
    string body = approved
        ? string `Hi ${merchant.businessName}, your merchant account is now approved and you can start collecting payments.`
        : string `Hi ${merchant.businessName}, your merchant registration was rejected.`;
    notifyEmail(merchant.email, subject, body);
}

function notifyPaymentOutcome(MerchantRow merchant, TransactionRow txn) {
    string outcomeWord = "pending";
    if txn.status == "succeeded" {
        outcomeWord = "succeeded";
    } else if txn.status == "failed" {
        outcomeWord = "failed";
    }
    string merchantSubject = txn.status == "succeeded" ? "Payment received"
        : txn.status == "failed" ? "Payment failed" : "Payment pending";
    string merchantBody = string `A payment of ${txn.amount} ${txn.currency} for payment request `
        + string `${txn.paymentRequestId} is ${outcomeWord}.`;
    notifyEmail(merchant.email, merchantSubject, merchantBody);

    string customerBody = string `Your payment of ${txn.amount} ${txn.currency} to `
        + string `${merchant.businessName} is ${outcomeWord}.`;
    notifySms(txn.customerContact, customerBody);
}

function notifyPayoutOutcome(MerchantRow merchant, PayoutRow payout) {
    string subject = "Payout requested";
    string body = string `A payout of ${payout.amount} ${merchant.currency} to your payout account is ${payout.status}.`;
    notifyEmail(merchant.email, subject, body);
}

function notifyDisputeResolution(MerchantRow merchant, DisputeRow dispute) {
    string subject = dispute.status == "resolved" ? "Dispute resolved" : "Dispute rejected";
    string body = string `Dispute ${dispute.id} on transaction ${dispute.transactionId} was ${dispute.status}.`;
    notifyEmail(merchant.email, subject, body);
}
