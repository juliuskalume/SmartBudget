import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export type EmailScanRequest = {
  emailAddress: string;
  appPassword: string;
  host?: string;
  port?: number;
  mailbox?: string;
  limit?: number;
};

export type EmailInboxMessage = {
  uid: string;
  messageId: string;
  date: number;
  subject: string;
  from: string;
  text: string;
};

const DEFAULT_MAILBOX = "INBOX";
const DEFAULT_IMAP_PORT = 993;
const DEFAULT_SCAN_LIMIT = 40;

const PROVIDER_PRESETS = [
  { match: /(?:^|\.)gmail\.com$|(?:^|\.)googlemail\.com$/i, host: "imap.gmail.com", provider: "Gmail" },
  { match: /(?:^|\.)outlook\.com$|(?:^|\.)hotmail\.com$|(?:^|\.)live\.com$|(?:^|\.)msn\.com$/i, host: "outlook.office365.com", provider: "Outlook" },
  { match: /(?:^|\.)yahoo\./i, host: "imap.mail.yahoo.com", provider: "Yahoo" },
  { match: /(?:^|\.)icloud\.com$|(?:^|\.)me\.com$|(?:^|\.)mac\.com$/i, host: "imap.mail.me.com", provider: "iCloud" },
  { match: /(?:^|\.)aol\.com$/i, host: "imap.aol.com", provider: "AOL" },
];

const FINANCIAL_KEYWORDS = [
  "account",
  "amount",
  "available balance",
  "bank",
  "card",
  "cash withdrawal",
  "charge",
  "charged",
  "credited",
  "debited",
  "deposit",
  "payment",
  "purchase",
  "receipt",
  "refund",
  "statement",
  "transaction",
  "transfer",
  "withdrawal",
];

const IGNORE_KEYWORDS = [
  "unsubscribe",
  "newsletter",
  "promo",
  "promotion",
  "coupon",
  "discount",
  "sale",
  "shop now",
  "limited time",
];

function compactText(input: string) {
  return input.replace(/\u00a0/g, " ").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function limitText(input: string, max = 4000) {
  return input.length > max ? input.slice(0, max) : input;
}

function amountPattern(input: string) {
  return /(?:\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:tl|try|usd|\$|eur|gbp|kes|ngn|ugx|inr|[a-z]{3})/i.test(input);
}

function looksLikeFinancialEmail(subject: string, text: string, from: string) {
  const normalized = `${subject}\n${text}\n${from}`.toLowerCase();
  const hasFinancialSignal = FINANCIAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const looksLikePromotion = IGNORE_KEYWORDS.some((keyword) => normalized.includes(keyword));

  if (!hasFinancialSignal || !amountPattern(normalized)) {
    return false;
  }

  if (looksLikePromotion && !/(?:receipt|transaction|credited|debited|charged|refund|withdrawal|deposit|payment)/i.test(normalized)) {
    return false;
  }

  return true;
}

function getProviderPreset(emailAddress: string) {
  const domain = emailAddress.split("@")[1]?.trim().toLowerCase() ?? "";
  return PROVIDER_PRESETS.find((entry) => entry.match.test(domain)) ?? null;
}

function resolveMailbox(input: string | undefined) {
  const mailbox = input?.trim();
  return mailbox || DEFAULT_MAILBOX;
}

function resolveLimit(input: number | undefined) {
  if (!Number.isFinite(input) || !input) {
    return DEFAULT_SCAN_LIMIT;
  }

  return Math.max(5, Math.min(100, Math.floor(input)));
}

function resolveConnection(input: EmailScanRequest) {
  const emailAddress = input.emailAddress.trim().toLowerCase();
  const host = input.host?.trim();
  const port = Number.isFinite(Number(input.port)) && Number(input.port) > 0 ? Number(input.port) : DEFAULT_IMAP_PORT;
  const provider = getProviderPreset(emailAddress);

  if (host) {
    return {
      host,
      port,
      provider: "Custom IMAP",
    };
  }

  if (provider) {
    return {
      host: provider.host,
      port,
      provider: provider.provider,
    };
  }

  throw new Error("Enter a custom IMAP host for this email provider.");
}

function toBuffer(source: string | Buffer | undefined) {
  if (Buffer.isBuffer(source)) {
    return source;
  }

  if (typeof source === "string") {
    return Buffer.from(source);
  }

  return Buffer.alloc(0);
}

function buildSenderLabel(from: string, envelopeFrom: string) {
  const compact = compactText(from);
  return compact || compactText(envelopeFrom);
}

export async function scanEmailInbox(input: EmailScanRequest): Promise<{
  mailbox: string;
  provider: string;
  resolvedHost: string;
  messages: EmailInboxMessage[];
}> {
  const emailAddress = input.emailAddress.trim().toLowerCase();
  const appPassword = input.appPassword.trim();
  const mailbox = resolveMailbox(input.mailbox);
  const limit = resolveLimit(input.limit);

  if (!emailAddress || !emailAddress.includes("@")) {
    throw new Error("Enter a valid email address for inbox scanning.");
  }

  if (!appPassword) {
    throw new Error("Enter an app password before scanning the inbox.");
  }

  const connection = resolveConnection(input);
  const client = new ImapFlow({
    host: connection.host,
    port: connection.port,
    secure: true,
    auth: {
      user: emailAddress,
      pass: appPassword,
    },
    logger: false,
  });

  let lock: Awaited<ReturnType<ImapFlow["getMailboxLock"]>> | null = null;

  try {
    await client.connect();
    lock = await client.getMailboxLock(mailbox);

    const exists = client.mailbox ? client.mailbox.exists ?? 0 : 0;
    if (!exists) {
      return {
        mailbox,
        provider: connection.provider,
        resolvedHost: connection.host,
        messages: [],
      };
    }

    const start = Math.max(1, exists - limit + 1);
    const messages: EmailInboxMessage[] = [];

    for await (const message of client.fetch(`${start}:*`, { uid: true, envelope: true, source: true, internalDate: true })) {
      const parsed = await simpleParser(toBuffer(message.source));
      const subject = compactText(parsed.subject ?? message.envelope?.subject ?? "");
      const from = buildSenderLabel(parsed.from?.text ?? "", message.envelope?.from?.map((entry) => entry.address ?? entry.name ?? "").join(", ") ?? "");
      const text = limitText(compactText(parsed.text ?? parsed.html?.toString() ?? ""));

      if (!text || !looksLikeFinancialEmail(subject, text, from)) {
        continue;
      }

      const envelopeMessageId = message.envelope?.messageId?.trim();
      const parsedMessageId = typeof parsed.messageId === "string" ? parsed.messageId.trim() : "";
      const messageId = parsedMessageId || envelopeMessageId || `${mailbox}:${message.uid}`;
      const receivedAt = message.internalDate instanceof Date ? message.internalDate.getTime() : Date.now();

      messages.push({
        uid: `${message.uid}`,
        messageId,
        date: receivedAt,
        subject,
        from,
        text,
      });
    }

    messages.sort((left, right) => right.date - left.date);

    return {
      mailbox,
      provider: connection.provider,
      resolvedHost: connection.host,
      messages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to scan the email inbox.";

    if (/auth|login|password|invalid credentials/i.test(message)) {
      throw new Error("Inbox login failed. Use your email app password and verify IMAP access is enabled.");
    }

    if (/mailbox/i.test(message)) {
      throw new Error("The requested mailbox could not be opened. Try INBOX or confirm the mailbox name.");
    }

    throw new Error(message);
  } finally {
    lock?.release();
    await client.logout().catch(() => {
      client.close();
    });
  }
}
