import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { categorizeSmsText, generateAdviceCards } from "./server/ai";

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
    const { smsText } = req.body;
    try {
      const result = await categorizeSmsText(typeof smsText === "string" ? smsText : "");
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
