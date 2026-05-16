import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { logger } from "./lib/logger";
import { errorHandler } from "./lib/errors";
import { tracingMiddleware } from "./lib/tracing";
import { ingestRouter } from "./api/ingest.router";
import { healthRouter } from "./api/health.router";
import { pushRouter } from "./api/push.router";
import { startMQTTSubscriber } from "./lib/mqtt";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      config.nodeEnv === "production"
        ? (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean)
        : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Trace-ID"],
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Request tracing (before rate limiting to trace all requests)
app.use(tracingMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute per IP (handles 1000+ pipes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { error: "Ingestion rate limit exceeded." },
});

app.use(limiter);

// Routes
app.use("/health", healthRouter);
app.use("/ingest", ingestLimiter, ingestRouter);
app.use("/push", pushRouter);

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`🚀 Backend server running on port ${config.port}`, {
    env: config.nodeEnv,
    mlService: config.ml.serviceUrl,
  });

  // Start MQTT subscriber after server is up
  startMQTTSubscriber();
});

export default app;
