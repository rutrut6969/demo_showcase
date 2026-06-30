type SquarePaymentInput = {
  invoiceId: string;
  sourceId: string;
  amount: number;
  currency?: string;
  idempotencyKey: string;
  note?: string;
};

type SquareEnvironment = "sandbox" | "production";

function getSquareApiBase(environment: SquareEnvironment) {
  return environment === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
}

async function squareRequest(path: string, init: RequestInit = {}) {
  const squareConfig = getSquareConfig();
  const configured = Boolean(squareConfig.accessToken && squareConfig.locationId);
  if (!configured) {
    return { ok: false, mode: "not_configured", message: "Square credentials are not configured.", environment: squareConfig.environment, data: null as unknown };
  }

  const response = await fetch(`${getSquareApiBase(squareConfig.environment)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${squareConfig.accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2025-04-16",
      ...(init.headers || {})
    }
  });

  const data = await response.json().catch(() => null);
  return {
    ok: response.ok,
    mode: "square",
    statusCode: response.status,
    data
  };
}

export async function createSquareDepositPayment(input: SquarePaymentInput) {
  const result = await squareRequest("/v2/payments", {
    method: "POST",
    body: JSON.stringify({
      source_id: input.sourceId,
      idempotency_key: input.idempotencyKey,
      amount_money: {
        amount: input.amount,
        currency: input.currency || "USD"
      },
      location_id: getSquareConfig().locationId,
      note: input.note || `Obsidian Systems invoice ${input.invoiceId} deposit`
    })
  });

  return {
    ...result,
    squarePaymentId: (result.data as any)?.payment?.id,
    status: (result.data as any)?.payment?.status,
    message: (result.data as any)?.errors?.[0]?.detail
  };
}

export async function createSquareCustomer(input: { email: string; givenName?: string; companyName?: string; referenceId?: string }) {
  const result = await squareRequest("/v2/customers", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: `customer-${input.referenceId || input.email}`,
      email_address: input.email,
      given_name: input.givenName,
      company_name: input.companyName,
      reference_id: input.referenceId
    })
  });

  return {
    ...result,
    squareCustomerId: (result.data as any)?.customer?.id,
    message: (result.data as any)?.errors?.[0]?.detail
  };
}

export async function createSquareCard(input: { sourceId: string; customerId: string; idempotencyKey: string; billingZip?: string }) {
  const result = await squareRequest("/v2/cards", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      source_id: input.sourceId,
      card: {
        customer_id: input.customerId,
        billing_address: input.billingZip ? { postal_code: input.billingZip } : undefined
      }
    })
  });
  const card = (result.data as any)?.card;
  return {
    ...result,
    squareCardId: card?.id,
    brand: card?.card_brand,
    last4: card?.last_4,
    expMonth: card?.exp_month,
    expYear: card?.exp_year,
    billingZip: card?.billing_address?.postal_code,
    message: (result.data as any)?.errors?.[0]?.detail
  };
}

export async function disableSquareCard(cardId: string) {
  const result = await squareRequest(`/v2/cards/${cardId}/disable`, { method: "POST" });
  return { ...result, message: (result.data as any)?.errors?.[0]?.detail };
}

export async function createSquareSubscription(input: { customerId: string; cardId: string; idempotencyKey: string; monthlyAmount: number; startDate?: string; planVariationId?: string }): Promise<{
  ok: boolean;
  mode: string;
  pendingSetup?: boolean;
  message?: string;
  squareSubscriptionId?: string;
  status?: string;
}> {
  const planVariationId = input.planVariationId || process.env.SQUARE_RETAINER_PLAN_VARIATION_ID;
  if (!planVariationId) {
    return { ok: false, mode: "not_configured", pendingSetup: true, message: "Square subscription plan variation is not configured." };
  }
  const result = await squareRequest("/v2/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      location_id: getSquareConfig().locationId,
      plan_variation_id: planVariationId,
      customer_id: input.customerId,
      card_id: input.cardId,
      start_date: input.startDate
    })
  });
  return {
    ...result,
    squareSubscriptionId: (result.data as any)?.subscription?.id,
    status: (result.data as any)?.subscription?.status,
    message: (result.data as any)?.errors?.[0]?.detail
  };
}

export async function cancelSquareSubscription(subscriptionId: string) {
  const result = await squareRequest(`/v2/subscriptions/${subscriptionId}/cancel`, { method: "POST" });
  return { ...result, message: (result.data as any)?.errors?.[0]?.detail };
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

export function getSquareConfig(): {
  environment: SquareEnvironment;
  accessToken?: string;
  locationId?: string;
  applicationId?: string;
} {
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
