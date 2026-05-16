"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
exports.logger = winston_1.default.createLogger({
    level: config_1.config.nodeEnv === "production" ? "info" : "debug",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.errors({ stack: true }), config_1.config.nodeEnv === "production"
        ? winston_1.default.format.json()
        : winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`))),
    transports: [
        new winston_1.default.transports.Console(),
        ...(config_1.config.nodeEnv === "production"
            ? [
                new winston_1.default.transports.File({ filename: "logs/error.log", level: "error" }),
                new winston_1.default.transports.File({ filename: "logs/combined.log" }),
            ]
            : []),
    ],
});
//# sourceMappingURL=logger.js.map