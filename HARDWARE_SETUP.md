# Hardware Setup Guide — Digital Stethoscope ESP32

> **Complete guide for assembling, configuring, and deploying ESP32-based acoustic leak detection sensors**

---

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Circuit Diagram](#circuit-diagram)
3. [Assembly Instructions](#assembly-instructions)
4. [Firmware Installation](#firmware-installation)
5. [Configuration](#configuration)
6. [Testing & Calibration](#testing--calibration)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)

---

## Hardware Requirements

### Core Components

| Component | Specification | Quantity | Purpose | Approx. Cost (INR) |
|-----------|--------------|----------|---------|--------------|
| **ESP32 DevKit** | ESP32-WROOM-32 or ESP32-WROVER | 1 | Main microcontroller | ₹350 |
| **Piezo Sensor** | 27mm piezo disc or contact mic | 1 | Acoustic signal capture | ₹80 |
| **MEMS Microphone** | INMP441 or SPH0645 (optional) | 1 | High-quality audio capture | ₹200 |
| **Pressure Sensor** | 4-20mA or 0-5V analog output | 1 | Water pressure monitoring | ₹450 |
| **Flow Sensor** | YF-S201 or similar hall-effect | 1 | Flow rate measurement | ₹180 |
| **Temperature Sensor** | DS18B20 or DHT22 | 1 | Environmental monitoring | ₹90 |
| **Humidity Sensor** | DHT22 or BME280 | 1 | Environmental monitoring | ₹150 |

### Supporting Components

| Component | Specification | Quantity | Purpose |
|-----------|--------------|----------|---------|
| **Resistors** | 10kΩ, 4.7kΩ | 2-3 | Pull-up/down, voltage divider |
| **Capacitors** | 100nF ceramic, 10µF electrolytic | 2-3 | Signal filtering, power smoothing |
| **Op-Amp** | LM358 or TL072 (optional) | 1 | Signal amplification |
| **Shunt Resistor** | 250Ω, 1W | 1 | 4-20mA current sensing |
| **LED** | 5mm red/green | 1-2 | Status indication |
| **Enclosure** | IP65 waterproof box | 1 | Weather protection |
| **Power Supply** | 5V 2A USB or 12V with regulator | 1 | Device power |
| **Mounting Hardware** | Pipe clamps, adhesive pads | 1 set | Sensor attachment |

### Tools Required

- Soldering iron & solder
- Wire strippers & cutters
- Multimeter
- Screwdriver set
- Hot glue gun (for waterproofing)
- Heat shrink tubing
- USB cable (for programming)

---

## Circuit Diagram

### Basic Configuration (Piezo Only)

```
                    ESP32 DevKit
                   ┌─────────────┐
                   │             │
    Piezo Sensor   │   GPIO34    │ ← ADC1_CH6 (input only)
    ┌────┐         │   (ADC)     │
    │ +  ├─────────┤             │
    │    │         │             │
    │ -  ├─────────┤   GND       │
    └────┘         │             │
                   │   GPIO2     │ → LED (status)
                   │             │
                   │   3.3V      │ → Power rail
                   │   GND       │ → Ground rail
                   │             │
                   │   EN        │ ← 10kΩ pull-up to 3.3V
                   └─────────────┘
```

### Full Configuration (All Sensors)

```
                         ESP32 DevKit
                        ┌──────────────┐
                        │              │
    Piezo Sensor        │   GPIO34     │ ← Acoustic signal (ADC1_CH6)
    ───────────────────→│   (ADC)      │
                        │              │
    Pressure Sensor     │   GPIO35     │ ← 4-20mA via 250Ω shunt (ADC1_CH7)
    (4-20mA) ──[250Ω]──→│   (ADC)      │
                        │              │
    Flow Sensor         │   GPIO25     │ ← Pulse counter (interrupt)
    (Hall Effect) ─────→│              │
                        │              │
    DS18B20 Temp        │   GPIO4      │ ← OneWire data
    (OneWire) ─────────→│              │
                        │              │
    DHT22 Humidity      │   GPIO5      │ ← Digital data
    ─────────────────→│              │
                        │              │
    Status LED ────────→│   GPIO2      │ → Built-in LED
                        │              │
    External LED ──────→│   GPIO23     │ → External status indicator
                        │              │
                        │   3.3V       │ → Sensor power (max 500mA)
                        │   GND        │ → Common ground
                        │   VIN (5V)   │ ← USB or external 5V supply
                        └──────────────┘
```

### Pressure Sensor Wiring (4-20mA)

```
    Pressure Sensor (4-20mA output)
    ┌─────────────┐
    │  +24V       │ ← External 24V supply
    │  GND        │ ← Supply ground
    │  OUT (4-20mA)│
    └──────┬──────┘
           │
           ├─────[250Ω shunt]─────┐
           │                      │
           │                      ├──→ ESP32 GPIO35 (ADC)
           │                      │
           └──────────────────────┴──→ GND

    Voltage across shunt: 4mA × 250Ω = 1V (min)
                         20mA × 250Ω = 5V (max)
    
    Note: If using 0-5V sensor, connect directly to GPIO35
```

### Signal Amplification (Optional)

For weak piezo signals, add an op-amp stage:

```
    Piezo → [100nF] → LM358 (non-inverting, gain=10) → [10kΩ/1kΩ divider] → GPIO34
                      ↑
                      3.3V supply
```

---

## Assembly Instructions

### Step 1: Prepare the ESP32

1. **Inspect the board** — Check for damage, bent pins
2. **Test power** — Connect via USB, verify 3.3V rail with multimeter
3. **Flash test firmware** — Upload Arduino "Blink" sketch to verify programming

### Step 2: Solder Core Components

#### Piezo Sensor Connection

1. **Identify polarity** — Red wire = positive, black = ground (or use multimeter)
2. **Solder wires** — 15-20cm length, 22-24 AWG stranded wire
3. **Add capacitor** — 100nF ceramic across piezo leads (noise filtering)
4. **Connect to ESP32**:
   - Piezo **positive** → GPIO34
   - Piezo **negative** → GND
5. **Secure with heat shrink** — Protect solder joints

#### Status LED

1. **Solder LED** — Anode (long leg) → GPIO2, Cathode → GND via 220Ω resistor
2. **Test** — Upload blink sketch, verify LED toggles

### Step 3: Add Pressure Sensor (Optional)

#### For 4-20mA Sensors

1. **Wire shunt resistor** — 250Ω, 1W between sensor output and GND
2. **Measure voltage** — Should read 1-5V across shunt
3. **Connect to ADC** — Voltage tap → GPIO35
4. **Calibrate** — Record ADC values at known pressures

#### For 0-5V Sensors

1. **Direct connection** — Sensor output → GPIO35
2. **Add protection** — 10kΩ series resistor + 3.3V zener diode to GND

### Step 4: Add Flow Sensor

1. **Connect power** — VCC → 5V (VIN), GND → GND
2. **Connect signal** — Pulse output → GPIO25
3. **Test** — Blow through sensor, verify pulses with oscilloscope or serial monitor

### Step 5: Add Temperature/Humidity Sensors

#### DS18B20 (OneWire)

1. **Wire connections** — VCC → 3.3V, GND → GND, Data → GPIO4
2. **Add pull-up** — 4.7kΩ resistor between Data and VCC
3. **Test** — Use OneWire library example

#### DHT22

1. **Wire connections** — VCC → 3.3V, GND → GND, Data → GPIO5
2. **Add pull-up** — 10kΩ resistor between Data and VCC (often built-in)
3. **Test** — Use DHT library example

### Step 6: Enclosure Assembly

1. **Drill holes** — For USB cable, sensor wires, mounting screws
2. **Add cable glands** — IP65-rated for waterproofing
3. **Mount ESP32** — Use standoffs or hot glue (avoid covering components)
4. **Route wires** — Keep power and signal wires separated
5. **Seal enclosure** — Silicone sealant around lid

### Step 7: Pipe Mounting

#### Piezo Sensor Attachment

1. **Clean pipe surface** — Remove dirt, rust, paint
2. **Apply coupling gel** — Ultrasound gel or petroleum jelly (improves acoustic coupling)
3. **Attach sensor** — Use:
   - **Hose clamp** — For temporary installations
   - **Epoxy adhesive** — For permanent installations
   - **Magnetic mount** — For ferrous pipes
4. **Verify contact** — Tap pipe, check signal on serial monitor

#### Enclosure Mounting

1. **Choose location** — Near pipe, protected from weather
2. **Mount options**:
   - **Wall bracket** — Screws + anchors
   - **Pipe clamp** — Stainless steel band
   - **Pole mount** — For outdoor installations
3. **Cable management** — Use cable ties, avoid sharp bends

---

## Firmware Installation

### Prerequisites

1. **Install Arduino IDE** — Version 2.0+ recommended
   - Download: https://www.arduino.cc/en/software

2. **Add ESP32 Board Support**
   - Open Arduino IDE → File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Tools → Board → Boards Manager → Search "ESP32" → Install

3. **Install Required Libraries**
   - Tools → Manage Libraries → Install:
     - `ArduinoJson` (by Benoit Blanchon) ≥ 6.21.0
     - `arduinoFFT` (by Enrique Condes) ≥ 2.0.0
   - Built-in libraries (no installation needed):
     - `WiFi`
     - `HTTPClient`

### Flashing Steps

1. **Open firmware file**
   ```
   File → Open → firmware/esp32_stethoscope/esp32_stethoscope.ino
   ```

2. **Configure board settings**
   - Tools → Board → ESP32 Arduino → **ESP32 Dev Module**
   - Tools → Upload Speed → **115200**
   - Tools → Flash Frequency → **80MHz**
   - Tools → Partition Scheme → **Default 4MB with spiffs**
   - Tools → Port → Select your ESP32's COM port

3. **Edit configuration** (see [Configuration](#configuration) section)

4. **Compile & upload**
   - Click **Verify** (✓) to check for errors
   - Click **Upload** (→) to flash firmware
   - Wait for "Hard resetting via RTS pin..." message

5. **Monitor serial output**
   - Tools → Serial Monitor
   - Set baud rate to **115200**
   - Press ESP32 **EN** button to restart
   - Verify WiFi connection and data transmission

### Troubleshooting Upload Issues

| Error | Solution |
|-------|----------|
| "Port not found" | Install CP210x or CH340 USB driver |
| "Failed to connect" | Hold **BOOT** button while clicking upload |
| "Brownout detector" | Use external 5V power supply (not USB) |
| "Sketch too big" | Change partition scheme to "No OTA" |

---

## Configuration

### Edit Firmware Constants

Open `esp32_stethoscope.ino` and modify the configuration block:

```cpp
// ── WiFi credentials ──────────────────────────────────────────
#define WIFI_SSID        "YourNetworkName"
#define WIFI_PASSWORD    "YourNetworkPassword"

// ── Backend API ───────────────────────────────────────────────
#define BACKEND_URL      "http://192.168.1.100:4000/ingest"
#define DEVICE_API_KEY   "your_device_api_key_here"

// ── Device identity ───────────────────────────────────────────
#define PIPE_ID          "P101"    // Unique pipe identifier
#define ZONE_ID          "Z1"      // Zone/area identifier

// ── Sampling parameters ───────────────────────────────────────
#define MIC_PIN          34        // ADC pin for piezo/mic
#define SAMPLE_RATE      4000      // Hz (do not change without retraining ML model)
#define SAMPLE_COUNT     512       // FFT window size (power of 2)
#define SEND_INTERVAL_MS 60000     // POST interval (60 seconds)

// ── Hardware pins ─────────────────────────────────────────────
#define LED_PIN          2         // Built-in LED
```

### Obtain Device API Key

#### Method 1: Generate via Backend API

```bash
curl -X POST http://YOUR_BACKEND_IP:4000/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "pipe_id": "P101",
    "zone_id": "Z1",
    "location": "Main Street Junction"
  }'
```

Response:
```json
{
  "device_id": "dev_abc123",
  "api_key": "sk_live_a1b2c3d4e5f6...",
  "pipe_id": "P101"
}
```

#### Method 2: Manual Database Entry

```sql
-- Run in Supabase SQL Editor
INSERT INTO devices (pipe_id, zone_id, api_key_hash, location, status)
VALUES (
  'P101',
  'Z1',
  crypt('your_secret_key', gen_salt('bf')),  -- bcrypt hash
  'Main Street Junction',
  'active'
);
```

Use `your_secret_key` as `DEVICE_API_KEY` in firmware.

### Network Configuration

#### Static IP (Optional)

Replace `WiFi.begin(WIFI_SSID, WIFI_PASSWORD);` with:

```cpp
IPAddress local_IP(192, 168, 1, 150);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);

WiFi.config(local_IP, gateway, subnet, primaryDNS);
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
```

#### Enterprise WiFi (WPA2-Enterprise)

```cpp
WiFi.begin(WIFI_SSID, WPA2_AUTH_PEAP, "username", "password");
```

---

## Testing & Calibration

### 1. Bench Test (No Pipe)

**Goal:** Verify firmware, WiFi, and API communication

```cpp
// In setup(), add debug output:
Serial.println("[TEST] Starting bench test...");
Serial.printf("WiFi SSID: %s\n", WIFI_SSID);
Serial.printf("Backend: %s\n", BACKEND_URL);
Serial.printf("Device: %s / %s\n", PIPE_ID, ZONE_ID);
```

**Expected output:**
```
[BOOT] Digital Stethoscope ESP32
[WiFi] Connecting to YourNetwork.....
[WiFi] Connected — IP: 192.168.1.150
[NTP] Time synced: 2026-05-12 14:32:18
[PAYLOAD] {"pipe_id":"P101","zone_id":"Z1",...}
[HTTP] POST success: 201
[DONE] domFreq=15.2 Hz  anomaly=0.123  ok=1
```

### 2. Acoustic Test

**Goal:** Verify piezo sensor and FFT processing

1. **Tap pipe** — Gently tap near sensor
2. **Check serial output** — Frequency should spike (50-100 Hz)
3. **Scratch pipe** — High-frequency noise (200+ Hz)
4. **Running water** — Broadband noise (20-80 Hz)

**Calibration:**

```cpp
// Adjust anomaly threshold in computeAnomalyScore():
float computeAnomalyScore(float domFreq, float energy) {
  float freqScore   = constrain((domFreq - 10.0f) / 70.0f, 0.0f, 1.0f);
  float energyScore = constrain(energy / 50000.0f, 0.0f, 1.0f);  // ← Adjust divisor
  return 0.6f * freqScore + 0.4f * energyScore;
}
```

### 3. Pressure Sensor Calibration

**Goal:** Map ADC values to pressure (bar)

1. **Record ADC at known pressures:**
   ```
   0 bar   → ADC = 819   (4mA × 250Ω / 3.3V × 4095)
   5 bar   → ADC = 2457  (12mA)
   10 bar  → ADC = 4095  (20mA)
   ```

2. **Update `readPressure()` function:**
   ```cpp
   float readPressure() {
     int raw = analogRead(35);
     // Linear mapping: ADC 819-4095 → 0-10 bar
     return (raw - 819) * 10.0f / (4095 - 819);
   }
   ```

### 4. Flow Sensor Calibration

**Goal:** Convert pulse frequency to LPM (liters per minute)

1. **Measure pulses per liter** — Fill known volume, count pulses
   - Example: YF-S201 = ~450 pulses/liter

2. **Update `readFlow()` function:**
   ```cpp
   volatile int pulseCount = 0;
   
   void IRAM_ATTR flowPulseISR() {
     pulseCount++;
   }
   
   void setup() {
     attachInterrupt(digitalPinToInterrupt(25), flowPulseISR, RISING);
   }
   
   float readFlow() {
     static unsigned long lastTime = 0;
     unsigned long now = millis();
     float dt = (now - lastTime) / 60000.0;  // minutes
     float liters = pulseCount / 450.0;
     float lpm = liters / dt;
     pulseCount = 0;
     lastTime = now;
     return lpm;
   }
   ```

### 5. End-to-End Test

1. **Deploy sensor on pipe** with known leak
2. **Monitor dashboard** — Verify readings appear in real-time
3. **Check ML prediction** — Should classify as "Minor Leak" or "Major Leak"
4. **Verify alerts** — Alert should trigger if severity > threshold

---

## Deployment

### Pre-Deployment Checklist

- [ ] Firmware configured with correct WiFi, API key, pipe ID
- [ ] All sensors tested and calibrated
- [ ] Enclosure sealed and waterproofed
- [ ] Power supply tested (24-hour burn-in recommended)
- [ ] Backup ESP32 programmed and ready
- [ ] Dashboard access verified
- [ ] Alert notifications configured

### Installation Procedure

1. **Site survey**
   - Identify pipe access points
   - Check WiFi signal strength (use phone or ESP32 WiFi scanner)
   - Plan power routing

2. **Mount sensor**
   - Clean pipe surface
   - Apply coupling gel
   - Secure piezo with clamp or adhesive
   - Verify acoustic coupling (tap test)

3. **Install enclosure**
   - Mount within 2m of sensor (keep wires short)
   - Ensure ventilation (prevent condensation)
   - Label with pipe ID and QR code

4. **Power on & verify**
   - Connect power
   - Wait for LED blink pattern (3 blinks = success)
   - Check dashboard for first reading (within 60 seconds)

5. **Documentation**
   - Record GPS coordinates
   - Take photos of installation
   - Update pipe registry in database

### Maintenance Schedule

| Interval | Task |
|----------|------|
| **Weekly** | Check dashboard for missing readings |
| **Monthly** | Inspect enclosure for water ingress |
| **Quarterly** | Clean piezo sensor, re-apply coupling gel |
| **Annually** | Replace batteries (if battery-powered), firmware update |

---

## Troubleshooting

### WiFi Connection Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Connecting..." never ends | Wrong SSID/password | Double-check credentials, check for hidden SSID |
| Connects then disconnects | Weak signal | Move closer to AP, use external antenna |
| "Failed to connect" | MAC filtering | Add ESP32 MAC to router whitelist |
| Works at home, not on-site | Enterprise WiFi | Configure WPA2-Enterprise (see config) |

### HTTP POST Failures

| Error Code | Meaning | Solution |
|------------|---------|----------|
| **-1** | Connection timeout | Check backend URL, firewall rules |
| **401** | Unauthorized | Verify API key matches backend |
| **400** | Bad request | Check JSON payload format |
| **500** | Server error | Check backend logs |
| **0** | DNS failure | Check WiFi, try IP address instead of hostname |

### Sensor Issues

#### No Acoustic Signal

1. **Check wiring** — Multimeter continuity test
2. **Verify ADC** — Print raw ADC values, should fluctuate
3. **Test with audio** — Play tone near piezo, check response
4. **Check coupling** — Re-apply gel, tighten clamp

#### Pressure Reading Stuck

1. **Check sensor power** — Should be 24V for 4-20mA sensors
2. **Measure current** — Use multimeter in series, expect 4-20mA
3. **Check shunt resistor** — Should be 250Ω ±5%
4. **Verify ADC range** — Print raw values, should be 819-4095

#### Flow Sensor Not Counting

1. **Check power** — 5V on VCC pin
2. **Test manually** — Spin impeller by hand, check pulses
3. **Verify interrupt** — Add debug print in ISR
4. **Check for debris** — Clean sensor inlet

### LED Blink Codes

| Pattern | Meaning |
|---------|---------|
| 1 blink | Sampling signal |
| 3 blinks | POST success |
| 5 blinks | POST failed |
| Rapid blink | WiFi connecting |
| Solid on | Firmware crashed (check serial) |

### Serial Debug Commands

Add to `loop()` for interactive debugging:

```cpp
if (Serial.available()) {
  char cmd = Serial.read();
  switch (cmd) {
    case 't': sampleSignal(); Serial.println("Signal sampled"); break;
    case 'f': Serial.printf("Freq: %.1f Hz\n", computeDominantFrequency()); break;
    case 'p': Serial.printf("Pressure: %.2f bar\n", readPressure()); break;
    case 'w': Serial.printf("WiFi: %s\n", WiFi.status() == WL_CONNECTED ? "OK" : "FAIL"); break;
    case 'r': ESP.restart(); break;
  }
}
```

---

## Advanced Configuration

### Over-The-Air (OTA) Updates

Add to firmware for remote updates:

```cpp
#include <ArduinoOTA.h>

void setup() {
  // ... existing setup ...
  
  ArduinoOTA.setHostname("stethoscope-P101");
  ArduinoOTA.setPassword("your_ota_password");
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();
  // ... existing loop ...
}
```

Update via:
```bash
arduino-cli upload -p network://192.168.1.150 --fqbn esp32:esp32:esp32
```

### Deep Sleep (Battery Operation)

For battery-powered deployments:

```cpp
#define SLEEP_MINUTES 10

void loop() {
  // ... sample & send ...
  
  Serial.println("[SLEEP] Entering deep sleep...");
  esp_sleep_enable_timer_wakeup(SLEEP_MINUTES * 60 * 1000000ULL);
  esp_deep_sleep_start();
}
```

**Power consumption:**
- Active: ~160mA
- Deep sleep: ~10µA
- Battery life (18650 3000mAh): ~6 months (10-min interval)

### MQTT Instead of HTTP

For high-frequency data or unreliable networks:

```cpp
#include <PubSubClient.h>

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

void setup() {
  mqtt.setServer("mqtt.example.com", 1883);
  mqtt.connect("stethoscope-P101", "username", "password");
}

void loop() {
  String payload = buildPayload(...);
  mqtt.publish("sensors/P101/readings", payload.c_str());
}
```

### Multi-Sensor Array

Connect multiple piezo sensors to different ADC pins:

```cpp
const int MIC_PINS[] = {34, 35, 36, 39};  // ADC1 channels
const char* PIPE_IDS[] = {"P101", "P102", "P103", "P104"};

for (int i = 0; i < 4; i++) {
  sampleSignal(MIC_PINS[i]);
  float freq = computeDominantFrequency();
  postReading(PIPE_IDS[i], freq, ...);
}
```

---

## Bill of Materials (BOM)

### Single-Sensor Unit (India)

| Item | Qty | Unit Cost | Total |
|------|-----|-----------|-------|
| ESP32 DevKit v1 | 1 | ₹350 | ₹350 |
| Piezo sensor (27mm) | 1 | ₹80 | ₹80 |
| Pressure sensor (4-20mA) | 1 | ₹450 | ₹450 |
| Flow sensor (YF-S201) | 1 | ₹180 | ₹180 |
| DS18B20 temp sensor | 1 | ₹90 | ₹90 |
| DHT22 humidity sensor | 1 | ₹150 | ₹150 |
| Resistors, capacitors | 1 set | ₹30 | ₹30 |
| IP65 enclosure | 1 | ₹220 | ₹220 |
| Power supply (5V 2A) | 1 | ₹120 | ₹120 |
| Mounting hardware | 1 set | ₹50 | ₹50 |
| **Total (full kit)** | | | **₹1,420** |
| **Required only** | | | **₹770** |

> ✅ **Under ₹1,500** — All components available on **Amazon India**, **Robu.in**, or **Indiamart**

### 10-Unit Deployment

- **Hardware:** $750 (10 × $75)
- **Labor:** $500 (installation, calibration)
- **Backend:** $0 (self-hosted) or $50/month (cloud)
- **Total first year:** ~$1,850

---

## Support & Resources

### Documentation

- **ESP32 Datasheet:** https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf
- **Arduino ESP32 Core:** https://docs.espressif.com/projects/arduino-esp32/
- **ArduinoFFT Library:** https://github.com/kosme/arduinoFFT

### Community

- **GitHub Issues:** https://github.com/tejaswinisa1/water_leakage-unisys-/issues
- **Discord:** [Join our server](#)
- **Email:** support@digitalstethoscope.io

### Commercial Support

For enterprise deployments (100+ sensors), contact us for:
- Custom firmware development
- On-site installation training
- 24/7 monitoring & support
- SLA guarantees

---

**Last updated:** May 12, 2026  
**Firmware version:** 1.0.0  
**Compatible backend:** ≥ 1.0.0
