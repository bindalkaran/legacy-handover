import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { COMPANY } from './company';

// Operator alerts by email, sent through Zoho ZeptoMail (SMTP). Off until SMTP_HOST,
// SMTP_USER and SMTP_PASS are set: for ZeptoMail India that is SMTP_HOST=smtp.zeptomail.in,
// SMTP_PORT=587, SMTP_USER=emailapikey, SMTP_PASS=<Send Mail token>, SMTP_FROM=hello@legacyhandover.com
// (the sending domain must be verified in ZeptoMail). Alerts arrive at ALERT_TO, default
// hello@legacyhandover.com (received in Zoho Mail Lite). Never throws.
let transport: Transporter | null | undefined;

function getTransport() {
  if (transport !== undefined) return transport;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  transport = SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT || 587) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
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
