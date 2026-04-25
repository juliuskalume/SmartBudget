import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { categorizeSmsText, generateAdviceCards } from "./server/ai.js";
import { deleteAuthenticatedAccount } from "./server/account.js";
import { scanEmailInbox } from "./server/email.js";
import { buildBalancePurchasingPowerShift } from "./server/inflation.js";
import { buildInvestmentRecommendations, buildMarketInsights, buildWhatIfScenario } from "./server/markets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Groq AI Categorization
  app.post("/api/ai/categorize", async (req, res) => {
    const messageText = typeof req.body?.messageText === "string" ? req.body.messageText : req.body?.smsText;
    try {
      const result = await categorizeSmsText(typeof messageText === "string" ? messageText : "");
      res.json(result);
    } catch (error) {
      console.error("Groq Error:", error);
      res.status(500).json({ error: "AI processing failed" });
    }
  });

  // Groq AI Financial Advice
  app.post("/api/ai/advice", async (req, res) => {
    const { data } = req.body;

    try {
      const result = await generateAdviceCards(data);
      res.json(result);
    } catch (error) {
      console.error("Groq Error:", error);
      res.status(500).json({ error: "AI advice failed" });
    }
  });

  app.get("/api/markets/what-if", async (req, res) => {
    const period = typeof req.query.period === "string" ? req.query.period : "3m";
    const amount = Number(req.query.amount);

    try {
      const result = await buildWhatIfScenario(period as "1m" | "3m" | "6m" | "1y", amount);
      res.json(result);
    } catch (error) {
      console.error("Market what-if error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unable to build market scenario" });
    }
  });

  app.post("/api/markets/recommendations", async (req, res) => {
    try {
      const amount = Number(req.body?.amount);
      const summary = req.body?.summary ?? {};
      const result = await buildInvestmentRecommendations({
        amount,
        summary: {
          healthScore: Number(summary.healthScore) || 0,
          savingsRate: Number(summary.savingsRate) || 0,
          cashFlow: Number(summary.cashFlow) || 0,
          netWorth: Number(summary.netWorth) || 0,
        },
      });
      res.json(result);
    } catch (error) {
      console.error("Market recommendations error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unable to build investment suggestions" });
    }
  });

  app.post("/api/markets/insights", async (req, res) => {
    try {
      const summary = req.body?.summary ?? {};
      const result = await buildMarketInsights({
        amount: Number(req.body?.amount),
        summary: {
          healthScore: Number(summary.healthScore) || 0,
          savingsRate: Number(summary.savingsRate) || 0,
          cashFlow: Number(summary.cashFlow) || 0,
          netWorth: Number(summary.netWorth) || 0,
        },
      });
      res.json(result);
    } catch (error) {
      console.error("Market insights error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unable to build market insights" });
    }
  });

  app.post("/api/account/delete", async (req, res) => {
    try {
      const authorization = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
      await deleteAuthenticatedAccount(authorization);
      res.json({ ok: true });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unable to delete account" });
    }
  });

  app.post("/api/email/scan", async (req, res) => {
    try {
      const result = await scanEmailInbox({
        emailAddress: typeof req.body?.emailAddress === "string" ? req.body.emailAddress : "",
        appPassword: typeof req.body?.appPassword === "string" ? req.body.appPassword : "",
        host: typeof req.body?.host === "string" ? req.body.host : undefined,
        port: Number(req.body?.port),
        mailbox: typeof req.body?.mailbox === "string" ? req.body.mailbox : undefined,
        limit: Number(req.body?.limit),
        afterUid: Number(req.body?.afterUid),
        uidValidity: typeof req.body?.uidValidity === "string" ? req.body.uidValidity : undefined,
      });
      res.json(result);
    } catch (error) {
      const statusCode =
        typeof (error as { statusCode?: unknown } | null)?.statusCode === "number"
          ? ((error as { statusCode: number }).statusCode)
          : 500;
      console.error("Email scan route error:", error);
      res.status(statusCode).json({ error: error instanceof Error ? error.message : "Unable to scan the email inbox" });
    }
  });

  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const base = typeof req.query.base === "string" ? req.query.base : "USD";
      const quotesParam = typeof req.query.quotes === "string" ? req.query.quotes : "";
      const quotes = quotesParam.split(",").filter((q) => q.trim());

      const apiKey = process.env.EXCHANGERATE_API_KEY?.trim();
      if (!apiKey) {
        res.status(500).json({ error: "Exchange Rate API key is not configured." });
        return;
      }

      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Exchange Rate API request failed (${response.status}).`);
      }

      const payload = await response.json();
      const rates = typeof payload?.conversion_rates === "object" && payload.conversion_rates ? payload.conversion_rates : {};

      res.json({
        base,
        rates: Object.fromEntries(Object.entries(rates).filter(([_, value]) => typeof value === "number")),
        source: "exchangerate-api",
      });
    } catch (error) {
      console.error("Exchange rates error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unable to fetch exchange rates" });
    }
  });

  app.get("/api/inflation/current", async (req, res) => {
    try {
      const countryCode = typeof req.query.country === "string" ? req.query.country : "";
      const result = await buildBalancePurchasingPowerShift(countryCode);

      if (!result) {
        res.status(404).json({ error: "Inflation data is unavailable for this country." });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Inflation error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unable to load inflation data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
