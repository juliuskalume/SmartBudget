import type { VercelRequest, VercelResponse } from "@vercel/node";
import { scanEmailInbox } from "../../server/email.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await scanEmailInbox({
      emailAddress: typeof req.body?.emailAddress === "string" ? req.body.emailAddress : "",
      appPassword: typeof req.body?.appPassword === "string" ? req.body.appPassword : "",
      host: typeof req.body?.host === "string" ? req.body.host : undefined,
      port: Number(req.body?.port),
      mailbox: typeof req.body?.mailbox === "string" ? req.body.mailbox : undefined,
      limit: Number(req.body?.limit),
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to scan the email inbox" });
  }
}
