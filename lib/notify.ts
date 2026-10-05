import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { COMPANY } from './company';

// Operator alerts by email. Off until SMTP_HOST, SMTP_USER and SMTP_PASS are set
// (Zoho: smtp.zoho.in, port 465, an app-specific password). Never throws: an alert
// failing must not break the user's action.
let transport: Transporter | null | undefined;

function getTransport() {
  if (transport !== undefined) return transport;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  transport = SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(process.env.SMTP_PORT || 465), secure: Number(process.env.SMTP_PORT || 465) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
    : null;
  return transport;
}

export async function alertOperator(subject: string, lines: (string | null | undefined)[]) {
  const t = getTransport();
  if (!t) return;
  try {
    await t.sendMail({
      from: `"${COMPANY.brand}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.ALERT_TO || COMPANY.email,
      subject: `[${COMPANY.brand}] ${subject}`,
      text: [...lines.filter(Boolean), '', `Admin console: ${COMPANY.site}/admin`].join('\n')
    });
  } catch (e) {
    console.error('[notify] alert failed:', (e as Error).message);
  }
}
