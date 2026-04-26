import nodemailer from 'nodemailer';

/**
 * Email transport — three modes:
 *
 * 1. SMTP (production): set SMTP_HOST/PORT/USER/PASS env vars.
 * 2. JSON (CI / local without SMTP): NODEMAIL_TRANSPORT=json — emails are
 *    serialized to stdout. This is the default in dev/test so no real
 *    network calls happen.
 * 3. noop (silent): NODEMAIL_TRANSPORT=noop — emails are simply dropped.
 */

type Transport = nodemailer.Transporter | null;

let transport: Transport | undefined;

function getTransport(): Transport {
  if (transport !== undefined) return transport;
  const mode = process.env.NODEMAIL_TRANSPORT ?? (process.env.SMTP_HOST ? 'smtp' : 'json');
  if (mode === 'noop') {
    transport = null;
  } else if (mode === 'smtp') {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  } else {
    // JSON transport: writes to its own stream, doesn't touch the network.
    transport = nodemailer.createTransport({ jsonTransport: true });
  }
  return transport;
}

const FROM = process.env.MAIL_FROM ?? 'Abu-Rabee <noreply@aburabee.local>';

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const t = getTransport();
  if (!t) return; // noop mode
  const info = await t.sendMail({ from: FROM, ...opts });
  if (process.env.NODEMAIL_TRANSPORT === 'json' || (!process.env.SMTP_HOST && process.env.NODE_ENV !== 'test')) {
    // eslint-disable-next-line no-console
    console.log('[mail]', info.messageId ?? '', '→', opts.to, '·', opts.subject);
  }
}
