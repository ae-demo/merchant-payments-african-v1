import ballerina/sql;
import ballerina/time;

function insertTransaction(string paymentRequestId, string method, decimal amount, string currency, string status,
        string customerContact, string gatewayPaymentId, time:Utc? paidAt) returns TransactionRow|error {
    string id = newId();
    _ = check (check db())->execute(`
        INSERT INTO transactions (id, payment_request_id, method, amount, currency, status, customer_contact,
                                   gateway_payment_id, paid_at)
        VALUES (${id}, ${paymentRequestId}, ${method}, ${amount}, ${currency}, ${status}, ${customerContact},
                ${gatewayPaymentId}, ${paidAt})
    `);
    return {id, paymentRequestId, method, amount, currency, status, customerContact, gatewayPaymentId, paidAt};
}

function getTransactionById(string transactionId) returns TransactionRow?|error {
    TransactionRow|sql:Error result = (check db())->queryRow(`
        SELECT id, payment_request_id as "paymentRequestId", method, amount, currency, status,
               customer_contact as "customerContact", gateway_payment_id as "gatewayPaymentId", paid_at as "paidAt"
        FROM transactions WHERE id = ${transactionId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

// The transaction, only when it belongs to a payment request owned by
// `merchantId` — the ownership check for `/me/transactions/{id}/refund`.
function getOwnedTransaction(string transactionId, string merchantId) returns TransactionRow?|error {
    TransactionRow|sql:Error result = (check db())->queryRow(`
        SELECT t.id, t.payment_request_id as "paymentRequestId", t.method, t.amount, t.currency, t.status,
               t.customer_contact as "customerContact", t.gateway_payment_id as "gatewayPaymentId", t.paid_at as "paidAt"
        FROM transactions t
        JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE t.id = ${transactionId} AND pr.merchant_id = ${merchantId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

function listTransactionsByMerchant(string merchantId, int 'limit, int offset) returns [TransactionRow[], int]|error {
    record {| int total; |} countRow = check (check db())->queryRow(`
        SELECT count(*) as total FROM transactions t
        JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE pr.merchant_id = ${merchantId}
    `);
    stream<TransactionRow, sql:Error?> rowStream = (check db())->query(`
        SELECT t.id, t.payment_request_id as "paymentRequestId", t.method, t.amount, t.currency, t.status,
               t.customer_contact as "customerContact", t.gateway_payment_id as "gatewayPaymentId", t.paid_at as "paidAt"
        FROM transactions t
        JOIN payment_requests pr ON pr.id = t.payment_request_id
        WHERE pr.merchant_id = ${merchantId}
        ORDER BY t.paid_at DESC NULLS LAST LIMIT ${'limit} OFFSET ${offset}
    `);
    TransactionRow[] rows = check from TransactionRow r in rowStream select r;
    check rowStream.close();
    return [rows, countRow.total];
}

function listAllTransactions(int 'limit, int offset) returns [TransactionRow[], int]|error {
    record {| int total; |} countRow = check (check db())->queryRow(`SELECT count(*) as total FROM transactions`);
    stream<TransactionRow, sql:Error?> rowStream = (check db())->query(`
        SELECT id, payment_request_id as "paymentRequestId", method, amount, currency, status,
               customer_contact as "customerContact", gateway_payment_id as "gatewayPaymentId", paid_at as "paidAt"
        FROM transactions ORDER BY paid_at DESC NULLS LAST LIMIT ${'limit} OFFSET ${offset}
    `);
    TransactionRow[] rows = check from TransactionRow r in rowStream select r;
    check rowStream.close();
    return [rows, countRow.total];
}

function getRefundedTotal(string transactionId) returns decimal|error {
    record {| decimal total; |} result = check (check db())->queryRow(`
        SELECT coalesce(sum(amount), 0) as total FROM refunds WHERE transaction_id = ${transactionId}
    `);
    return result.total;
}

function insertRefund(string transactionId, decimal amount, string reason) returns RefundRow|error {
    string id = newId();
    time:Utc createdAt = nowUtc();
    _ = check (check db())->execute(`
        INSERT INTO refunds (id, transaction_id, amount, reason, status, created_at)
        VALUES (${id}, ${transactionId}, ${amount}, ${reason}, 'completed', ${createdAt})
    `);
    return {id, transactionId, amount, reason, status: "completed", createdAt};
}

// The merchant that owns the payment request a transaction was made against.
function getMerchantForTransaction(string transactionId) returns MerchantRow?|error {
    MerchantRow|sql:Error result = (check db())->queryRow(`
        SELECT m.id, m.owner_id as "ownerId", m.business_name as "businessName", m.country, m.currency, m.email,
               m.status, m.balance, m.created_at as "createdAt"
        FROM merchants m
        JOIN payment_requests pr ON pr.merchant_id = m.id
        JOIN transactions t ON t.payment_request_id = pr.id
        WHERE t.id = ${transactionId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}
