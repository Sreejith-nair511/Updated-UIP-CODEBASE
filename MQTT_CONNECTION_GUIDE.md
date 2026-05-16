# MQTT Connection Guide — HiveMQ Public Broker

> **Complete reference for connecting every component to broker.hivemq.com**

---

## Broker Details

| Property | Value |
|----------|-------|
| **Host** | `broker.hivemq.com` |
| **TCP Port** | `1883` |
| **WebSocket Port** | `8000` |
| **TLS TCP Port** | `8883` |
| **TLS WebSocket Port** | `8884` |
| **Username** | *(none — public broker)* |
| **Password** | *(none — public broker)* |
| **Auth** | None required |
| **Max message size** | 268 MB |
| **Persistent sessions** | No (clean session only) |

---

## Which Port to Use — Decision Guide

```
What are you connecting?
│
├── ESP32 / Arduino firmware
│   └── Use TCP Port 1883  (mqtt://)
│       Simple, no TLS overhead, works on all ESP32 boards
│
├── Node.js backend (this project)
│   └── Use TCP Port 1883  (mqtt://)
│       Native TCP is fastest for server-side code
│
├── Python script (paho-mqtt)
│   └── Use TCP Port 1883  (mqtt://)
│       Default paho-mqtt connection
│
├── Browser / JavaScript (WebSocket required)
│   ├── HTTP page  → Use WS Port 8000   (ws://)
│   └── HTTPS page → Use WSS Port 8884  (wss://)
│       Browsers cannot use raw TCP — must use WebSocket
│
└── Secure / Production
    ├── Server-side → Use TLS TCP Port 8883  (mqtts://)
    └── Browser     → Use TLS WS Port 8884   (wss://)
```

---

## Connection Strings

```
TCP (plain):          mqtt://broker.hivemq.com:1883
WebSocket (plain):    ws://broker.hivemq.com:8000/mqtt
TLS TCP (secure):     mqtts://broker.hivemq.com:8883
TLS WebSocket:        wss://broker.hivemq.com:8884/mqtt
```

---

## 1. Browser / HiveMQ WebSocket Client

**URL:** https://www.hivemq.com/demos/websocket-client/

Settings to enter:
```
Host:       broker.hivemq.com
Port:       8884
ClientID:   clientId-<any random string>
Username:   (leave empty)
Password:   (leave empty)
SSL:        ✓ checked
Keep Alive: 60
```

**Subscribe to all sensor readings:**
```
Topic:  stethoscope/#
QoS:    0
```

**Publish a test reading:**
```
Topic:   stethoscope/readings/P101
QoS:     1
Message: {"pipe_id":"P101","zone_id":"Z1","reading_date":"2026-05-13",
          "reading_time":"14:32:18","pressure_bar":3.5,"flow_lpm":45.2,
          "frequency_hz":72.4,"temp_c":22.5,"humidity_pct":55.0,
          "valve_status":"OPEN","anomaly_score":0.89}
```

---

## 2. ESP32 Firmware (Arduino)

**Port to use: 1883 (TCP)**

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

#define MQTT_BROKER  "broker.hivemq.com"
#define MQTT_PORT    1883                    // ← TCP port

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

void setup() {
  WiFi.begin("YOUR_SSID", "YOUR_PASSWORD");
  while (WiFi.status() != WL_CONNECTED) delay(500);

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.connect("stethoscope-P101");   // unique client ID
}

void loop() {
  if (!mqttClient.connected()) {
    mqttClient.connect("stethoscope-P101");
  }
  mqttClient.loop();

  // Publish a reading
  String payload = "{\"pipe_id\":\"P101\",\"anomaly_score\":0.12,...}";
  mqttClient.publish("stethoscope/readings/P101", payload.c_str());
  delay(60000);  // every 60 seconds
}
```

**Required library:** `PubSubClient` by Nick O'Leary (install via Arduino Library Manager)

---

## 3. Node.js Backend (This Project)

**Port to use: 1883 (TCP)**

Already configured in `backend/src/lib/mqtt.ts`. Just set `.env`:

```env
MQTT_ACTIVE_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=stethoscope/readings
```

The backend auto-subscribes to:
- `stethoscope/readings`
- `stethoscope/readings/+`
- `stethoscope/+/readings`

**Start backend:**
```bash
cd backend
npm run dev
```

**Verify connection in logs:**
```
✅ MQTT connected to HiveMQ broker { brokerUrl: 'mqtt://broker.hivemq.com:1883' }
MQTT subscribed { topic: 'stethoscope/readings' }
MQTT subscribed { topic: 'stethoscope/readings/+' }
```

---

## 4. Python Script (paho-mqtt)

**Port to use: 1883 (TCP)**

```bash
pip install paho-mqtt
```

```python
import paho.mqtt.client as mqtt
import json

