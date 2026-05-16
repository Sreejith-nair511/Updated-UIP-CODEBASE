# API Documentation — Digital Stethoscope

> **Complete REST API reference for the Digital Stethoscope backend**

**Base URL:** `http://YOUR_BACKEND_IP:4000`  
**Version:** 1.0.0  
**Protocol:** HTTP/HTTPS  
**Format:** JSON

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
   - [Ingestion](#ingestion)
   - [Health & Monitoring](#health--monitoring)
   - [Push Notifications](#push-notifications)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Examples](#examples)

---

## Authentication

The API supports two authentication methods:

### 1. Device API Key (for ESP32 sensors)

Include in request headers:
```http
X-API-Key: your_device_api_key_here
```

**Obtaining a device API key:**

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
  "pipe_id": "P101",
  "zone_id": "Z1"
}
```

### 2. Bearer Token (for web users)

Include Clerk JWT in request headers:
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Endpoints

### Ingestion

#### POST `/ingest`

Ingest a single sensor reading from an ESP32 device.

**Authentication:** Device API Key or Bearer Token  
**Rate Limit:** 500 requests/minute per device

**Request Body:**

```json
{
  "pipe_id": "P101",
  "zone_id": "Z1",
  "reading_date": "2026-05-12",
  "reading_time": "14:32:18",
  "pressure_bar": 3.5,
  "flow_lpm": 45.2,
  "frequency_hz": 15.3,
  "temp_c": 22.5,
  "humidity_pct": 55.0,
  "valve_status": "OPEN",
  "anomaly_score": 0.123,
  "dominant_frequency": 15.3,
  "signal": [0.01, -0.02, 0.03, ...],  // Optional: 8000 float samples
  "sample_rate": 4000                   // Optional: sampling rate in Hz
}
```

**Response (201 Created):**

```json
{
  "reading_id": "550e8400-e29b-41d4-a716-446655440000",
  "prediction": {
    "leak_class_id": 0,
    "leak_class_name": "Normal",
    "confidence": 0.92,
    "probabilities": {
      "Normal": 0.92,
      "Pre-Leak": 0.05,
      "Minor Leak": 0.02,
      "Major Leak": 0.01
    },
    "severity_pct": 8,
    "inference_ms": 184,
    "model_version": "1.0.0"
  },
  "alert_triggered": false,
  "timestamp": "2026-05-12T14:32:18.456Z"
}
```

**Validation Rules:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `pipe_id` | string | ✓ | 1-50 chars, alphanumeric + underscore |
| `zone_id` | string | ✓ | 1-50 chars |
| `reading_date` | string | ✓ | ISO 8601 date (YYYY-MM-DD) |
| `reading_time` | string | ✓ | HH:MM:SS format |
| `pressure_bar` | number | ✓ | 0-20 bar |
| `flow_lpm` | number | ✓ | 0-1000 LPM |
| `frequency_hz` | number | ✓ | 0-2000 Hz |
| `temp_c` | number | ✗ | -50 to 100°C |
| `humidity_pct` | number | ✗ | 0-100% |
| `valve_status` | string | ✗ | OPEN, CLOSED, PARTIAL |
| `anomaly_score` | number | ✓ | 0-1 (float) |
| `dominant_frequency` | number | ✗ | 0-2000 Hz |
| `signal` | array | ✗ | 512-8000 float values |
| `sample_rate` | number | ✗ | 1000-48000 Hz |

---

#### POST `/ingest/batch`

Ingest multiple readings in a single request (up to 100).

**Authentication:** Device API Key or Bearer Token  
**Rate Limit:** 100 requests/minute

**Request Body:**

```json
{
  "readings": [
    {
      "pipe_id": "P101",
      "zone_id": "Z1",
      "reading_date": "2026-05-12",
      "reading_time": "14:32:18",
      "pressure_bar": 3.5,
      "flow_lpm": 45.2,
      "frequency_hz": 15.3,
      "anomaly_score": 0.123
    },
    {
      "pipe_id": "P102",
      "zone_id": "Z1",
      "reading_date": "2026-05-12",
      "reading_time": "14:32:20",
      "pressure_bar": 3.6,
      "flow_lpm": 46.1,
      "frequency_hz": 16.2,
      "anomaly_score": 0.145
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "reading_id": "550e8400-e29b-41d4-a716-446655440000",
      "pipe_id": "P101",
      "status": "success",
      "prediction": { ... }
    },
    {
      "reading_id": "550e8400-e29b-41d4-a716-446655440001",
      "pipe_id": "P102",
      "status": "success",
      "prediction": { ... }
    }
  ],
  "timestamp": "2026-05-12T14:32:20.789Z"
}
```

---

### Health & Monitoring

#### GET `/health`

Check overall system health (database + ML service).

**Authentication:** None  
**Rate Limit:** 1000 requests/minute

**Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2026-05-12T14:32:18.456Z",
  "uptime_seconds": 86400,
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "latency_ms": 12
  },
  "ml_service": {
    "status": "available",
    "url": "http://ml-service:8000",
    "latency_ms": 184,
    "models_loaded": true,
    "cnn_model_version": "1.0.0"
  }
}
```

**Status Values:**
- `healthy` — All systems operational
- `degraded` — ML service unavailable (using fallback heuristics)
- `unhealthy` — Database connection failed

---

#### GET `/health/ml`

Detailed ML service health check.

**Authentication:** None  
**Rate Limit:** 1000 requests/minute

**Response (200 OK):**

```json
{
  "status": "available",
  "url": "http://ml-service:8000",
  "latency_ms": 184,
  "models_loaded": true,
  "cnn_model_version": "1.0.0",
  "lightgbm_model_version": "1.0.0",
  "last_check": "2026-05-12T14:32:18.456Z",
  "circuit_breaker": {
    "state": "closed",
    "failure_count": 0,
    "success_count": 1234,
    "last_failure": null
  }
}
```

**Circuit Breaker States:**
- `closed` — Normal operation
- `open` — Too many failures, using fallback
- `half_open` — Testing recovery

---

#### GET `/health/metrics`

System performance metrics.

**Authentication:** Bearer Token (admin only)  
**Rate Limit:** 100 requests/minute

**Response (200 OK):**

```json
{
  "timestamp": "2026-05-12T14:32:18.456Z",
  "requests": {
    "total": 12345,
    "per_minute": 42,
    "per_hour": 2520
  },
  "ml_inference": {
    "total": 12000,
    "cache_hits": 3600,
    "cache_hit_rate": 0.30,
    "avg_latency_ms": 184,
    "p95_latency_ms": 245,
    "p99_latency_ms": 312
  },
  "circuit_breaker": {
    "state": "closed",
    "failure_count": 0,
    "success_count": 12000,
    "last_failure": null,
    "open_duration_seconds": 0
  },
  "database": {
    "connections": 10,
    "queries_per_second": 15,
    "avg_query_ms": 8
  }
}
```

---

### Push Notifications

#### POST `/push/subscribe`

Subscribe to Web Push notifications.

**Authentication:** Bearer Token  
**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=",
      "auth": "tBHItJI5svbpez7KI4CCXg=="
    }
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "subscription_id": "sub_abc123",
  "message": "Successfully subscribed to push notifications"
}
```

---

#### DELETE `/push/subscribe`

Unsubscribe from Web Push notifications.

**Authentication:** Bearer Token  
**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Successfully unsubscribed from push notifications"
}
```

