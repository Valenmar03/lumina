const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = process.env.SMTP_FROM ?? "Caleio <noreply@caleio.app>";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${JSON.stringify(body)}`);
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${APP_URL}/verificar-email?token=${token}`;

  await sendEmail(email, "Confirmá tu cuenta en Caleio", `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Confirmá tu cuenta</h2>
      <p style="color: #475569; margin-bottom: 24px;">
        Hacé click en el botón para activar tu cuenta en Caleio. El link vence en 24 horas.
      </p>
      <a href="${url}"
         style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px;
                border-radius: 8px; text-decoration: none; font-weight: 500;">
        Confirmar cuenta
      </a>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
        Si no creaste una cuenta en Caleio, podés ignorar este mail.
      </p>
    </div>
  `);
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${APP_URL}/resetear-password?token=${token}`;

  await sendEmail(email, "Resetear contraseña — Caleio", `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Resetear contraseña</h2>
      <p style="color: #475569; margin-bottom: 24px;">
        Recibimos una solicitud para resetear la contraseña de tu cuenta. El link vence en 1 hora.
      </p>
      <a href="${url}"
         style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px;
                border-radius: 8px; text-decoration: none; font-weight: 500;">
        Resetear contraseña
      </a>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
        Si no pediste esto, podés ignorar este mail. Tu contraseña no cambiará.
      </p>
    </div>
  `);
}
