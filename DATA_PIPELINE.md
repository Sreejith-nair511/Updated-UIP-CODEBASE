# Data Pipeline Guide — Digital Stethoscope

> **How data flows from ESP32 / CSV → MQTT → Backend → ML → Supabase → Dashboard**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA SOURCES                                                   │
│                                                                 │
│  ESP32 Sensor          CSV Training Data      MQTT Publisher    │
│  (Physical hardware)   (684 samples)          (Python script)   │
│       │                      │                      │           │
│       │ MQTT publish         │ HTTP POST            │ MQTT      │
│       │ stethoscope/         │ /ingest/batch        │ publish   │
│       │ readings/<pipe>      │                      │           │
└───────┼──────────────────────┼──────────────────────┼───────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND API  :4000                                             │
│                                                                 │
│  MQTT Subscriber          HTTP /ingest          /ingest/batch   │
│  (mqtt.ts)                (ingest.router.ts)                    │
│       │                      │                                  │
│       └──────────────────────┘                                  │
│                      │                                          │
│                      ▼                                          │
│              ingest.service.ts                                  │
│              ┌─────────────────────────────────────────────┐   │
│              │ 1. Validate pipe exists                     │   │
│              │ 2. Run ML inference (ml.service.ts)         │   │
│              │ 3. Store reading in Supabase                │   │
│              │ 4. Store prediction in Supabase             │   │
│              │ 5. Evaluate & create alert if needed        │   │
│              └─────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  ML SERVICE  :8000                                              │
│                                                                 │
│  POST /predict                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Input: pressure, flow, frequency, temp, humidity,       │   │
│  │        anomaly_score, signal (1460 ADC values)          │   │
│  │                                                         │   │
│  │ Pipeline:                                               │   │
│  │   ADC → FFT → Spectrogram → CNN → Fusion → LightGBM    │   │
│  │                                                         │   │
│  │ Output: leak_class (0-3), confidence, probabilities     │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE (PostgreSQL)                                          │
│                                                                 │
│  readings → predictions → alerts                               │
│  (Realtime enabled — WebSocket push to frontend)               │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Supabase Realtime
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND  :3000                                                │
│                                                                 │
│  Dashboard → AI Monitor → Alerts → Analytics                   │
│  (Live updates via useRealTimeReadings hook)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Method 1: MQTT (HiveMQ) — Real-time from ESP32

### Setup

1. **Configure HiveMQ broker** in `.env`:
   ```env
   MQTT_BROKER_URL=mqtt://mqtt-dashboard.com:1883
   MQTT_TOPIC=stethoscope/readings
   ```

2. **Start backend** — MQTT subscriber starts automatically:
   ```bash
   cd backend && npm run dev
   ```

3. **Flash ESP32** with MQTT firmware:
   - Open `firmware/esp32_stethoscope/esp32_mqtt.ino`
   - Set `MQTT_BROKER`, `WIFI_SSID`, `WIFI_PASSWORD`, `PIPE_ID`
   - Upload to ESP32

4. **Verify** — Check backend logs:
   ```
   ✅ MQTT connected to HiveMQ broker
   MQTT subscribed: stethoscope/readings
   MQTT subscribed: stethoscope/readings/+
   ```

### MQTT Topic Structure

```
stethoscope/readings          ← All readings (ESP32 default)
stethoscope/readings/P101     ← Pipe-specific
stethoscope/readings/P102     ← Another pipe
stethoscope/<zone>/readings   ← Zone-scoped
```

### MQTT Payload Format

```json
{
  "pipe_id": "P101",
  "zone_id": "Z1",
  "reading_date": "2026-05-13",
  "reading_time": "14:32:18",
  "pressure_bar": 3.5,
  "flow_lpm": 45.2,
  "frequency_hz": 15.3,
  "temp_c": 22.5,
  "humidity_pct": 55.0,
  "valve_status": "OPEN",
  "anomaly_score": 0.123,
  "dominant_frequency": 15.3,
  "signal": [0.01, -0.02, ...],
  "sample_rate": 4000
}
```

