import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import scanRoutes from "./routes/scan.js";
import analyzeRoutes from "./routes/analyze.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "5mb" }));

// Basic rate limiting so a single user can't hammer the AI/browser resources
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a few minutes and try again." }
});
app.use("/api", limiter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "uxguard-backend" });
});

app.use("/api/scan-url", scanRoutes);
app.use("/api/analyze-code", analyzeRoutes);

// Central error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong while processing your request." });
});

app.listen(PORT, () => {
  console.log(`UXGuard backend running on port ${PORT}`);
});
