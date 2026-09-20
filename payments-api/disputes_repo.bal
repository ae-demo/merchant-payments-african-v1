import ballerina/sql;
import ballerina/time;

function insertDispute(string transactionId, string raisedBy) returns DisputeRow|error {
    string id = newId();
    time:Utc createdAt = nowUtc();
    _ = check (check db())->execute(`
        INSERT INTO disputes (id, transaction_id, raised_by, status, resolution_notes, created_at)
        VALUES (${id}, ${transactionId}, ${raisedBy}, 'open', '', ${createdAt})
    `);
    return {id, transactionId, raisedBy, status: "open", resolutionNotes: "", createdAt};
}

function getDisputeById(string disputeId) returns DisputeRow?|error {
    DisputeRow|sql:Error result = (check db())->queryRow(`
        SELECT id, transaction_id as "transactionId", raised_by as "raisedBy", status,
               resolution_notes as "resolutionNotes", created_at as "createdAt"
        FROM disputes WHERE id = ${disputeId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

function listDisputes(string? status, int 'limit, int offset) returns [DisputeRow[], int]|error {
    sql:ParameterizedQuery countQuery = withOptionalStatus(`SELECT count(*) as total FROM disputes WHERE 1 = 1`, status);
    record {| int total; |} countRow = check (check db())->queryRow(countQuery);

    sql:ParameterizedQuery listQuery = withOptionalStatus(`
        SELECT id, transaction_id as "transactionId", raised_by as "raisedBy", status,
               resolution_notes as "resolutionNotes", created_at as "createdAt"
        FROM disputes WHERE 1 = 1`, status);
    listQuery = sql:queryConcat(listQuery, ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`);
    stream<DisputeRow, sql:Error?> rowStream = (check db())->query(listQuery);
    DisputeRow[] rows = check from DisputeRow r in rowStream select r;
    check rowStream.close();
    return [rows, countRow.total];
}

function updateDisputeResolution(string disputeId, string status, string resolutionNotes) returns DisputeRow?|error {
    sql:ExecutionResult result = check (check db())->execute(`
        UPDATE disputes SET status = ${status}, resolution_notes = ${resolutionNotes} WHERE id = ${disputeId}
    `);
    if result.affectedRowCount == 0 {
        return ();
    }
    return getDisputeById(disputeId);
}
