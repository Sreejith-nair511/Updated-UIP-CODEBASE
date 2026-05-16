"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
const logger_1 = require("./lib/logger");
const errors_1 = require("./lib/errors");
const tracing_1 = require("./lib/tracing");
const ingest_router_1 = require("./api/ingest.router");
const health_router_1 = require("./api/health.router");
const push_router_1 = require("./api/push.router");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.nodeEnv === "production"
        ? (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean)
        : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Trace-ID"],
}));
// Body parsing
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request tracing (before rate limiting to trace all requests)
app.use(tracing_1.tracingMiddleware);
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute per IP (handles 1000+ pipes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down." },
});
const ingestLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 500,
    message: { error: "Ingestion rate limit exceeded." },
});
app.use(limiter);
// Routes
app.use("/health", health_router_1.healthRouter);
app.use("/ingest", ingestLimiter, ingest_router_1.ingestRouter);
app.use("/push", push_router_1.pushRouter);
// 404 handler
app.use("*", (_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});
// Global error handler
app.use(errors_1.errorHandler);
app.listen(config_1.config.port, () => {
    logger_1.logger.info(`🚀 Backend server running on port ${config_1.config.port}`, {
        env: config_1.config.nodeEnv,
        mlService: config_1.config.ml.serviceUrl,
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map