import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;
import ballerina/sql;

// Lazy rather than a module-level `final … = check new (...)`: this package's
// pure-function and gateway-assertion tests `bal test` with no Postgres
// reachable, and a top-level `check new (...)` would fail module init before
// any test — including ones that never touch the database — got to run. A
// real deployment pays for this with the fail-fast error landing on the
// first request that reaches the database instead of before the listener
// opens, which for every non-`/health` operation is effectively immediate.
postgresql:Client? dbClientInstance = ();

function db() returns postgresql:Client|error {
    postgresql:Client? existing = dbClientInstance;
    if existing is postgresql:Client {
        return existing;
    }
    postgresql:Client created = check newDbClient();
    check ensureSchema(created);
    dbClientInstance = created;
    return created;
}

function newDbClient() returns postgresql:Client|error {
    int dbPort = 5432;
    if paymentsDbPort.trim() != "" {
        int|error parsedPort = int:fromString(paymentsDbPort.trim());
        if parsedPort is int {
            dbPort = parsedPort;
        }
    }
    return new (
        host = paymentsDbHost,
        username = paymentsDbUser,
        password = paymentsDbPassword,
        database = paymentsDbName,
        port = dbPort
    );
}

function ensureSchema(postgresql:Client dbc) returns error? {
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS merchants (
            id text PRIMARY KEY,
            owner_id text NOT NULL,
            business_name text NOT NULL,
            country text NOT NULL,
            currency text NOT NULL,
            email text NOT NULL,
            status text NOT NULL,
            balance numeric NOT NULL DEFAULT 0,
            created_at timestamptz NOT NULL DEFAULT now()
        )
    `);
    _ = check dbc->execute(`
        CREATE UNIQUE INDEX IF NOT EXISTS merchants_owner_id_idx ON merchants (owner_id)
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS payout_accounts (
            merchant_id text PRIMARY KEY REFERENCES merchants (id),
            bank_name text NOT NULL,
            account_number text NOT NULL,
            account_holder_name text NOT NULL
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS payment_requests (
            id text PRIMARY KEY,
            merchant_id text NOT NULL REFERENCES merchants (id),
            amount numeric NOT NULL,
            currency text NOT NULL,
            description text NOT NULL DEFAULT '',
            status text NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS transactions (
            id text PRIMARY KEY,
            payment_request_id text NOT NULL REFERENCES payment_requests (id),
            method text NOT NULL,
            amount numeric NOT NULL,
            currency text NOT NULL,
            status text NOT NULL,
            customer_contact text NOT NULL DEFAULT '',
            gateway_payment_id text NOT NULL DEFAULT '',
            paid_at timestamptz
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS refunds (
            id text PRIMARY KEY,
            transaction_id text NOT NULL REFERENCES transactions (id),
            amount numeric NOT NULL,
            reason text NOT NULL DEFAULT '',
            status text NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS payouts (
            id text PRIMARY KEY,
            merchant_id text NOT NULL REFERENCES merchants (id),
            amount numeric NOT NULL,
            status text NOT NULL,
            gateway_payout_id text NOT NULL DEFAULT '',
            requested_at timestamptz NOT NULL DEFAULT now()
        )
    `);
    _ = check dbc->execute(`
        CREATE TABLE IF NOT EXISTS disputes (
            id text PRIMARY KEY,
            transaction_id text NOT NULL REFERENCES transactions (id),
            raised_by text NOT NULL DEFAULT '',
            status text NOT NULL,
            resolution_notes text NOT NULL DEFAULT '',
            created_at timestamptz NOT NULL DEFAULT now()
        )
    `);
}

// Builds a `WHERE` clause fragment appending `AND status = ${status}` only when
// a status filter was supplied, leaving the base query untouched otherwise.
function withOptionalStatus(sql:ParameterizedQuery base, string? status) returns sql:ParameterizedQuery {
    if status is string {
        return sql:queryConcat(base, ` AND status = ${status}`);
    }
    return base;
}
