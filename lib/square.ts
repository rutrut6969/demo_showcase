type SquarePaymentInput = {
  invoiceId: string;
  sourceId: string;
  amount: number;
  currency?: string;
  idempotencyKey: string;
};

export async function createSquareDepositPayment(input: SquarePaymentInput) {
  const squareConfig = getSquareConfig();
  const configured = Boolean(squareConfig.accessToken && squareConfig.locationId);
  if (!configured) {
    return { ok: false, mode: "not_configured", message: "Square credentials are not configured.", environment: squareConfig.environment };
  }

  const endpoint =
    squareConfig.environment === "production"
      ? "https://connect.squareup.com/v2/payments"
      : "https://connect.squareupsandbox.com/v2/payments";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${squareConfig.accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2025-04-16"
    },
    body: JSON.stringify({
      source_id: input.sourceId,
      idempotency_key: input.idempotencyKey,
      amount_money: {
        amount: input.amount,
        currency: input.currency || "USD"
      },
      location_id: squareConfig.locationId,
      note: `Obsidian Systems invoice ${input.invoiceId} deposit`
    })
  });

  const data = await response.json();
  return {
    ok: response.ok,
    mode: "square",
    squarePaymentId: data.payment?.id,
    status: data.payment?.status,
    data
  };
}

export function getSquareFrontendConfig() {
  const config = getSquareConfig();
  return {
    environment: config.environment,
    applicationId: config.applicationId || null,
    locationId: config.locationId || null,
    afterpayEnabled: process.env.SQUARE_ENABLE_AFTERPAY === "1"
  };
}

export function getSquareWebhookSignatureKey() {
  return process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";
}

export function getSquareConfig() {
  const environment = process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";

  if (environment === "production") {
    return {
      environment,
      accessToken: process.env.SQUARE_PRODUCTION_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN,
      locationId: process.env.SQUARE_PRODUCTION_LOCATION_ID || process.env.SQUARE_LOCATION_ID,
      applicationId: process.env.SQUARE_PRODUCTION_APPLICATION_ID || process.env.SQUARE_APPLICATION_ID
    };
  }

  return {
    environment,
    accessToken: process.env.SQUARE_SANDBOX_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN,
    locationId: process.env.SQUARE_SANDBOX_LOCATION_ID || process.env.SQUARE_LOCATION_ID,
    applicationId: process.env.SQUARE_SANDBOX_APPLICATION_ID || process.env.SQUARE_APPLICATION_ID
  };
}