client = mqtt.Client(client_id="stethoscope-test")
client.connect("broker.hivemq.com", 1883, keepalive=60)

# Publish a reading
payload = {
    "pipe_id": "P101",
    "zone_id": "Z1",
    "reading_date": "2026-05-13",
    "reading_time": "14:32:18",
    "pressure_bar": 3.5,
    "flow_lpm": 45.2,
    "frequency_hz": 72.4,
    "temp_c": 22.5,
    "humidity_pct": 55.0,
    "valve_status": "OPEN",
    "anomaly_score": 0.89
}
client.publish("stethoscope/readings/P101", json.dumps(payload), qos=1)
client.disconnect()
```

**Run the included publisher:**
```bash
# Simulate normal readings
python database/mqtt_publisher.py

# Simulate a major leak on P106
python database/mqtt_publisher.py --scenario major_leak --pipe P106

# Publish all 684 CSV training samples
python database/mqtt_publisher.py --csv

# Custom broker/port
python database/mqtt_publisher.py --broker broker.hivemq.com --port 1883
```

---

## 5. MQTT Explorer (Desktop App)

Download: https://mqtt-explorer.com/

Settings:
```
Protocol:  mqtt://
Host:      broker.hivemq.com
Port:      1883
Username:  (empty)
Password:  (empty)
```

Subscribe to see all Digital Stethoscope traffic:
```
Topic: stethoscope/#
```

---

## 6. mosquitto_pub / mosquitto_sub (CLI)

```bash
# Install
sudo apt install mosquitto-clients   # Linux
brew install mosquitto               # macOS

# Subscribe to all readings
mosquitto_sub -h broker.hivemq.com -p 1883 -t "stethoscope/#" -v

# Publish a test reading
mosquitto_pub -h broker.hivemq.com -p 1883 \
  -t "stethoscope/readings/P101" \
  -m '{"pipe_id":"P101","zone_id":"Z1","reading_date":"2026-05-13","reading_time":"14:32:18","pressure_bar":3.5,"flow_lpm":45.2,"frequency_hz":72.4,"temp_c":22.5,"humidity_pct":55.0,"valve_status":"OPEN","anomaly_score":0.89}'

# With TLS (port 8883)
mosquitto_sub -h broker.hivemq.com -p 8883 --capath /etc/ssl/certs \
  -t "stethoscope/#" -v