---

#### GET `/push/vapid-public-key`

Get VAPID public key for Web Push setup.

**Authentication:** None  
**Rate Limit:** 1000 requests/minute

**Response (200 OK):**

```json
{
  "publicKey": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM="
}
```

---

## Data Models

### Reading

```typescript
interface Reading {
  id: string;                    // UUID
  pipe_id: string;               // Pipe identifier
  zone_id: string;               // Zone identifier
  reading_date: string;          // ISO 8601 date
  reading_time: string;          // HH:MM:SS
  pressure_bar: number;          // Water pressure (bar)
  flow_lpm: number;              // Flow rate (liters/min)
  frequency_hz: number;          // Dominant frequency (Hz)
  temp_c?: number;               // Temperature (°C)
  humidity_pct?: number;         // Humidity (%)
  valve_status?: string;         // OPEN | CLOSED | PARTIAL
  anomaly_score: number;         // 0-1 anomaly score
  dominant_frequency?: number;   // FFT peak (Hz)
  leak: boolean;                 // Leak detected flag
  severity_pct: number;          // 0-100 severity
  created_at: string;            // ISO 8601 timestamp
}
```

### Prediction

```typescript
interface Prediction {
  id: string;                    // UUID
  reading_id: string;            // Foreign key to reading
  leak_class_id: number;         // 0=Normal, 1=Pre-Leak, 2=Minor, 3=Major
  leak_class_name: string;       // Human-readable class name
  confidence: number;            // 0-1 model confidence
  probabilities: {               // Per-class probabilities
    Normal: number;
    "Pre-Leak": number;
    "Minor Leak": number;
    "Major Leak": number;
  };
  inference_ms: number;          // Inference latency
  model_version: string;         // Model version used
  created_at: string;            // ISO 8601 timestamp
}
```

