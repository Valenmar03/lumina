const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.SMTP_FROM ?? "Caleio <noreply@caleio.app>";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log(`[email:dev] To: ${to} | Subject: ${subject}`);
    return;
  }

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

// ─── Appointment notifications ────────────────────────────────────────────────

interface AppointmentEmailData {
  clientName: string;
  professionalName: string;
  serviceName: string;
  date: string; // "dd/MM/yyyy"
  time: string; // "HH:mm"
  businessName: string;
  reason?: string;
}

function appointmentDetailsTable(data: AppointmentEmailData): string {
  return `
    <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-top: 16px;">
      <tr>
        <td style="padding: 6px 0; color: #64748b; width: 40%; vertical-align: top;">Servicio</td>
        <td style="padding: 6px 0; font-weight: 500; color: #1e293b;">${data.serviceName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Profesional</td>
        <td style="padding: 6px 0; font-weight: 500; color: #1e293b;">${data.professionalName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Fecha</td>
        <td style="padding: 6px 0; font-weight: 500; color: #1e293b;">${data.date}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Hora</td>
        <td style="padding: 6px 0; font-weight: 500; color: #1e293b;">${data.time}</td>
      </tr>
    </table>
    <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
      Este mensaje fue enviado por ${data.businessName} a través de Caleio.
    </p>
  `;
}

function appointmentEmailWrapper(body: string): string {
  return `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">${body}</div>`;
}

export async function sendAppointmentConfirmed(to: string, data: AppointmentEmailData): Promise<void> {
  try {
    await sendEmail(
      to,
      `Tu turno está confirmado — ${data.businessName}`,
      appointmentEmailWrapper(`
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Turno confirmado</h2>
        <p style="color: #475569; margin-bottom: 4px;">Hola ${data.clientName},</p>
        <p style="color: #475569;">Tu turno ha sido confirmado.</p>
        ${appointmentDetailsTable(data)}
      `)
    );
  } catch (err) {
    console.error("[email] sendAppointmentConfirmed error:", err);
  }
}

export async function sendAppointmentCanceled(to: string, data: AppointmentEmailData): Promise<void> {
  try {
    await sendEmail(
      to,
      `Tu turno fue cancelado — ${data.businessName}`,
      appointmentEmailWrapper(`
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Turno cancelado</h2>
        <p style="color: #475569; margin-bottom: 4px;">Hola ${data.clientName},</p>
        <p style="color: #475569;">Tu turno ha sido cancelado.</p>
        ${data.reason ? `<p style="color: #475569; margin-top: 8px;"><strong>Motivo:</strong> ${data.reason}</p>` : ""}
        ${appointmentDetailsTable(data)}
      `)
    );
  } catch (err) {
    console.error("[email] sendAppointmentCanceled error:", err);
  }
}

export async function sendAppointmentModified(to: string, data: AppointmentEmailData): Promise<void> {
  try {
    await sendEmail(
      to,
      `Tu turno fue modificado — ${data.businessName}`,
      appointmentEmailWrapper(`
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Turno modificado</h2>
        <p style="color: #475569; margin-bottom: 4px;">Hola ${data.clientName},</p>
        <p style="color: #475569;">Los datos de tu turno fueron actualizados.</p>
        ${appointmentDetailsTable(data)}
      `)
    );
  } catch (err) {
    console.error("[email] sendAppointmentModified error:", err);
  }
}

export async function sendAppointmentReminder(to: string, data: AppointmentEmailData): Promise<void> {
  try {
    await sendEmail(
      to,
      `Recordatorio de turno — ${data.businessName}`,
      appointmentEmailWrapper(`
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Recordatorio de turno</h2>
        <p style="color: #475569; margin-bottom: 4px;">Hola ${data.clientName},</p>
        <p style="color: #475569;">Te recordamos que tenés un turno programado.</p>
        ${appointmentDetailsTable(data)}
      `)
    );
  } catch (err) {
    console.error("[email] sendAppointmentReminder error:", err);
  }
}

export async function sendNewAppointmentOwner(to: string, data: AppointmentEmailData): Promise<void> {
  try {
    await sendEmail(
      to,
      `Nueva reserva — ${data.clientName}`,
      appointmentEmailWrapper(`
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Nueva reserva recibida</h2>
        <p style="color: #475569;">${data.clientName} agendó un turno.</p>
        ${appointmentDetailsTable(data)}
      `)
    );
  } catch (err) {
    console.error("[email] sendNewAppointmentOwner error:", err);
  }
}
