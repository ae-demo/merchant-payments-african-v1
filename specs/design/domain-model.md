# Domain Model

Core entities for the merchant payments platform: merchants and their payout
accounts, the payment requests they issue, the transactions customers make
against them, and the payouts merchants draw from their balance.

```mermaid
erDiagram
    MERCHANT ||--o{ PAYMENT_REQUEST : creates
    MERCHANT ||--o| PAYOUT_ACCOUNT : configures
    MERCHANT ||--o{ PAYOUT : requests
    PAYMENT_REQUEST ||--o| TRANSACTION : "paid by"
    TRANSACTION ||--o| REFUND : "refunded by"

    MERCHANT {
        string id PK
        string businessName
        string country
        string currency
        string email
        string status "pending|approved|rejected|suspended"
        decimal balance
    }
    PAYOUT_ACCOUNT {
        string id PK
        string merchantId FK
        string bankName
        string accountNumber
        string accountHolderName
    }
    PAYMENT_REQUEST {
        string id PK
        string merchantId FK
        decimal amount
        string currency
        string description
        string status "pending|paid|expired|cancelled"
        datetime createdAt
    }
    TRANSACTION {
        string id PK
        string paymentRequestId FK
        string method "mobile-money|card"
        decimal amount
        string currency
        string status "pending|succeeded|failed"
        string customerContact
        datetime paidAt
    }
    REFUND {
        string id PK
        string transactionId FK
        decimal amount
        string reason
        string status "pending|completed|failed"
        datetime createdAt
    }
    PAYOUT {
        string id PK
        string merchantId FK
        decimal amount
        string status "pending|completed|failed"
        datetime requestedAt
    }
    DISPUTE {
        string id PK
        string transactionId FK
        string raisedBy
        string status "open|resolved|rejected"
        string resolutionNotes
        datetime createdAt
    }
```

`MERCHANT.status` gates whether a merchant can create payment requests
(`approved` only). `TRANSACTION` records the outcome of a customer paying a
`PAYMENT_REQUEST` through the payment gateway, by either rail. A `DISPUTE`
references a `TRANSACTION` and is worked by a Platform Admin.