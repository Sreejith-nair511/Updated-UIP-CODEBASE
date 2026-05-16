/**
 * Digital Stethoscope — ESP32 Firmware (MQTT Edition)
 * =====================================================
 * Samples acoustic signal, computes FFT features, then publishes
 * a reading to HiveMQ via MQTT instead of HTTP POST.
 *
 * Hardware:
 *   - ESP32 DevKit (any variant)
 *   - Piezo or MEMS microphone on GPIO34 (ADC1_CH6, input-only)
 *   - Optional: LED on GPIO2 for status
 *
 * Libraries required (install via Arduino Library Manager):
 *   - ArduinoJson  >= 6.x
 *   - PubSubClient >= 2.8  (by Nick O'Leary)
 *   - arduinoFFT   >= 2.x  (by Enrique Condes)
 *   - WiFi         (built-in ESP32)
 *
 * MQTT Topic: stethoscope/readings/<PIPE_ID>
 * Broker:     mqtt-dashboard.com:1883 (HiveMQ public broker)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <arduinoFFT.h>
#include <math.h>
#include "ntp_time.h"

// ── User configuration ────────────────────────────────────────────────────────
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

// HiveMQ Public Broker — free, no credentials needed
#define MQTT_BROKER      "broker.hivemq.com"
#define MQTT_PORT        1883              // TCP (use in firmware)
#define MQTT_PORT_WS     8000             // WebSocket
#define MQTT_PORT_TLS    8883             // TLS TCP
#define MQTT_PORT_WSS    8884             // TLS WebSocket (browser)
#define MQTT_CLIENT_ID   "stethoscope-P101"
#define MQTT_USERNAME    ""   // Leave empty for public broker
#define MQTT_PASSWORD    ""   // Leave empty for public broker

// Topic: stethoscope/readings/<pipe_id>
#define MQTT_TOPIC_BASE  "stethoscope/readings"

// Device identity
#define PIPE_ID          "P101"
#define ZONE_ID          "Z1"

// ADC / sampling
#define MIC_PIN          34          // GPIO34 — ADC1_CH6 (input only)
#define SAMPLE_RATE      4000        // Hz
#define SAMPLE_COUNT     512         // FFT window size (power of 2)
#define SEND_INTERVAL_MS 60000       // Publish every 60 seconds

// LED
#define LED_PIN          2

// ── Globals ───────────────────────────────────────────────────────────────────
double vReal[SAMPLE_COUNT];
double vImag[SAMPLE_COUNT];
ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, SAMPLE_COUNT, SAMPLE_RATE);

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastSendMs = 0;

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Serial.println("[BOOT] Digital Stethoscope ESP32 — MQTT Edition");
  connectWiFi();
  initNTP();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(2048);  // Larger buffer for JSON payload
  connectMQTT();
}

// ── Main loop ─────────────────────────────────────────────────────────────────
void loop() {
  // Keep MQTT connection alive
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  if (millis() - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = millis();
    blink(1);

    // 1. Sample signal
    sampleSignal();

    // 2. Compute FFT features
    float domFreq  = computeDominantFrequency();
    float centroid = computeSpectralCentroid();
    float energy   = computeSpectralEnergy();
    float anomaly  = computeAnomalyScore(domFreq, energy);

    // 3. Read sensors
    float pressure = readPressure();
    float flow     = readFlow();
    float temp     = readTemperature();
    float humidity = readHumidity();

    // 4. Build JSON payload
    String payload = buildPayload(domFreq, centroid, energy, anomaly,
                                  pressure, flow, temp, humidity);

    Serial.println("[PAYLOAD] " + payload);

    // 5. Publish to MQTT
    String topic = String(MQTT_TOPIC_BASE) + "/" + PIPE_ID;
    bool ok = mqttClient.publish(topic.c_str(), payload.c_str(), false);
    blink(ok ? 3 : 5);

    Serial.printf("[MQTT] Published to %s: %s\n", topic.c_str(), ok ? "OK" : "FAIL");
    Serial.printf("[DONE] domFreq=%.1f Hz  anomaly=%.3f\n", domFreq, anomaly);
  }
}

// ── WiFi ──────────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected — IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] FAILED — will retry on next loop");
  }
}

// ── MQTT ──────────────────────────────────────────────────────────────────────
void connectMQTT() {
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.printf("[MQTT] Connecting to %s:%d ...", MQTT_BROKER, MQTT_PORT);
    bool connected;
    if (strlen(MQTT_USERNAME) > 0) {
      connected = mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD);
    } else {
      connected = mqttClient.connect(MQTT_CLIENT_ID);
    }
    if (connected) {
      Serial.println(" connected!");
      // Subscribe to commands (optional)
      mqttClient.subscribe("stethoscope/commands/P101");
    } else {
      Serial.printf(" failed (rc=%d), retry in 5s\n", mqttClient.state());
      delay(5000);
      attempts++;
    }
  }
}

// ── Signal sampling ───────────────────────────────────────────────────────────
void sampleSignal() {
  const unsigned long sampleIntervalUs = 1000000UL / SAMPLE_RATE;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    unsigned long t0 = micros();
    int raw = analogRead(MIC_PIN);
    vReal[i] = (double)(raw - 2048);
    vImag[i] = 0.0;
    while (micros() - t0 < sampleIntervalUs) {}
  }
}

// ── FFT features ──────────────────────────────────────────────────────────────
float computeDominantFrequency() {
  FFT.windowing(FFTWindow::Hann, FFTDirection::Forward);
  FFT.compute(FFTDirection::Forward);
  FFT.complexToMagnitude();
  return (float)FFT.majorPeak();
}

float computeSpectralCentroid() {
  double sumWeighted = 0.0, sumMag = 0.0;
  double freqRes = (double)SAMPLE_RATE / SAMPLE_COUNT;
  for (int i = 1; i < SAMPLE_COUNT / 2; i++) {
    double freq = i * freqRes;
    sumWeighted += freq * vReal[i];
    sumMag      += vReal[i];
  }
  return sumMag > 0 ? (float)(sumWeighted / sumMag) : 0.0f;
}

float computeSpectralEnergy() {
  double energy = 0.0;
  for (int i = 1; i < SAMPLE_COUNT / 2; i++) {
    energy += vReal[i] * vReal[i];
  }
  return (float)(energy / (SAMPLE_COUNT / 2));
}

float computeAnomalyScore(float domFreq, float energy) {
  float freqScore   = constrain((domFreq - 10.0f) / 70.0f, 0.0f, 1.0f);
  float energyScore = constrain(energy / 50000.0f, 0.0f, 1.0f);
  return 0.6f * freqScore + 0.4f * energyScore;
}

// ── Sensor reads ──────────────────────────────────────────────────────────────
float readPressure() {
  // Real: int raw = analogRead(35); return (raw - 819) * 10.0f / (4095 - 819);
  return 3.5f + (random(0, 100) / 100.0f);
}

float readFlow() {
  return 45.0f + (random(0, 200) / 10.0f);
}

float readTemperature() {
  return 22.0f + (random(0, 80) / 10.0f);
}

float readHumidity() {
  return 55.0f + (random(0, 200) / 10.0f);
}

// ── Payload builder ───────────────────────────────────────────────────────────
String buildPayload(float domFreq, float centroid, float energy, float anomaly,
                    float pressure, float flow, float temp, float humidity) {
  String date = getDateStr();
  String time = getTimeStr();

  StaticJsonDocument<512> doc;
  doc["pipe_id"]            = PIPE_ID;
  doc["zone_id"]            = ZONE_ID;
  doc["reading_date"]       = date;
  doc["reading_time"]       = time;
  doc["pressure_bar"]       = round(pressure * 100) / 100.0;
  doc["flow_lpm"]           = round(flow * 10) / 10.0;
  doc["frequency_hz"]       = round(domFreq * 10) / 10.0;
  doc["temp_c"]             = round(temp * 10) / 10.0;
  doc["humidity_pct"]       = round(humidity * 10) / 10.0;
  doc["valve_status"]       = "OPEN";
  doc["anomaly_score"]      = round(anomaly * 1000) / 1000.0;
  doc["dominant_frequency"] = round(domFreq * 10) / 10.0;

  String out;
  serializeJson(doc, out);
  return out;
}

// ── LED helper ────────────────────────────────────────────────────────────────
void blink(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(80);
    digitalWrite(LED_PIN, LOW);
    delay(80);
  }
}
