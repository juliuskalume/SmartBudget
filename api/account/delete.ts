import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteAuthenticatedAccount } from "../../server/account";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authorization = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
    await deleteAuthenticatedAccount(authorization);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to delete account" });
  }
}
