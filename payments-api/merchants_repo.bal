import ballerina/sql;
import ballerina/time;

function insertMerchant(string ownerId, string businessName, string country, string currency, string email) returns MerchantRow|error {
    string id = newId();
    time:Utc createdAt = nowUtc();
    _ = check (check db())->execute(`
        INSERT INTO merchants (id, owner_id, business_name, country, currency, email, status, balance, created_at)
        VALUES (${id}, ${ownerId}, ${businessName}, ${country}, ${currency}, ${email}, 'pending', 0, ${createdAt})
    `);
    return {
        id,
        ownerId,
        businessName,
        country,
        currency,
        email,
        status: "pending",
        balance: 0d,
        createdAt
    };
}

function getMerchantByOwner(string ownerId) returns MerchantRow?|error {
    MerchantRow|sql:Error result = (check db())->queryRow(`
        SELECT id, owner_id as "ownerId", business_name as "businessName", country, currency, email,
               status, balance, created_at as "createdAt"
        FROM merchants WHERE owner_id = ${ownerId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

function getMerchantById(string merchantId) returns MerchantRow?|error {
    MerchantRow|sql:Error result = (check db())->queryRow(`
        SELECT id, owner_id as "ownerId", business_name as "businessName", country, currency, email,
               status, balance, created_at as "createdAt"
        FROM merchants WHERE id = ${merchantId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

function listMerchants(string? status, int 'limit, int offset) returns [MerchantRow[], int]|error {
    sql:ParameterizedQuery countQuery = withOptionalStatus(`SELECT count(*) as total FROM merchants WHERE 1 = 1`, status);
    record {| int total; |} countRow = check (check db())->queryRow(countQuery);

    sql:ParameterizedQuery listQuery = withOptionalStatus(`
        SELECT id, owner_id as "ownerId", business_name as "businessName", country, currency, email,
               status, balance, created_at as "createdAt"
        FROM merchants WHERE 1 = 1`, status);
    listQuery = sql:queryConcat(listQuery, ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`);
    stream<MerchantRow, sql:Error?> rowStream = (check db())->query(listQuery);
    MerchantRow[] merchants = check from MerchantRow m in rowStream select m;
    check rowStream.close();
    return [merchants, countRow.total];
}

function updateMerchantStatus(string merchantId, string status) returns MerchantRow?|error {
    sql:ExecutionResult result = check (check db())->execute(`
        UPDATE merchants SET status = ${status} WHERE id = ${merchantId}
    `);
    if result.affectedRowCount == 0 {
        return ();
    }
    return getMerchantById(merchantId);
}

function adjustMerchantBalance(string merchantId, decimal delta) returns error? {
    _ = check (check db())->execute(`
        UPDATE merchants SET balance = balance + ${delta} WHERE id = ${merchantId}
    `);
}

function getPayoutAccount(string merchantId) returns PayoutAccountRow?|error {
    PayoutAccountRow|sql:Error result = (check db())->queryRow(`
        SELECT merchant_id as "merchantId", bank_name as "bankName", account_number as "accountNumber",
               account_holder_name as "accountHolderName"
        FROM payout_accounts WHERE merchant_id = ${merchantId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

function upsertPayoutAccount(string merchantId, string bankName, string accountNumber, string accountHolderName) returns PayoutAccountRow|error {
    _ = check (check db())->execute(`
        INSERT INTO payout_accounts (merchant_id, bank_name, account_number, account_holder_name)
        VALUES (${merchantId}, ${bankName}, ${accountNumber}, ${accountHolderName})
        ON CONFLICT (merchant_id) DO UPDATE SET
            bank_name = EXCLUDED.bank_name,
            account_number = EXCLUDED.account_number,
            account_holder_name = EXCLUDED.account_holder_name
    `);
    return {merchantId, bankName, accountNumber, accountHolderName};
}
