/**
 * Digital Stethoscope — ESP32 Firmware
 * ======================================
 * Samples acoustic signal from a piezo/MEMS microphone via ADC,
 * computes basic FFT features, then POSTs a reading to the backend.
 *
 * Hardware:
 *   - ESP32 DevKit (any variant)
 *   - Piezo or MEMS microphone on GPIO34 (ADC1_CH6, input-only)
 *   - Optional: LED on GPIO2 for status
 *
 * Libraries required (install via Arduino Library Manager):
 *   - ArduinoJson  >= 6.x
 *   - WiFi         (built-in ESP32)
 *   - HTTPClient   (built-in ESP32)
 *   - arduinoFFT   >= 2.x  (by Enrique Condes)
 *
 * Configuration: edit config.h or the #defines below.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <arduinoFFT.h>
#include <math.h>
#include "ntp_time.h"

// ── User configuration ────────────────────────────────────────────────────────
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"
#define BACKEND_URL      "http://YOUR_BACKEND_IP:4000/ingest"   // backend IP:port
#define DEVICE_API_KEY   "your_device_api_key_here"
#define PIPE_ID          "P101"
#define ZONE_ID          "Z1"

// ADC / sampling
#define MIC_PIN          34          // GPIO34 — ADC1_CH6 (input only)
#define SAMPLE_RATE      4000        // Hz
#define SAMPLE_COUNT     512         // FFT window size (power of 2)
#define SEND_INTERVAL_MS 60000       // POST every 60 seconds

// LED
#define LED_PIN          2

// ── Globals ───────────────────────────────────────────────────────────────────
double vReal[SAMPLE_COUNT];
double vImag[SAMPLE_COUNT];
ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, SAMPLE_COUNT, SAMPLE_RATE);

unsigned long lastSendMs = 0;

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  analogReadResolution(12);          // 12-bit ADC (0–4095)
  analogSetAttenuation(ADC_11db);    // full 0–3.3V range

  Serial.println("[BOOT] Digital Stethoscope ESP32");
  connectWiFi();
  initNTP();   // sync clock via NTP after WiFi connects
}

// ── Main loop ─────────────────────────────────────────────────────────────────
void loop() {
  if (millis() - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = millis();
    blink(1);

    // 1. Sample signal
    sampleSignal();

    // 2. Compute FFT features
    float domFreq    = computeDominantFrequency();
    float centroid   = computeSpectralCentroid();
    float energy     = computeSpectralEnergy();
    float anomaly    = computeAnomalyScore(domFreq, energy);

    // 3. Read pressure/flow from analog sensors (or use fixed values if not wired)
    float pressure   = readPressure();
    float flow       = readFlow();
    float temp       = readTemperature();
    float humidity   = readHumidity();

    // 4. Build JSON payload
    String payload = buildPayload(domFreq, centroid, energy, anomaly,
                                  pressure, flow, temp, humidity);

    Serial.println("[PAYLOAD] " + payload);

    // 5. POST to backend
    bool ok = postReading(payload);
    blink(ok ? 3 : 5);

    Serial.printf("[DONE] domFreq=%.1f Hz  anomaly=%.3f  ok=%d\n",
                  domFreq, anomaly, ok);
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

void ensureWiFi() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
}

// ── Signal sampling ───────────────────────────────────────────────────────────
void sampleSignal() {
  const unsigned long sampleIntervalUs = 1000000UL / SAMPLE_RATE;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    unsigned long t0 = micros();
    int raw = analogRead(MIC_PIN);
    vReal[i] = (double)(raw - 2048);   // center around zero
    vImag[i] = 0.0;
    // Busy-wait for precise timing
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
  // Simple heuristic: high frequency + high energy = anomaly
  float freqScore   = constrain((domFreq - 10.0f) / 70.0f, 0.0f, 1.0f);
  float energyScore = constrain(energy / 50000.0f, 0.0f, 1.0f);
  return 0.6f * freqScore + 0.4f * energyScore;
}

// ── Sensor reads (stub — replace with real sensor code) ───────────────────────
float readPressure() {
  // Example: 4–20mA pressure sensor on GPIO35 via 250Ω shunt
  // int raw = analogRead(35);
  // return 1.0f + (raw / 4095.0f) * 9.0f;  // 1–10 bar
  return 3.5f + (random(0, 100) / 100.0f);  // simulated
}

float readFlow() {
  return 45.0f + (random(0, 200) / 10.0f);  // simulated LPM
}

float readTemperature() {
  return 22.0f + (random(0, 80) / 10.0f);   // simulated °C
}

float readHumidity() {
  return 55.0f + (random(0, 200) / 10.0f);  // simulated %
}

// ── Payload builder ───────────────────────────────────────────────────────────
String buildPayload(float domFreq, float centroid, float energy, float anomaly,
                    float pressure, float flow, float temp, float humidity) {
  String date = getDateStr();
  String time = getTimeStr();

  StaticJsonDocument<512> doc;
  doc["pipe_id"]           = PIPE_ID;
  doc["zone_id"]           = ZONE_ID;
  doc["reading_date"]      = date;
  doc["reading_time"]      = time;
  doc["pressure_bar"]      = round(pressure * 100) / 100.0;
  doc["flow_lpm"]          = round(flow * 10) / 10.0;
  doc["frequency_hz"]      = round(domFreq * 10) / 10.0;
  doc["temp_c"]            = round(temp * 10) / 10.0;
  doc["humidity_pct"]      = round(humidity * 10) / 10.0;
  doc["valve_status"]      = "OPEN";
  doc["anomaly_score"]     = round(anomaly * 1000) / 1000.0;
  doc["dominant_frequency"]= round(domFreq * 10) / 10.0;

  String out;
  serializeJson(doc, out);
  return out;
}

// ── HTTP POST ─────────────────────────────────────────────────────────────────
bool postReading(const String& payload) {
  ensureWiFi();
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", DEVICE_API_KEY);
  http.setTimeout(8000);

  int code = http.POST(payload);
  bool ok  = (code == 200 || code == 201);

  if (!ok) {
    Serial.printf("[HTTP] POST failed: %d  %s\n", code, http.getString().c_str());
  }
  http.end();
  return ok;
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
