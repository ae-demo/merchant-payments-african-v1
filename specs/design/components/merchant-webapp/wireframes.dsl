screen RegisterBusiness "Register a new merchant business"
  navbar "Merchant Payments"
  heading "Register your business"
  input "Business name"
  select "Country"
  select "Currency"
  input "Email"
  row
    right
    button "Register" primary -> PendingApproval

screen PendingApproval "Registration awaiting platform review"
  navbar "Merchant Payments"
  heading "Registration submitted"
  text "Your business is pending review by the platform. You'll be notified by email once approved."
  badge "Pending" warning

screen Dashboard "Merchant home: balance and quick links"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Requests -> PaymentRequests | Transactions -> TransactionHistory | Payouts -> Payouts | Payout Account -> PayoutAccountSettings"
  heading "Dashboard"
  row
    card "Available balance | 0.00 | ready to pay out"
    card "Open payment requests | 0 | awaiting payment"
    card "This month | 0.00 | collected"
  row
    right
    button "New payment request" primary -> CreatePaymentRequest

screen PaymentRequests "The merchant's own payment requests"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Requests -> PaymentRequests | Transactions -> TransactionHistory | Payouts -> Payouts | Payout Account -> PayoutAccountSettings"
  row
    heading "Payment requests"
    right
    button "New payment request" primary -> CreatePaymentRequest
  table "Amount | Currency | Description | Status | Created"
    row "50.00 | KES | Order #123 | pending | 2026-09-18"
    row "20.00 | ZAR | Order #124 | paid | 2026-09-17"

screen CreatePaymentRequest "Create a new payment request"
  navbar "Merchant Payments"
  heading "New payment request"
  input "Amount"
  select "Currency"
  textarea "Description"
  row
    right
    button "Cancel" -> PaymentRequests
    button "Create" primary -> PaymentRequests

screen TransactionHistory "The merchant's own transactions"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Requests -> PaymentRequests | Transactions -> TransactionHistory | Payouts -> Payouts | Payout Account -> PayoutAccountSettings"
  heading "Transactions"
  search "Search transactions"
  table "Amount | Method | Status | Paid at | " -> RefundModal
    row "50.00 | card | succeeded | 2026-09-18 | Refund"
    row "20.00 | mobile-money | succeeded | 2026-09-17 | Refund"

screen RefundModal "Confirm a refund for a transaction"
  navbar "Merchant Payments"
  heading "Refund transaction"
  text "Amount: 50.00"
  textarea "Reason for refund"
  row
    right
    button "Cancel" -> TransactionHistory
    button "Issue refund" primary danger -> TransactionHistory

screen PayoutAccountSettings "Configure the payout bank account"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Requests -> PaymentRequests | Transactions -> TransactionHistory | Payouts -> Payouts | Payout Account -> PayoutAccountSettings"
  heading "Payout bank account"
  input "Bank name"
  input "Account number"
  input "Account holder name"
  row
    right
    button "Save" primary -> Dashboard

screen Payouts "Balance and payout history"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment Requests -> PaymentRequests | Transactions -> TransactionHistory | Payouts -> Payouts | Payout Account -> PayoutAccountSettings"
  row
    card "Available balance | 0.00 | ready to pay out"
    right
    button "Request payout" primary -> Payouts
  table "Amount | Status | Requested at"
    row "100.00 | completed | 2026-09-10"
    row "40.00 | pending | 2026-09-19"

screen Checkout "Customer pays a merchant's payment request"
  navbar "Merchant Payments"
  heading "Pay Order #123"
  text "Amount due: 50.00 KES"
  tabs "Mobile money | Card"
  input "Phone number or card details"
  row
    right
    button "Pay now" primary -> PaymentResult

screen PaymentResult "Payment outcome shown to the customer"
  navbar "Merchant Payments"
  heading "Payment successful"
  badge "Paid" success
  text "A confirmation has been sent to your phone/email."

flow "Merchant registration"
  role "Merchant"
  description "A new merchant registers a business and waits for approval"
  RegisterBusiness
  PendingApproval

flow "Merchant workspace"
  role "Merchant"
  description "An approved merchant manages payment requests, transactions and payouts"
  Dashboard
  PaymentRequests
  CreatePaymentRequest
  TransactionHistory
  RefundModal
  PayoutAccountSettings
  Payouts

flow "Customer checkout"
  description "A customer opens a payment link and pays by mobile money or card"
  Checkout
  PaymentResult
