import ballerina/sql;
import ballerina/time;

function insertPayout(string merchantId, decimal amount, string status, string gatewayPayoutId) returns PayoutRow|error {
    string id = newId();
    time:Utc requestedAt = nowUtc();
    _ = check (check db())->execute(`
        INSERT INTO payouts (id, merchant_id, amount, status, gateway_payout_id, requested_at)
        VALUES (${id}, ${merchantId}, ${amount}, ${status}, ${gatewayPayoutId}, ${requestedAt})
    `);
    return {id, merchantId, amount, status, gatewayPayoutId, requestedAt};
}

function listPayoutsByMerchant(string merchantId, int 'limit, int offset) returns [PayoutRow[], int]|error {
    record {| int total; |} countRow = check (check db())->queryRow(`
        SELECT count(*) as total FROM payouts WHERE merchant_id = ${merchantId}
    `);
    stream<PayoutRow, sql:Error?> rowStream = (check db())->query(`
        SELECT id, merchant_id as "merchantId", amount, status, gateway_payout_id as "gatewayPayoutId",
               requested_at as "requestedAt"
        FROM payouts WHERE merchant_id = ${merchantId}
        ORDER BY requested_at DESC LIMIT ${'limit} OFFSET ${offset}
    `);
    PayoutRow[] rows = check from PayoutRow r in rowStream select r;
    check rowStream.close();
    return [rows, countRow.total];
}

function listAllPayouts(int 'limit, int offset) returns [PayoutRow[], int]|error {
    record {| int total; |} countRow = check (check db())->queryRow(`SELECT count(*) as total FROM payouts`);
    stream<PayoutRow, sql:Error?> rowStream = (check db())->query(`
        SELECT id, merchant_id as "merchantId", amount, status, gateway_payout_id as "gatewayPayoutId",
               requested_at as "requestedAt"
        FROM payouts ORDER BY requested_at DESC LIMIT ${'limit} OFFSET ${offset}
    `);
    PayoutRow[] rows = check from PayoutRow r in rowStream select r;
    check rowStream.close();
    return [rows, countRow.total];
}