```

---

## Topic Structure

```
stethoscope/
├── readings/               ← All readings (subscribe with stethoscope/readings/#)
│   ├── P101                ← Pipe P101 readings
│   ├── P102                ← Pipe P102 readings
│   └── ...
├── alerts/                 ← Alert notifications
│   ├── P101
│   └── ...
└── commands/               ← Commands to devices (backend → ESP32)
    ├── P101                ← Commands for P101
    └── ...
```

**Subscribe patterns:**
```
stethoscope/#               ← Everything
stethoscope/readings/#      ← All readings
stethoscope/readings/P101   ← Only P101
stethoscope/+/readings      ← Zone-scoped (if using zone prefix)
```

---

## Message Format

Every message published to `stethoscope/readings/<pipe_id>`:

```json
{
  "pipe_id":            "P101",
  "zone_id":            "Z1",
  "reading_date":       "2026-05-13",
  "reading_time":       "14:32:18",
  "pressure_bar":       3.500,
  "flow_lpm":           45.20,
  "frequency_hz":       72.40,
  "temp_c":             22.50,
  "humidity_pct":       55.00,
  "valve_status":       "OPEN",
  "anomaly_score":      0.8900,
  "dominant_frequency": 72.40,
  "signal":             [0.0123, -0.0456, ...],
  "sample_rate":        4000
}
```

**Required fields:** `pipe_id`, `zone_id`, `pressure_bar`, `flow_lpm`, `frequency_hz`, `anomaly_score`  
**Optional fields:** `temp_c`, `humidity_pct`, `valve_status`, `signal`, `sample_rate`

---

## Full Data Flow

```
ESP32 / Python Script
        │
        │  PUBLISH
        │  Topic: stethoscope/readings/P101
        │  Port:  1883 (TCP)
        ▼
broker.hivemq.com
        │
        │  SUBSCRIBE (backend auto-subscribes on startup)
        ▼
Backend :4000  (backend/src/lib/mqtt.ts)
        │
        │  handleMQTTMessage()
        ▼
ingest.service.ts
        │
        ├── Validate pipe exists in Supabase
        ├── Call ML service :8000/predict
        ├── Store reading in Supabase
        ├── Store prediction in Supabase
        └── Create alert if leak detected
                │
                ▼
        Supabase Realtime
                │
                ▼
        Frontend Dashboard
        (live update via WebSocket)
```

---

## Testing the Full Pipeline

### Step 1 — Start services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: ML service (optional, uses heuristic fallback if not running)
cd ml && uvicorn app:app --port 8000

# Terminal 3: Frontend
cd frontend && npm run dev
```

### Step 2 — Verify MQTT connection
```bash
curl http://localhost:4000/health
```
Expected:
```json
{
  "status": "healthy",
  "checks": { "database": "ok", "ml_service": "ok", "mqtt": "ok" },
  "mqtt": { "connected": true, "broker": "mqtt://broker.hivemq.com:1883" }
}
```

### Step 3 — Publish a test reading
```bash
python database/mqtt_publisher.py --scenario major_leak --pipe P106 --zone Z1 --interval 5
```

### Step 4 — Watch dashboard
Open http://localhost:3000/dashboard — readings appear in real-time.

### Step 5 — Load all CSV data
```bash
python database/load_csv_data.py --batch-size 20 --delay 0.1
```

---

## Port Firewall Rules

If you're behind a corporate firewall, you may need to open these ports:

| Port | Protocol | Direction | Purpose |
|------|----------|-----------|---------|
| **1883** | TCP | Outbound | MQTT plain (ESP32, Node.js, Python) |
| **8000** | TCP | Outbound | MQTT WebSocket (browser, plain HTTP) |
| **8883** | TCP | Outbound | MQTT TLS (secure server connections) |
| **8884** | TCP | Outbound | MQTT TLS WebSocket (browser, HTTPS) |

**Test connectivity:**
```bash
# Test TCP port 1883
telnet broker.hivemq.com 1883

# Test with curl (WebSocket)
curl -v --http1.1 -H "Upgrade: websocket" \
  http://broker.hivemq.com:8000/mqtt

# Test TLS port 8883
openssl s_client -connect broker.hivemq.com:8883
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` | Port blocked by firewall | Try port 8883 (TLS) or 8884 (WSS) |
| `Connection refused` | Wrong port for protocol | Use 1883 for TCP, 8000 for WS |
| `SSL handshake failed` | TLS cert issue | Add `rejectUnauthorized: false` (dev only) |
| `Client ID conflict` | Two clients with same ID | Use unique client IDs |
| `Message not received` | Wrong topic | Check topic spelling, use `#` wildcard |
| `Payload too large` | Signal array too big | Limit signal to 512 samples |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│           broker.hivemq.com — Port Reference                │
├──────────────┬──────────┬──────────────────────────────────┤
│ Use Case     │ Port     │ Connection String                 │
├──────────────┼──────────┼──────────────────────────────────┤
│ ESP32        │ 1883     │ mqtt://broker.hivemq.com:1883    │
│ Node.js      │ 1883     │ mqtt://broker.hivemq.com:1883    │
│ Python       │ 1883     │ broker.hivemq.com, port=1883     │
│ Browser (WS) │ 8000     │ ws://broker.hivemq.com:8000/mqtt │
│ Browser (WSS)│ 8884     │ wss://broker.hivemq.com:8884/mqtt│
│ Secure TCP   │ 8883     │ mqtts://broker.hivemq.com:8883   │
│ HiveMQ UI    │ 8884     │ Host: broker.hivemq.com, SSL ✓   │
└──────────────┴──────────┴──────────────────────────────────┘

Topic:    stethoscope/readings/<pipe_id>
Username: (empty)
Password: (empty)
```

---

**Last updated:** May 13, 2026  
**Broker:** broker.hivemq.com (HiveMQ Public Broker)  
**Status:** Free, no registration required
