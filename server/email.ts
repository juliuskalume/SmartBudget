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

type EmailScanError = Error & {
  statusCode?: number;
};

type ImapErrorDetails = {
  message: string;
  responseText: string;
  response: string;
  responseStatus: string;
  serverResponseCode: string;
  code: string;
  authenticationFailed: boolean;
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

function normalizeErrorText(value: unknown) {
  return typeof value === "string" ? compactText(value) : "";
}

function createEmailScanError(message: string, statusCode = 500): EmailScanError {
  const error = new Error(message) as EmailScanError;
  error.statusCode = statusCode;
  return error;
}

function getImapErrorDetails(error: unknown): ImapErrorDetails {
  if (!error || typeof error !== "object") {
    return {
      message: "",
      responseText: "",
      response: "",
      responseStatus: "",
      serverResponseCode: "",
      code: "",
      authenticationFailed: false,
    };
  }

  const value = error as Partial<{
    message: unknown;
    responseText: unknown;
    response: unknown;
    responseStatus: unknown;
    serverResponseCode: unknown;
    code: unknown;
    authenticationFailed: unknown;
  }>;

  return {
    message: normalizeErrorText(value.message),
    responseText: normalizeErrorText(value.responseText),
    response: normalizeErrorText(value.response),
    responseStatus: normalizeErrorText(value.responseStatus).toUpperCase(),
    serverResponseCode: normalizeErrorText(value.serverResponseCode).toUpperCase(),
    code: normalizeErrorText(value.code).toUpperCase(),
    authenticationFailed: Boolean(value.authenticationFailed),
  };
}

function buildErrorSearchText(details: ImapErrorDetails) {
  return [details.message, details.responseText, details.response, details.responseStatus, details.serverResponseCode, details.code]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function describeEmailScanFailure(error: unknown) {
  const details = getImapErrorDetails(error);
  const searchText = buildErrorSearchText(details);

  if (/enter a valid email address|enter an app password|enter a custom imap host/i.test(searchText)) {
    return {
      statusCode: 400,
      publicMessage: details.message || "Check the email inbox settings and try again.",
      details,
    };
  }

  if (
    details.authenticationFailed ||
    details.serverResponseCode === "AUTHENTICATIONFAILED" ||
    details.serverResponseCode === "AUTHORIZATIONFAILED" ||
    /auth|login|invalid credentials|username and password not accepted|app password|web browser/i.test(searchText)
  ) {
    return {
      statusCode: 401,
      publicMessage: "Inbox login failed. Use your email app password and verify IMAP access is enabled.",
      details,
    };
  }

  if (
    details.serverResponseCode === "NONEXISTENT" ||
    /mailbox|cannot select|does not exist|unknown mailbox/i.test(searchText)
  ) {
    return {
      statusCode: 400,
      publicMessage: "The requested mailbox could not be opened. Try INBOX or confirm the mailbox name.",
      details,
    };
  }

  if (details.code === "ETHROTTLE" || /throttled|backoff|rate limit/i.test(searchText)) {
    return {
      statusCode: 429,
      publicMessage: "The email provider is throttling inbox scans. Wait a minute and try again.",
      details,
    };
  }

  if (
    details.code === "ETIMEDOUT" ||
    details.code === "ECONNREFUSED" ||
    details.code === "ECONNRESET" ||
    details.code === "ENOTFOUND" ||
    details.code === "EAI_AGAIN" ||
    details.code === "EHOSTUNREACH" ||
    /timed out|connect|connection|socket|network|unreachable|dns/i.test(searchText)
  ) {
    return {
      statusCode: 502,
      publicMessage: "Couldn't reach the IMAP server. Check the host, port, or provider IMAP settings and try again.",
      details,
    };
  }

  if (/command failed/i.test(searchText)) {
    return {
      statusCode: 400,
      publicMessage: "The email provider rejected this IMAP request. Verify the mailbox settings, IMAP access, and app password, then try again.",
      details,
    };
  }

  return {
    statusCode: 500,
    publicMessage: details.message || "Unable to scan the email inbox.",
    details,
  };
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
    const failure = describeEmailScanFailure(error);
    console.error("Email inbox scan failed", {
      emailDomain: emailAddress.split("@")[1] ?? "",
      host: connection.host,
      port: connection.port,
      mailbox,
      provider: connection.provider,
      code: failure.details.code || null,
      serverResponseCode: failure.details.serverResponseCode || null,
      responseStatus: failure.details.responseStatus || null,
      responseText: failure.details.responseText || null,
      response: failure.details.response || null,
      message: failure.details.message || null,
    });
    throw createEmailScanError(failure.publicMessage, failure.statusCode);
  } finally {
    lock?.release();
    await client.logout().catch(() => {
      client.close();
    });
  }
}
