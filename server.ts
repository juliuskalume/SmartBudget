import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Groq AI Categorization
  app.post("/api/ai/categorize", async (req, res) => {
    const { smsText } = req.body;
    if (!process.env.GROQ_API_KEY) {
      return res.json({ merchant: "Unknown", amount: 0, category: "Other" });
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a financial assistant. Extract transaction details (merchant, amount, category) from SMS. Categories: Supermarket, Transport, Entertainment, Bills, Education, Other. Return ONLY JSON.",
          },
          {
            role: "user",
            content: smsText,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("Groq Error:", error);
      res.status(500).json({ error: "AI processing failed" });
    }
  });

  // Groq AI Financial Advice
  app.post("/api/ai/advice", async (req, res) => {
    const { data } = req.body;
    if (!process.env.GROQ_API_KEY) {
      return res.json([]);
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Based on financial data, provide 3 personalized advice cards. Each card must have: type (success, warning, error), title, and description. Return ONLY a JSON array of objects.",
          },
          {
            role: "user",
            content: JSON.stringify(data),
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content || "{}";
      const result = JSON.parse(content);
      // Ensure we return an array even if Groq wraps it in an object
      const adviceArray = Array.isArray(result) ? result : (result.advice || result.recommendations || []);
      res.json(adviceArray);
    } catch (error) {
      console.error("Groq Error:", error);
      res.status(500).json({ error: "AI advice failed" });
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
