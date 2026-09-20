import ballerina/os;

// payments-db (platform-resource: postgres-cnpg)
configurable string paymentsDbHost = os:getEnv("PAYMENTS_DB_HOST");
configurable string paymentsDbPort = os:getEnv("PAYMENTS_DB_PORT");
configurable string paymentsDbName = os:getEnv("PAYMENTS_DB_DBNAME");
configurable string paymentsDbUser = os:getEnv("PAYMENTS_DB_USER");
configurable string paymentsDbPassword = os:getEnv("PAYMENTS_DB_PASSWORD");

// external dependencies — credentials/addresses may be empty until this
// milestone's environment wires them; that is a runtime concern, not a
// build-time one.
configurable string paymentGatewayBaseUrl = os:getEnv("PAYMENT_GATEWAY_BASE_URL");
configurable string emailServiceBaseUrl = os:getEnv("EMAIL_SERVICE_BASE_URL");
configurable string smsServiceBaseUrl = os:getEnv("SMS_SERVICE_BASE_URL");
