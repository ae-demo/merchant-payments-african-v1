import ballerina/time;
import ballerina/uuid;

function newId() returns string {
    return uuid:createRandomUuid();
}

function nowUtc() returns time:Utc {
    return time:utcNow();
}

// The `next`/`previous` pair for a page envelope. `basePath` is the
// unparameterised resource path, e.g. "/merchants?status=pending".
function pageLinks(string basePath, int 'limit, int offset, int count) returns [string?, string?] {
    string? next = offset + 'limit < count ? string `${basePath}&limit=${'limit}&offset=${offset + 'limit}` : ();
    string? previous = offset > 0 ? string `${basePath}&limit=${'limit}&offset=${(offset - 'limit) < 0 ? 0 : (offset - 'limit)}` : ();
    return [next, previous];
}

// Rounds a decimal amount to the nearest whole unit for the payment-gateway's
// int64 amount fields. The gateway contract models money as an integer count
// of the currency's minor-or-whole unit; this component's own contract models
// it as `number`, so the boundary is where the two are reconciled.
function toGatewayAmount(decimal amount) returns int {
    return <int>amount;
}

// The balance-sufficiency check on a payout request: positive, and no more
// than what the merchant has actually collected.
function isPayoutAllowed(decimal requestedAmount, decimal availableBalance) returns boolean {
    return requestedAmount > 0d && requestedAmount <= availableBalance;
}

// The amount to refund: the caller's explicit amount, defaulting to the full
// remaining refundable balance, validated against what a transaction has not
// already had refunded. An amount of zero, negative, or beyond what remains
// is not a request this component can carry out.
function resolveRefundAmount(decimal? requestedAmount, decimal transactionAmount, decimal alreadyRefunded) returns decimal|error {
    decimal remaining = transactionAmount - alreadyRefunded;
    decimal amount = requestedAmount ?: remaining;
    if amount <= 0d || amount > remaining {
        return error("refund amount exceeds the refundable balance");
    }
    return amount;
}
