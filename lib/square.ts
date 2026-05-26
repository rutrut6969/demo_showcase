type SquarePaymentInput = {
  invoiceId: string;
  sourceId?: string;
  amount: number;
  currency?: string;
};

export async function createSquareDepositPayment(input: SquarePaymentInput) {
  const squareConfig = getSquareConfig();
  const configured = Boolean(squareConfig.accessToken && squareConfig.locationId);
  if (!configured) {
    return {
      ok: true,
      mode: "placeholder",
      squarePaymentId: `sq-placeholder-${input.invoiceId}`,
      message: "Square credentials are not configured. Payment was logged as a placeholder.",
      environment: squareConfig.environment
    };
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
      source_id: input.sourceId || "cnon:card-nonce-ok",
      idempotency_key: `${input.invoiceId}-${Date.now()}`,
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
    data
  };
}

export function getSquareConfig() {
  const environment = process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";

  // TODO: When the Square Web Payments SDK form is added, expose only applicationId
  // and locationId to the frontend. Keep accessToken server-side only.
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