### Test with Python Publisher

```bash
pip install paho-mqtt

# Simulate normal readings for P101
python database/mqtt_publisher.py --scenario normal --pipe P101

# Simulate a major leak
python database/mqtt_publisher.py --scenario major_leak --pipe P106 --zone Z1

# Publish all pipes with mixed scenarios
python database/mqtt_publisher.py --scenario all --rounds 5

# Publish from CSV training data via MQTT
python database/mqtt_publisher.py --csv --max 100
```

---

## Method 2: CSV Data Loader — Bulk Historical Data

Loads all 684 training samples through the full ML pipeline.

### Run

```bash
# Start backend first
cd backend && npm run dev

# Load all 684 samples (takes ~2-3 minutes)
python database/load_csv_data.py

# Load with custom settings
python database/load_csv_data.py \
  --api-url http://localhost:4000 \
  --api-key dev_api_key_12345 \
  --batch-size 20 \
  --delay 0.1 \
  --days 60

# Quick test with 50 samples
python database/load_csv_data.py --max-samples 50
```

### What it does

1. Reads `data/data_v1/data.csv` (684 rows × 1460 ADC values)
2. Reads `data/data_v1/label.csv` (684 labels, 1-12)
3. Extracts FFT features from each ADC signal
4. Maps labels to leak classes:
   - Labels 1-3 → `no_leak` (Normal)
   - Labels 4-5 → `minor_leak` (Pre-Leak)
   - Labels 6-8 → `minor_leak` (Minor Leak)
   - Labels 9-12 → `major_leak` (Major Leak)
5. POSTs batches to `/ingest/batch`
6. Each reading goes through full ML inference
7. Results stored in Supabase with predictions + alerts

### Expected output

```
============================================================
  Digital Stethoscope — CSV Data Loader
============================================================
📂 Reading data/data_v1/data.csv...
📂 Reading data/data_v1/label.csv...

📊 Dataset: 684 samples × 1460 ADC values
   Labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
   API: http://localhost:4000
   Batch size: 10

  Batch   1/69 [  10/684] label=1 class=no_leak pipe=P101 freq=14.8Hz anomaly=0.082 ... ✓ 10 ok | ML: no_leak (94%)
  Batch   2/69 [  20/684] label=1 class=no_leak pipe=P102 freq=15.2Hz anomaly=0.071 ... ✓ 10 ok | ML: no_leak (91%)
  ...
  Batch  35/69 [ 350/684] label=6 class=minor_leak pipe=P305 freq=48.3Hz anomaly=0.621 ... ✓ 10 ok | ML: minor_leak (87%)
  ...
  Batch  69/69 [ 684/684] label=12 class=major_leak pipe=P505 freq=82.1Hz anomaly=0.934 ... ✓ 10 ok | ML: major_leak (96%)

============================================================
✅ Complete: 684 success, 0 failed out of 684 samples
   Check your dashboard at http://localhost:3000/dashboard
============================================================
```

---

## Method 3: HTTP POST — Direct API

For custom integrations or testing individual readings.

### Single reading

```bash
curl -X POST http://localhost:4000/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_api_key_12345" \
  -d '{
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
  }'
```

### Batch (up to 100)

```bash
curl -X POST http://localhost:4000/ingest/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_api_key_12345" \
  -d '{"readings": [...]}'
```

---

## Dataset Details

### data/data_v1/data.csv

| Property | Value |
|----------|-------|
| **Rows** | 684 samples |
| **Columns** | 1460 ADC values per sample |
| **Sampling rate** | 4000 Hz |
| **Duration** | 365ms per sample (1460 / 4000) |
| **ADC range** | 0-4095 (12-bit) |
| **Format** | CSV, no header, integers |

### data/data_v1/label.csv

