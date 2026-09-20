# Merchant Payments Africa — PRD

## Problem Statement

Small and medium merchants across African countries need to collect payments
from customers who pay through very different rails — mobile money wallets and
bank cards — often country by country. Today merchants juggle multiple
disconnected tools (a mobile money till number here, a card terminal or
third-party link there), with no unified view of what has been collected, no
reliable way to get the money into their own bank or mobile wallet, and no
platform oversight when a payment fails or is disputed.

## Solution

A merchant payments platform where a merchant registers once, creates payment
requests that customers can pay by mobile money or card, tracks every
transaction in one place, and receives its collected funds via payouts to a
bank account — across multiple African countries and currencies. A platform
admin oversees merchant onboarding, transactions and disputes across the whole
platform.

## Actors

- **Merchant**: a registered business that creates payment requests, views its
own transaction history and balance, configures its payout destination,
requests payouts, and issues refunds to its customers.
- **Customer**: the person paying a merchant's payment request, by mobile money
or by card, who receives confirmation once the payment succeeds.
- **Platform Admin**: the platform operator who reviews and approves new
merchant registrations, monitors transactions and payouts across all
merchants, and handles disputed or failed transactions.

## User Stories

1. As a Merchant, I want to register my business on the platform, so that I can start collecting payments.
2. As a Platform Admin, I want to review and approve or reject new merchant registrations, so that only legitimate businesses can collect payments.
3. As a Merchant, I want to sign in securely, so that I can access my payment dashboard.
4. As a Platform Admin, I want to sign in securely, so that I can access platform oversight tools.
5. As a Merchant, I want to create a payment request specifying an amount and currency, so that I can ask a customer to pay.
6. As a Customer, I want to pay a merchant's payment request using mobile money, so that I can complete a purchase without a card.
7. As a Customer, I want to pay a merchant's payment request using a card, so that I can complete a purchase with my bank card.
8. As a Merchant, I want to view the status and history of my transactions, so that I can track my sales.
9. As a Customer, I want to receive a confirmation after a successful payment, so that I know my payment went through.
10. As a Merchant, I want to receive a notification when a payment is received, so that I know to fulfill the order.
11. As a Merchant, I want to configure my payout bank account, so that collected funds can be sent to me.
12. As a Merchant, I want to view my available balance and payout history, so that I can track funds owed and received.
13. As a Merchant, I want to request a payout of my available balance, so that I receive my collected funds.
14. As a Merchant, I want to issue a refund to a customer for a completed payment, so that I can resolve returns or errors.
15. As a Platform Admin, I want to view all merchants' transactions and payouts across the platform, so that I can monitor platform health.
16. As a Platform Admin, I want to review and act on disputed or failed transactions, so that merchants and customers are treated fairly.

## Product Decisions

- **Sign-in**: Merchants and Platform Admins sign in via SSO through Thunder, the platform IDP — an organization default for every web app.
- **Payment processing**: mobile money and card payments are both collected through the `payment-gateway` Registered External resource — an org-registered mock payment gateway — rather than integrating a new provider.
- **Payment notifications**: payment confirmations to customers and merchants are sent via the `email-service` and `sms-service` Registered External resources.
- **Multi-country / multi-currency**: the platform supports merchants across multiple African countries, each collecting in their own local currency; there is no cross-currency conversion between a merchant's collections and its payouts.
- **Merchant account model**: each merchant business is represented by a single user account — no internal staff sub-roles in this version.
- **Settlement / payouts**: the platform tracks each merchant's collected balance internally and pays out on the merchant's request, rather than settling automatically on a fixed schedule.
- **Payout destination**: a merchant configures a bank account as its payout destination.
- **Refunds &amp; disputes**: a merchant can refund a completed payment directly; a Platform Admin handles cases the merchant cannot resolve (failed payments, customer disputes escalated to the platform). *assumed*
- **Channel**: payment requests and their payment pages are web-based (mobile browser or desktop) — no dedicated physical point-of-sale hardware integration in this version. *assumed*
- **Launch countries/currencies**: the platform launches supporting merchants in Kenya (KES) and South Africa (ZAR).

## Out of Scope

- Merchant staff/sub-accounts with differentiated permissions.
- Cross-border currency conversion or FX between a merchant's collection currency and its payout currency.
- Recurring or subscription billing.
- Physical point-of-sale hardware (card readers, terminals).
- Loyalty or rewards programs.

## Open Questions

None.

## Further Notes

None.