const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

export async function createMPPreference(params: {
  accessToken: string;
  appointmentId: string;
  serviceName: string;
  depositAmount: number;
  slug: string;
}): Promise<{ checkoutUrl: string; preferenceId: string }> {
  const { accessToken, appointmentId, serviceName, depositAmount, slug } = params;
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ title: `Seña - ${serviceName}`, quantity: 1, unit_price: depositAmount, currency_id: "ARS" }],
      back_urls: {
        success: `${APP_URL}/reservar/${slug}/pago-exitoso`,
        failure: `${APP_URL}/reservar/${slug}/pago-fallido`,
        pending: `${APP_URL}/reservar/${slug}/pago-pendiente`,
      },
      auto_return: "approved",
      external_reference: appointmentId,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`MercadoPago error: ${JSON.stringify(body)}`), { status: 502 });
  }
  const data = await res.json() as { init_point: string; id: string };
  return { checkoutUrl: data.init_point, preferenceId: data.id };
}

export async function getMPPayment(accessToken: string, paymentId: string): Promise<{
  status: string;
  transaction_amount: number;
  external_reference: string;
}> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`MercadoPago error: ${JSON.stringify(body)}`), { status: 502 });
  }
  return res.json();
}
