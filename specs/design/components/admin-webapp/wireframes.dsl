screen PendingMerchants "Merchant registrations awaiting review"
  navbar "Platform Admin"
  sidebar "Merchants -> PendingMerchants | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Pending merchants"
  table "Business | Country | Currency | Email | "
    row "Acme Traders | Kenya | KES | acme@example.com | Review"
    row "Kaya Foods | South Africa | ZAR | kaya@example.com | Review"

screen MerchantReview "Approve or reject a pending merchant"
  navbar "Platform Admin"
  heading "Acme Traders"
  text "Country: Kenya"
  text "Currency: KES"
  text "Email: acme@example.com"
  row
    right
    button "Reject" danger -> PendingMerchants
    button "Approve" primary -> PendingMerchants

screen AllTransactions "Every transaction across all merchants"
  navbar "Platform Admin"
  sidebar "Merchants -> PendingMerchants | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Transactions"
  search "Search by merchant or customer"
  table "Merchant | Amount | Method | Status | Paid at"
    row "Acme Traders | 50.00 | card | succeeded | 2026-09-18"
    row "Kaya Foods | 20.00 | mobile-money | failed | 2026-09-17"

screen AllPayouts "Every payout across all merchants"
  navbar "Platform Admin"
  sidebar "Merchants -> PendingMerchants | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Payouts"
  table "Merchant | Amount | Status | Requested at"
    row "Acme Traders | 100.00 | completed | 2026-09-10"
    row "Kaya Foods | 40.00 | pending | 2026-09-19"

screen Disputes "Disputed or failed transactions"
  navbar "Platform Admin"
  sidebar "Merchants -> PendingMerchants | Transactions -> AllTransactions | Payouts -> AllPayouts | Disputes -> Disputes"
  heading "Disputes"
  table "Transaction | Raised by | Status | " -> DisputeDetail
    row "txn-102 | customer | open | Review"
    row "txn-118 | merchant | open | Review"

screen DisputeDetail "Review and resolve a dispute"
  navbar "Platform Admin"
  heading "Dispute on txn-102"
  text "Raised by: customer"
  text "Status: open"
  textarea "Resolution notes"
  row
    right
    button "Reject dispute" danger -> Disputes
    button "Resolve dispute" primary -> Disputes

flow "Platform oversight"
  role "Platform Admin"
  description "A platform admin reviews merchants, monitors activity and resolves disputes"
  PendingMerchants
  MerchantReview
  AllTransactions
  AllPayouts
  Disputes
  DisputeDetail
