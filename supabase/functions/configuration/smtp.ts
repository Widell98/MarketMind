export type SMTPConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  senderName: string;
  senderEmail: string;
};

const smtpConfig: SMTPConfig = {
  host: Deno.env.get('SMTP_HOST') ?? 'smtp.ionos.com',
  port: Number(Deno.env.get('SMTP_PORT') ?? '587'),
  user: Deno.env.get('SMTP_USER') ?? 'no-reply@market-mind.app',
  pass: Deno.env.get('SMTP_PASS') ?? '',
  senderName: Deno.env.get('SMTP_SENDER_NAME') ?? 'Market Mind',
  senderEmail: Deno.env.get('SMTP_SENDER_EMAIL') ?? 'no-reply@market-mind.app',
};

let connectionChecked = false;

export function getSMTPConfig(): SMTPConfig {
  return smtpConfig;
}

export async function verifySMTPConnection(config: SMTPConfig = smtpConfig): Promise<boolean> {
  if (!config.host || !config.port) {
    console.error('[SMTP] SMTP_HOST och SMTP_PORT måste vara konfigurerade.');
    return false;
  }

  try {
    const connection = await Deno.connect({ hostname: config.host, port: config.port });
    connection.close();
    return true;
  } catch (error) {
    console.error(`[SMTP] Kunde inte ansluta till ${config.host}:${config.port}. Kontrollera att servern svarar.`, error);
    return false;
  }
}

async function ensureSMTPReachable() {
  if (connectionChecked) {
    return;
  }

  connectionChecked = true;

  if (!smtpConfig.pass) {
    console.warn('[SMTP] SMTP_PASS saknas. E-postutskick kommer att misslyckas tills lösenordet är konfigurerat.');
  }

  await verifySMTPConnection();
}

ensureSMTPReachable();
