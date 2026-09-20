import ballerina/time;

// Database row shapes. Kept separate from the OpenAPI-generated wire types
// (openapi_service.bal) since a row carries fields — ownerId, merchantId — the
// contract never puts on the wire.

type MerchantRow record {|
    string id;
    string ownerId;
    string businessName;
    string country;
    string currency;
    string email;
    string status;
    decimal balance;
    time:Utc createdAt;
|};

type PayoutAccountRow record {|
    string merchantId;
    string bankName;
    string accountNumber;
    string accountHolderName;
|};

type PaymentRequestRow record {|
    string id;
    string merchantId;
    decimal amount;
    string currency;
    string description;
    string status;
    time:Utc createdAt;
|};

type TransactionRow record {|
    string id;
    string paymentRequestId;
    string method;
    decimal amount;
    string currency;
    string status;
    string customerContact;
    string gatewayPaymentId;
    time:Utc? paidAt;
|};

type RefundRow record {|
    string id;
    string transactionId;
    decimal amount;
    string reason;
    string status;
    time:Utc createdAt;
|};

type PayoutRow record {|
    string id;
    string merchantId;
    decimal amount;
    string status;
    string gatewayPayoutId;
    time:Utc requestedAt;
|};

type DisputeRow record {|
    string id;
    string transactionId;
    string raisedBy;
    string status;
    string resolutionNotes;
    time:Utc createdAt;
|};

function toMerchant(MerchantRow row) returns Merchant => {
    id: row.id,
    businessName: row.businessName,
    country: row.country,
    currency: row.currency,
    email: row.email,
    status: <"pending"|"approved"|"rejected"|"suspended">row.status,
    balance: row.balance
};

function toPayoutAccount(PayoutAccountRow row) returns PayoutAccount => {
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    accountHolderName: row.accountHolderName
};

function toPaymentRequest(PaymentRequestRow row) returns PaymentRequest => {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    status: <"pending"|"paid"|"expired"|"cancelled">row.status,
    createdAt: time:utcToString(row.createdAt)
};

function toTransaction(TransactionRow row) returns Transaction {
    time:Utc? paidAt = row.paidAt;
    return {
        id: row.id,
        paymentRequestId: row.paymentRequestId,
        method: <"mobile-money"|"card">row.method,
        amount: row.amount,
        currency: row.currency,
        status: <"pending"|"succeeded"|"failed">row.status,
        customerContact: row.customerContact,
        paidAt: paidAt is time:Utc ? time:utcToString(paidAt) : ()
    };
}

function toPayout(PayoutRow row) returns Payout => {
    id: row.id,
    merchantId: row.merchantId,
    amount: row.amount,
    status: <"pending"|"completed"|"failed">row.status,
    requestedAt: time:utcToString(row.requestedAt)
};

function toDispute(DisputeRow row) returns Dispute => {
    id: row.id,
    transactionId: row.transactionId,
    raisedBy: row.raisedBy,
    status: <"open"|"resolved"|"rejected">row.status,
    resolutionNotes: row.resolutionNotes,
    createdAt: time:utcToString(row.createdAt)
};
