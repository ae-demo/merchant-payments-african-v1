import ballerina/sql;
import ballerina/time;

function insertPaymentRequest(string merchantId, decimal amount, string currency, string description) returns PaymentRequestRow|error {
    string id = newId();
    time:Utc createdAt = nowUtc();
    _ = check (check db())->execute(`
        INSERT INTO payment_requests (id, merchant_id, amount, currency, description, status, created_at)
        VALUES (${id}, ${merchantId}, ${amount}, ${currency}, ${description}, 'pending', ${createdAt})
    `);
    return {id, merchantId, amount, currency, description, status: "pending", createdAt};
}

function getPaymentRequestById(string requestId) returns PaymentRequestRow?|error {
    PaymentRequestRow|sql:Error result = (check db())->queryRow(`
        SELECT id, merchant_id as "merchantId", amount, currency, description, status,
               created_at as "createdAt"
        FROM payment_requests WHERE id = ${requestId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

function listPaymentRequestsByMerchant(string merchantId, int 'limit, int offset) returns [PaymentRequestRow[], int]|error {
    record {| int total; |} countRow = check (check db())->queryRow(`
        SELECT count(*) as total FROM payment_requests WHERE merchant_id = ${merchantId}
    `);
    stream<PaymentRequestRow, sql:Error?> rowStream = (check db())->query(`
        SELECT id, merchant_id as "merchantId", amount, currency, description, status,
               created_at as "createdAt"
        FROM payment_requests WHERE merchant_id = ${merchantId}
        ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}
    `);
    PaymentRequestRow[] requests = check from PaymentRequestRow r in rowStream select r;
    check rowStream.close();
    return [requests, countRow.total];
}

function updatePaymentRequestStatus(string requestId, string status) returns error? {
    _ = check (check db())->execute(`
        UPDATE payment_requests SET status = ${status} WHERE id = ${requestId}
    `);
}