### Alert

```typescript
interface Alert {
  id: string;                    // UUID
  pipe_id: string;               // Pipe identifier
  zone_id: string;               // Zone identifier
  alert_type: string;            // major_leak | minor_leak | anomaly
  severity_pct: number;          // 0-100 severity
  message: string;               // Human-readable message
  leak_probability: number;      // 0-1 probability
  status: string;                // active | acknowledged | resolved
  acknowledged_by?: string;      // User ID
  acknowledged_at?: string;      // ISO 8601 timestamp
  resolved_at?: string;          // ISO 8601 timestamp
  created_at: string;            // ISO 8601 timestamp
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "field": "pressure_bar",
      "issue": "must be between 0 and 20"
    },
    "trace_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body or parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `ML_SERVICE_ERROR` | 503 | ML service unavailable (fallback used) |
| `DATABASE_ERROR` | 503 | Database connection failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

Rate limits are enforced per IP address (or per device for authenticated requests).

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/ingest` | 500 requests | 1 minute |
| `/ingest/batch` | 100 requests | 1 minute |
| `/health` | 1000 requests | 1 minute |
| `/push/*` | 10 requests | 1 minute |
| Global | 1000 requests | 1 minute |

**Rate limit headers:**

```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1715524338
```

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 42 seconds.",
    "retry_after": 42
  }
}
```

---

## Examples

### ESP32 Arduino Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define BACKEND_URL "http://192.168.1.100:4000/ingest"
#define API_KEY "sk_live_abc123..."

void postReading(float pressure, float flow, float freq, float anomaly) {
  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  
  StaticJsonDocument<512> doc;
  doc["pipe_id"] = "P101";
  doc["zone_id"] = "Z1";
  doc["reading_date"] = "2026-05-12";
  doc["reading_time"] = "14:32:18";
  doc["pressure_bar"] = pressure;
  doc["flow_lpm"] = flow;
  doc["frequency_hz"] = freq;
  doc["anomaly_score"] = anomaly;
  doc["valve_status"] = "OPEN";
  
  String payload;
  serializeJson(doc, payload);
  
  int code = http.POST(payload);
  if (code == 201) {
    Serial.println("✓ Reading posted successfully");
  } else {
    Serial.printf("✗ POST failed: %d\n", code);
  }
  http.end();
}
```

### Python Client

