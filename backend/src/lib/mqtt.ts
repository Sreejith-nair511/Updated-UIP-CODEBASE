/**
 * MQTT Subscriber — HiveMQ Integration
 * =====================================
 * Connects to HiveMQ broker, subscribes to sensor topics,
 * and pipes every message through the full ML inference pipeline.
 *
 * Topic structure:
 *   stethoscope/readings          — single reading (ESP32 default)
 *   stethoscope/readings/<pipeId> — pipe-specific topic
 *   stethoscope/+/readings        — zone-scoped readings
 */

import mqtt, { MqttClient, IClientOptions } from "mqtt";
import { config } from "../config";
import { logger } from "./logger";
import { processReading } from "../services/ingest.service";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MQTTReadingPayload {
  pipe_id: string;
  zone_id: string;
  reading_date: string;
  reading_time: string;
  pressure_bar: number;
  flow_lpm: number;
  frequency_hz: number;
  temp_c?: number;
  humidity_pct?: number;
  valve_status?: string;
  anomaly_score: number;
  dominant_frequency?: number;
  signal?: number[];
  sample_rate?: number;
}

// ── State ─────────────────────────────────────────────────────────────────────

let mqttClient: MqttClient | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 5000;

// ── Connection ────────────────────────────────────────────────────────────────

export function startMQTTSubscriber(): void {
  const brokerUrl = config.mqtt.brokerUrl;

  logger.info("Connecting to MQTT broker", { brokerUrl });

  const options: IClientOptions = {
    clientId: `digital-stethoscope-backend-${Date.now()}`,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: RECONNECT_DELAY_MS,
    keepalive: 60,
    // HiveMQ credentials (if set)
    ...(config.mqtt.username && { username: config.mqtt.username }),
    ...(config.mqtt.password && { password: config.mqtt.password }),
    // TLS for HiveMQ Cloud (wss:// or mqtts://)
    ...(brokerUrl.startsWith("wss://") || brokerUrl.startsWith("mqtts://")
      ? { rejectUnauthorized: true }
      : {}),
  };

  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on("connect", () => {
    reconnectAttempts = 0;
    logger.info("✅ MQTT connected to HiveMQ broker", { brokerUrl });

    // Subscribe to all sensor topics
    const topics = [
      config.mqtt.topic,                    // stethoscope/readings
      `${config.mqtt.topic}/+`,             // stethoscope/readings/<pipeId>
      "stethoscope/+/readings",             // stethoscope/<zone>/readings
    ];

    topics.forEach((topic) => {
      mqttClient!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          logger.error("MQTT subscribe failed", { topic, error: err.message });
        } else {
          logger.info("MQTT subscribed", { topic });
        }
      });
    });
  });

  mqttClient.on("message", handleMQTTMessage);

  mqttClient.on("error", (err) => {
    logger.error("MQTT error", { error: err.message });
  });

  mqttClient.on("reconnect", () => {
    reconnectAttempts++;
    logger.warn("MQTT reconnecting...", {
      attempt: reconnectAttempts,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
    });

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error("MQTT max reconnect attempts reached — giving up");
      mqttClient?.end(true);
    }
  });

  mqttClient.on("close", () => {
    logger.warn("MQTT connection closed");
  });

  mqttClient.on("offline", () => {
    logger.warn("MQTT client offline");
  });
}

// ── Message Handler ───────────────────────────────────────────────────────────

async function handleMQTTMessage(topic: string, rawMessage: Buffer): Promise<void> {
  let payload: MQTTReadingPayload;

  try {
    payload = JSON.parse(rawMessage.toString()) as MQTTReadingPayload;
  } catch {
    logger.warn("MQTT: invalid JSON payload", { topic, raw: rawMessage.toString().slice(0, 100) });
    return;
  }

  // Validate required fields
  if (!payload.pipe_id || !payload.zone_id || payload.pressure_bar === undefined) {
    logger.warn("MQTT: missing required fields", { topic, pipe_id: payload.pipe_id });
    return;
  }

  // Fill defaults
  const now = new Date();
  const reading = {
    pipe_id: payload.pipe_id,
    zone_id: payload.zone_id,
    reading_date: payload.reading_date ?? now.toISOString().split("T")[0],
    reading_time: payload.reading_time ?? now.toTimeString().split(" ")[0],
    pressure_bar: Number(payload.pressure_bar),
    flow_lpm: Number(payload.flow_lpm ?? 0),
    frequency_hz: Number(payload.frequency_hz ?? 0),
    temp_c: Number(payload.temp_c ?? 22.0),
    humidity_pct: Number(payload.humidity_pct ?? 55.0),
    valve_status: (payload.valve_status as "OPEN" | "CLOSED") ?? "OPEN",
    anomaly_score: Number(payload.anomaly_score ?? 0),
    dominant_frequency: payload.dominant_frequency,
    signal: payload.signal,
    sample_rate: payload.sample_rate,
  };

  try {
    const result = await processReading(reading);
    logger.info("MQTT reading processed", {
      topic,
      pipe_id: reading.pipe_id,
      reading_id: result.reading_id,
      leak_class: result.prediction.leak_class,
      severity: result.prediction.severity_estimate,
      alert: result.alert_triggered,
    });
  } catch (err) {
    logger.error("MQTT reading processing failed", {
      topic,
      pipe_id: reading.pipe_id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── Publish helper (for testing / sending from backend) ──────────────────────

export function publishReading(payload: MQTTReadingPayload): void {
  if (!mqttClient?.connected) {
    logger.warn("MQTT not connected — cannot publish");
    return;
  }
  const topic = `${config.mqtt.topic}/${payload.pipe_id}`;
  mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 });
}

export function getMQTTStatus(): { connected: boolean; broker: string; reconnectAttempts: number } {
  return {
    connected: mqttClient?.connected ?? false,
    broker: config.mqtt.brokerUrl,
    reconnectAttempts,
  };
}

export function stopMQTTSubscriber(): void {
  if (mqttClient) {
    mqttClient.end(true);
    mqttClient = null;
    logger.info("MQTT subscriber stopped");
  }
}
