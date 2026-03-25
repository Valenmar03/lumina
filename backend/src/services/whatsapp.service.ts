const META_API_URL = "https://graph.facebook.com/v19.0";

export async function sendTemplate(params: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  variables: string[];
}): Promise<void> {
  const { accessToken, phoneNumberId, to, templateName, variables } = params;

  if (!accessToken || !phoneNumberId || !to) return;

  // Normalizar número: eliminar espacios, guiones, paréntesis, +
  const normalizedTo = to.replace(/[\s\-().+]/g, "");
  if (!normalizedTo || normalizedTo.length < 8) return;

  const body = {
    messaging_product: "whatsapp",
    to: normalizedTo,
    type: "template",
    template: {
      name: templateName,
      language: { code: "es_AR" },
      components: [
        {
          type: "body",
          parameters: variables.map((v) => ({ type: "text", text: v })),
        },
      ],
    },
  };

  try {
    const res = await fetch(`${META_API_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[whatsapp] Error sending template "${templateName}":`, err);
    }
  } catch (err) {
    console.error(`[whatsapp] Network error sending template "${templateName}":`, err);
  }
}

export function formatWaDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatWaTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
