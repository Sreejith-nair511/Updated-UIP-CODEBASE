# Digital Stethoscope — Acoustic AI for Urban Water Conservation

> **IoT + ML system that listens to water pipes and detects leaks in real time using acoustic signal analysis.**

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-green)](backend/)
[![ML](https://img.shields.io/badge/ML-LightGBM%20%2B%20FastAPI-blue)](ml/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black)](frontend/)
[![Firmware](https://img.shields.io/badge/Firmware-ESP32%20Arduino-orange)](firmware/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Overview

The Digital Stethoscope is a full-stack IoT platform that uses acoustic signal processing and machine learning to detect water pipe leaks before they become catastrophic. ESP32 microcontrollers act as "stethoscopes" — clamped to pipes, they sample acoustic vibrations at 4 kHz, extract FFT features, and stream readings to a cloud backend that runs ML inference in real time.

### Key capabilities

| Capability | Detail |
|---|---|
| **Acoustic leak detection** | 4-class classification: Normal → Pre-Leak → Minor Leak → Major Leak |
| **Real-time dashboard** | Live readings, severity trends, zone heatmaps via Supabase Realtime |
| **ML inference** | LightGBM model trained on 94 acoustic + spectral features |
| **Circuit breaker** | Automatic fallback to heuristics when ML service is unavailable |
| **Push notifications** | Web Push alerts when leaks are detected |
| **Multi-zone support** | Tracks 1000+ pipes across multiple zones |
| **ESP32 firmware** | Ready-to-flash Arduino firmware with FFT + HTTP POST |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ESP32 Devices                            │
│  Piezo mic → ADC → FFT → HTTP POST /ingest (X-API-Key)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API  :4000                            │
│  Express · TypeScript · Clerk Auth · Rate Limiting · Tracing   │
│                                                                 │
│  POST /ingest ──► Validate ──► ML Inference ──► Store ──► Alert│
│  GET  /health                                                   │
│  GET  /health/ml                                                │
│  GET  /health/metrics                                           │
│  POST /push/subscribe                                           │
└──────────┬──────────────────────────┬───────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌───────────────────────────────────────┐
│  ML Service :8000│      │         Supabase (PostgreSQL)         │
│  FastAPI · Python│      │  readings · predictions · alerts      │
│  LightGBM 94-feat│      │  pipes · users · push_subscriptions   │
│  Circuit Breaker │      │  Realtime enabled on all tables       │
│  5-min cache     │      └───────────────────────────────────────┘
└──────────────────┘                  │
                                      │ Supabase Realtime (WebSocket)
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Frontend  :3000                               │
│  Next.js 14 · Clerk Auth · Recharts · Tailwind CSS             │
│                                                                 │
│  /dashboard   — Live KPIs, severity trend, zone heatmap        │
│  /alerts      — Alert management, acknowledge/resolve          │
│  /ai-monitor  — Live waveform, FFT spectrum, inference pipeline │
│  /analytics   — Historical trends                              │
│  /pipes       — Pipe registry                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation

**Complete documentation suite for hardware, software, and deployment:**

| Document | Purpose | Time | Audience |
|----------|---------|------|----------|
| **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** | 📑 Complete documentation index | 5 min | Everyone |
| **[QUICK_START_HARDWARE.md](QUICK_START_HARDWARE.md)** | ⚡ Deploy first sensor in 30 minutes | 30 min | Hardware users |
| **[HARDWARE_SETUP.md](HARDWARE_SETUP.md)** | 🔧 Complete assembly & deployment guide | 60 min | Hardware engineers |
| **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** | 📡 REST API reference with examples | 30 min | Developers |
| **[UI_IMPROVEMENTS.md](UI_IMPROVEMENTS.md)** | 🎨 UI/UX design guide & component library | 40 min | Frontend developers |
| **[VISUAL_GUIDE.md](VISUAL_GUIDE.md)** | 👁️ Visual reference for UI & hardware | 20 min | Designers |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | 📊 Comprehensive project overview | 20 min | Stakeholders |
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | ✅ Recent improvements summary | 15 min | Team leads |

**Quick links:**
- 🚀 **New user?** Start with [README.md](README.md) → [QUICK_START_HARDWARE.md](QUICK_START_HARDWARE.md)
- 🔧 **Hardware engineer?** See [HARDWARE_SETUP.md](HARDWARE_SETUP.md)
- 💻 **Developer?** Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- 🎨 **Designer?** Read [UI_IMPROVEMENTS.md](UI_IMPROVEMENTS.md)

## Repository Structure

```
.
├── backend/                  # Node.js / Express API
│   ├── src/
│   │   ├── api/              # Route handlers (ingest, health, push)
│   │   ├── services/         # Business logic (ml, ingest, alert, notification)
│   │   ├── middleware/       # Auth (Clerk + device API key)
│   │   ├── lib/              # Circuit breaker, cache, tracing, errors, logger
│   │   ├── schemas/          # Zod validation schemas
│   │   └── server.ts         # Express app entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # Next.js 14 App Router
│   ├── app/
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── api/              # API routes (settings, Clerk webhook)
│   │   ├── sign-in/          # Clerk auth pages
│   │   └── sign-up/
│   ├── components/           # UI components (charts, enterprise panels)
│   ├── hooks/                # useRealTimeReadings, useRealTimeAlerts
│   ├── lib/                  # Supabase client, API helpers, utils
│   ├── locales/              # i18n (en, hi, kn, ta, te)
│   └── Dockerfile
│
├── ml/                       # Python ML inference service
│   ├── app.py                # FastAPI app with LightGBM inference
│   ├── simple_app.py         # Lightweight heuristic server (no dependencies, for demo/testing)
│   ├── models/               # Trained model + normalisation stats
│   │   ├── lightgbm_model.joblib
│   │   ├── cnn_model.h5                      # CNN model (alternative inference)
│   │   ├── feature_normalisation_stats.json
│   │   ├── fft_normalisation_stats.json
│   │   └── contextual_normalisation_stats.json
│   ├── requirements.txt
│   └── Dockerfile
│
├── firmware/                 # ESP32 Arduino firmware
│   └── esp32_stethoscope/
│       ├── esp32_stethoscope.ino   # Main firmware
│       └── ntp_time.h              # NTP time sync helper
│
├── database/
│   ├── schema.sql            # Full PostgreSQL schema for Supabase
│   └── seed_data.py          # Sample data loader (27 real readings)
│
├── data/                     # Training datasets
│   ├── data_v1/              # CSV format (684 samples × 1460 ADC values)
│   ├── data_v2/              # Excel format (labelled readings)
│   └── data_v3/              # Additional dataset version
│
├── docker-compose.yml        # Production Docker Compose
├── docker-compose.dev.yml    # Development Docker Compose
├── docker-compose.prod.yml   # Production with Redis + Nginx
├── nginx.conf                # Nginx reverse proxy config
├── SETUP.md                  # Detailed setup guide
└── .env.dev                  # Development environment template (copy to .env)
```

---

## ML Pipeline

The LightGBM model classifies pipe acoustic signals into 4 classes:

```
0 → Normal      (no leak)
1 → Pre-Leak    (early warning, mapped to minor_leak in DB)
2 → Minor Leak  (active small leak)
3 → Major Leak  (critical — immediate action required)
```

### Feature vector (94 features)

| Block | Count | Features |
|---|---|---|
| Signal statistics | 12 | mean, std, min, max, median, RMS, peak-to-peak, skewness, kurtosis, ZCR, energy, crest factor |
| FFT spectral | 8 | dominant frequency, centroid, bandwidth, rolloff, energy, flatness, entropy, top-3 ratio |
| Wavelet bands | 5 | cA3, cD3, cD2, cD1 energies + reconstruction error |
| Autocorrelation | 3 | lag-1, lag-5, lag-10 |
| Contextual | 2 | humidity, temperature |
| Sub-band energies | 56 | FFT magnitude² across 56 equal frequency bands |
| **Total** | **94** | |

### Fallback heuristic

When the ML service is unavailable, the backend uses a rule-based fallback:
- `frequency_hz < 20 && anomaly_score < 0.3` → Normal
- `frequency_hz 20–45 && anomaly_score ≥ 0.3` → Minor Leak
- `frequency_hz ≥ 45 || anomaly_score ≥ 0.85` → Major Leak

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (for containerised deployment)
- Supabase account
- Clerk account

### 1. Clone and configure

```bash
git clone https://github.com/tejaswinisa1/water_leakage-unisys-.git
cd water_leakage-unisys-
```

Copy and fill in environment files:

```bash
cp .env.dev .env
# Edit backend/.env and frontend/.env.local with your real credentials
# See SETUP.md for full details
```

### 2. Database setup

```sql
-- Run in Supabase SQL Editor
-- File: database/schema.sql
```

Enable Realtime on tables: `readings`, `alerts`, `predictions`

### 3. Run with Docker (recommended)

```bash
docker-compose up --build
```

Services start on:
- Frontend → http://localhost:3000
- Backend  → http://localhost:4000
- ML       → http://localhost:8000

### 4. Run in development mode

```bash
# Terminal 1 — ML service
cd ml
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Backend
cd backend
npm install
npm run dev

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev
```

### 5. Seed sample data

```bash
python database/seed_data.py \
  --api-url http://localhost:4000 \
  --api-key your_device_api_key
```

---

## ESP32 Firmware

Edit the configuration block in `firmware/esp32_stethoscope/esp32_stethoscope.ino`:

```cpp
#define WIFI_SSID      "YOUR_WIFI_SSID"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"
#define BACKEND_URL    "http://YOUR_BACKEND_IP:4000/ingest"
#define DEVICE_API_KEY "your_device_api_key_here"
#define PIPE_ID        "P101"
#define ZONE_ID        "Z1"
```

**Required Arduino libraries** (install via Library Manager):
- `ArduinoJson` ≥ 6.x
- `arduinoFFT` ≥ 2.x (by Enrique Condes)
- `WiFi` (built-in ESP32)
- `HTTPClient` (built-in ESP32)

The firmware samples 512 ADC values at 4 kHz every 60 seconds, computes FFT features, and POSTs a JSON reading to the backend.

---

## Security

- **Authentication**: Clerk JWT for web users; HMAC-hashed API key for ESP32 devices
- **No secrets in code**: All credentials via environment variables (see `.gitignore`)
- **Rate limiting**: 1000 req/min global, 500 req/min on `/ingest`
- **Input validation**: Zod schemas on all API inputs
- **ML response validation**: Zod schema validates ML service responses before use
- **Timing-safe comparison**: Device API key checked with `crypto.timingSafeEqual`

---

## API Reference

### Backend (`:4000`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/ingest` | X-API-Key or Bearer | Ingest single reading from ESP32 |
| `POST` | `/ingest/batch` | X-API-Key or Bearer | Batch ingest (up to 100 readings) |
| `GET` | `/health` | — | System health (DB + ML service) |
| `GET` | `/health/ml` | — | ML service health detail |
| `GET` | `/health/metrics` | — | Circuit breaker + cache metrics |
| `POST` | `/push/subscribe` | Bearer | Subscribe to Web Push notifications |
| `DELETE` | `/push/subscribe` | Bearer | Unsubscribe |
| `GET` | `/push/vapid-public-key` | — | VAPID public key for frontend |

### ML Service (`:8000`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict` | Run inference on sensor features + optional signal |
| `POST` | `/simulate` | Run inference on uploaded WAV file |
| `GET` | `/health` | Model load status |

---

## Backend Architecture Highlights

### Circuit Breaker
Protects the backend from ML service failures. Opens after 3 consecutive failures, waits 30 seconds, then tests recovery with a half-open state.

### Prediction Cache
In-memory cache (5-minute TTL) for identical sensor feature sets. Reduces ML service load significantly for repeated readings from stable pipes.

### Request Tracing
Every request gets a UUID trace ID (`X-Trace-ID` header) that propagates to the ML service, enabling cross-service debugging.

### Structured Error Handling
Custom error classes (`ValidationError`, `MLServiceError`, `DatabaseError`, `NotFoundError`) with consistent JSON error responses.

---

## Internationalisation

The frontend supports 5 languages:

| Code | Language |
|---|---|
| `en` | English |
| `hi` | Hindi |
| `kn` | Kannada |
| `ta` | Tamil |
| `te` | Telugu |

---

## Database Schema

Key tables in Supabase PostgreSQL:

| Table | Purpose |
|---|---|
| `pipes` | Pipe registry (pipe_id, zone_id, location, material, status) |
| `readings` | Sensor readings (pressure, flow, frequency, anomaly_score, leak flag) |
| `predictions` | ML inference results (leak_class, probabilities, confidence) |
| `alerts` | Triggered alerts (type, severity, status: active/acknowledged/resolved) |
| `users` | Clerk user metadata (role, zone_access, push_token) |

Views: `zone_summary`, `pipe_latest_reading`

---

## Dataset

Training data in `data/`:

| Version | Format | Samples | Features |
|---|---|---|---|
| v1 | CSV | 684 | 1460 raw ADC values per sample |
| v2 | Excel | — | Labelled readings |
| v3 | — | — | Additional dataset version |

Labels: `0` = Normal, `1` = Pre-Leak, `2` = Minor Leak, `3` = Major Leak

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: description"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

Please ensure:
- No secrets or credentials in commits
- Backend TypeScript builds cleanly (`npm run build`)
- New API endpoints have Zod validation

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Team

Built for the **Unisys Innovation Program 2026** — Digital Stethoscope track.

> *"Every drop counts. Listen to your pipes."*
