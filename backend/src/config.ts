import dotenv from "dotenv";
dotenv.config();

export const config = {
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
    brokerUrl: process.env.MQTT_ACTIVE_URL ?? process.env.MQTT_BROKER_URL ?? "mqtt://broker.hivemq.com:1883",
    wsUrl:     process.env.MQTT_BROKER_WS_URL  ?? "ws://broker.hivemq.com:8000/mqtt",
    tlsUrl:    process.env.MQTT_BROKER_TLS_URL ?? "mqtts://broker.hivemq.com:8883",
    wssUrl:    process.env.MQTT_BROKER_WSS_URL ?? "wss://broker.hivemq.com:8884/mqtt",
    topic:     process.env.MQTT_TOPIC    ?? "stethoscope/readings",
    username:  process.env.MQTT_USERNAME ?? "",
    password:  process.env.MQTT_PASSWORD ?? "",
  },
  alerts: {
    leakThreshold: parseFloat(process.env.ALERT_LEAK_THRESHOLD ?? "0.7"),
    severityThreshold: parseInt(process.env.ALERT_SEVERITY_THRESHOLD ?? "30", 10),
  },
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;