```python
import requests
from datetime import datetime

BACKEND_URL = "http://192.168.1.100:4000"
API_KEY = "sk_live_abc123..."

def post_reading(pipe_id, zone_id, pressure, flow, frequency, anomaly):
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }
    
    now = datetime.now()
    payload = {
        "pipe_id": pipe_id,
        "zone_id": zone_id,
        "reading_date": now.strftime("%Y-%m-%d"),
        "reading_time": now.strftime("%H:%M:%S"),
        "pressure_bar": pressure,
        "flow_lpm": flow,
        "frequency_hz": frequency,
        "anomaly_score": anomaly,
        "valve_status": "OPEN"
    }
    
    response = requests.post(
        f"{BACKEND_URL}/ingest",
        json=payload,
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Reading posted: {data['reading_id']}")
        print(f"  Prediction: {data['prediction']['leak_class_name']}")
        print(f"  Confidence: {data['prediction']['confidence']:.2%}")
    else:
        print(f"✗ POST failed: {response.status_code}")
        print(response.text)

# Example usage
post_reading("P101", "Z1", 3.5, 45.2, 15.3, 0.123)
```

### JavaScript/TypeScript Client

```typescript
const BACKEND_URL = "http://192.168.1.100:4000";
const API_KEY = "sk_live_abc123...";

interface ReadingPayload {
  pipe_id: string;
  zone_id: string;
  reading_date: string;
  reading_time: string;
  pressure_bar: number;
  flow_lpm: number;
  frequency_hz: number;
  anomaly_score: number;
  valve_status: string;
}

async function postReading(payload: ReadingPayload) {
  const response = await fetch(`${BACKEND_URL}/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const data = await response.json();
    console.log("✓ Reading posted:", data.reading_id);
    console.log("  Prediction:", data.prediction.leak_class_name);
    console.log("  Confidence:", (data.prediction.confidence * 100).toFixed(1) + "%");
  } else {
    console.error("✗ POST failed:", response.status);
    console.error(await response.text());
  }
}

// Example usage
const now = new Date();
postReading({
  pipe_id: "P101",
  zone_id: "Z1",
  reading_date: now.toISOString().split("T")[0],
  reading_time: now.toTimeString().split(" ")[0],
  pressure_bar: 3.5,
  flow_lpm: 45.2,
  frequency_hz: 15.3,
  anomaly_score: 0.123,
  valve_status: "OPEN",
});
```

### cURL Examples

**Post a reading:**

```bash
curl -X POST http://192.168.1.100:4000/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_abc123..." \
  -d '{
    "pipe_id": "P101",
    "zone_id": "Z1",
    "reading_date": "2026-05-12",
    "reading_time": "14:32:18",
    "pressure_bar": 3.5,
    "flow_lpm": 45.2,
    "frequency_hz": 15.3,
    "anomaly_score": 0.123,
    "valve_status": "OPEN"
  }'
```

**Check health:**

```bash
curl http://192.168.1.100:4000/health
```

**Batch ingest:**

```bash
curl -X POST http://192.168.1.100:4000/ingest/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_abc123..." \
  -d '{
    "readings": [
      {
        "pipe_id": "P101",
        "zone_id": "Z1",
        "reading_date": "2026-05-12",
        "reading_time": "14:32:18",
        "pressure_bar": 3.5,
        "flow_lpm": 45.2,
        "frequency_hz": 15.3,
        "anomaly_score": 0.123
      },
      {
        "pipe_id": "P102",
        "zone_id": "Z1",
        "reading_date": "2026-05-12",
        "reading_time": "14:32:20",
        "pressure_bar": 3.6,
        "flow_lpm": 46.1,
        "frequency_hz": 16.2,
        "anomaly_score": 0.145
      }
    ]
  }'
```

---

## Support

- **GitHub Issues:** https://github.com/tejaswinisa1/water_leakage-unisys-/issues
- **Documentation:** https://github.com/tejaswinisa1/water_leakage-unisys-/blob/main/README.md
- **Email:** support@digitalstethoscope.io

---

**Last updated:** May 12, 2026  
**API Version:** 1.0.0  
**Compatible firmware:** ≥ 1.0.0