| Label | Class | Leak Type | Count |
|-------|-------|-----------|-------|
| 1 | no_leak | Normal | 57 |
| 2 | no_leak | Normal | 57 |
| 3 | no_leak | Normal | 57 |
| 4 | minor_leak | Pre-Leak | 57 |
| 5 | minor_leak | Pre-Leak | 57 |
| 6 | minor_leak | Minor Leak | 57 |
| 7 | minor_leak | Minor Leak | 57 |
| 8 | minor_leak | Minor Leak | 57 |
| 9 | major_leak | Major Leak | 57 |
| 10 | major_leak | Major Leak | 57 |
| 11 | major_leak | Major Leak | 57 |
| 12 | major_leak | Major Leak | 57 |
| **Total** | | | **684** |

---

## Supabase SQL Setup

Run these in order in the Supabase SQL Editor:

1. **`database/supabase_setup.sql`** — Main schema, tables, RLS, seed data
2. **`database/supabase_mqtt_additions.sql`** — MQTT events log, pipeline views

### Useful queries after loading data

```sql
-- Total readings by leak class
SELECT p.leak_class, COUNT(*) as count
FROM predictions p
GROUP BY p.leak_class
ORDER BY count DESC;

-- Zone summary with leak rates
SELECT * FROM zone_summary ORDER BY leak_rate_pct DESC;

-- Pipe health scores
SELECT pipe_id, zone_id, health_status, max_severity, total_leaks
FROM pipe_health
ORDER BY max_severity DESC NULLS LAST;

-- Recent readings with ML predictions
SELECT * FROM readings_with_predictions LIMIT 20;

-- Hourly stats
SELECT hour, zone_id, total_readings, leak_count, avg_anomaly
FROM hourly_stats
ORDER BY hour DESC
LIMIT 48;

-- Active alerts
SELECT pipe_id, zone_id, alert_type, severity_pct, message, created_at
FROM alerts
WHERE status = 'active'
ORDER BY severity_pct DESC;
```

---

## HiveMQ Configuration

### Public Broker (from your screenshot)

```
Host:     mqtt-dashboard.com
Port:     1883 (TCP) or 8884 (WebSocket SSL)
ClientID: stethoscope-backend-<timestamp>
Username: (empty)
Password: (empty)
```

### ESP32 MQTT Settings

```cpp
#define MQTT_BROKER   "mqtt-dashboard.com"
#define MQTT_PORT     1883
#define MQTT_TOPIC    "stethoscope/readings/P101"
```

### Backend .env

```env
MQTT_BROKER_URL=mqtt://mqtt-dashboard.com:1883
MQTT_TOPIC=stethoscope/readings
```

### HiveMQ Cloud (Private Broker)

For production, use HiveMQ Cloud:
1. Sign up at https://www.hivemq.com/mqtt-cloud-broker/
2. Get your cluster URL (e.g., `abc123.s1.eu.hivemq.cloud`)
3. Update `.env`:
   ```env
   MQTT_BROKER_URL=mqtts://abc123.s1.eu.hivemq.cloud:8883
   MQTT_USERNAME=your_username
   MQTT_PASSWORD=your_password
   ```

---

## Monitoring

### Check MQTT status

```bash
curl http://localhost:4000/health
```

Response includes:
```json
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "ml_service": "ok",
    "mqtt": "ok"
  },
  "mqtt": {
    "connected": true,
    "broker": "mqtt://mqtt-dashboard.com:1883",
    "reconnectAttempts": 0
  }
}
```

### Backend logs

```
✅ MQTT connected to HiveMQ broker
MQTT subscribed: stethoscope/readings
MQTT reading processed: pipe=P101 class=no_leak severity=8 alert=false
MQTT reading processed: pipe=P106 class=major_leak severity=88 alert=true
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MQTT not connecting | Check broker URL, port, firewall |
| Readings not appearing | Verify pipe_id exists in `pipes` table |
| ML inference failing | Check ML service is running on port 8000 |
| Batch load failing | Check API key matches `DEVICE_API_KEY` in `.env` |
| No realtime updates | Enable Realtime on `readings` table in Supabase |

---

**Last updated:** May 13, 2026
