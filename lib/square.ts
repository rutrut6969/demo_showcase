type SquarePaymentInput = {
  invoiceId: string;
  sourceId?: string;
  amount: number;
  currency?: string;
};

export async function createSquareDepositPayment(input: SquarePaymentInput) {
  const configured = Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
  if (!configured) {
    return {
      ok: true,
      mode: "placeholder",
      squarePaymentId: `sq-placeholder-${input.invoiceId}`,
      message: "Square sandbox credentials are not configured. Payment was logged as a placeholder."
    };
  }

  const endpoint =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? "https://connect.squareup.com/v2/payments"
      : "https://connect.squareupsandbox.com/v2/payments";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
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
      location_id: process.env.SQUARE_LOCATION_ID,
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
