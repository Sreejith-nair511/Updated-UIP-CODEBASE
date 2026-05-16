"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT ?? "4000", 10),
    supabase: {
        url: process.env.SUPABASE_URL ?? "",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    },
    clerk: {
        secretKey: process.env.CLERK_SECRET_KEY ?? "",
    },
    ml: {
        serviceUrl: process.env.ML_SERVICE_URL ?? "http://localhost:8000",
    },
    mqtt: {
        brokerUrl: process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883",
        topic: process.env.MQTT_TOPIC ?? "stethoscope/readings",
    },
    alerts: {
        leakThreshold: parseFloat(process.env.ALERT_LEAK_THRESHOLD ?? "0.7"),
        severityThreshold: parseInt(process.env.ALERT_SEVERITY_THRESHOLD ?? "30", 10),
    },
    nodeEnv: process.env.NODE_ENV ?? "development",
};
//# sourceMappingURL=config.js.map