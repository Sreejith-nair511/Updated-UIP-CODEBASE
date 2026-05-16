"""
Digital Stethoscope — Sample Data Loader
=========================================
Loads the dataset3.txt data (and generates additional synthetic records)
into Supabase via the ingestion API.

Usage:
    python seed_data.py --api-url http://localhost:4000 --count 100
"""

import os
import sys
import json
import time
import argparse
import requests
from datetime import datetime, timedelta
from pathlib import Path

# ─── Dataset from dataset3.txt ────────────────────────────────────────────────
DATASET3 = [
    {"date": "2026-02-01", "time": "08:00", "zone": "Z1", "pipe": "P101", "pressure": 5.2, "flow": 120, "leak": 0, "severity": 0, "freq": 12.3, "temp": 28.5, "humidity": 45, "valve": "OPEN", "anomaly": 0.12},
    {"date": "2026-02-01", "time": "12:00", "zone": "Z2", "pipe": "P203", "pressure": 5.5, "flow": 130, "leak": 0, "severity": 0, "freq": 11.8, "temp": 29.1, "humidity": 48, "valve": "OPEN", "anomaly": 0.10},
    {"date": "2026-02-02", "time": "09:00", "zone": "Z3", "pipe": "P305", "pressure": 6.1, "flow": 150, "leak": 1, "severity": 22, "freq": 35.6, "temp": 30.2, "humidity": 60, "valve": "OPEN", "anomaly": 0.78},
    {"date": "2026-02-03", "time": "14:00", "zone": "Z1", "pipe": "P102", "pressure": 4.8, "flow": 110, "leak": 0, "severity": 0, "freq": 13.1, "temp": 27.9, "humidity": 44, "valve": "CLOSED", "anomaly": 0.15},
    {"date": "2026-02-04", "time": "10:00", "zone": "Z4", "pipe": "P401", "pressure": 6.5, "flow": 170, "leak": 1, "severity": 45, "freq": 52.3, "temp": 31.0, "humidity": 65, "valve": "OPEN", "anomaly": 0.91},
    {"date": "2026-02-05", "time": "16:00", "zone": "Z2", "pipe": "P204", "pressure": 5.0, "flow": 125, "leak": 0, "severity": 0, "freq": 12.5, "temp": 29.3, "humidity": 47, "valve": "OPEN", "anomaly": 0.11},
    {"date": "2026-02-07", "time": "11:00", "zone": "Z5", "pipe": "P501", "pressure": 6.8, "flow": 180, "leak": 1, "severity": 67, "freq": 60.1, "temp": 32.5, "humidity": 70, "valve": "OPEN", "anomaly": 0.96},
    {"date": "2026-02-10", "time": "09:30", "zone": "Z3", "pipe": "P306", "pressure": 5.9, "flow": 145, "leak": 0, "severity": 0, "freq": 14.2, "temp": 30.0, "humidity": 52, "valve": "OPEN", "anomaly": 0.18},
    {"date": "2026-02-12", "time": "13:00", "zone": "Z4", "pipe": "P402", "pressure": 6.3, "flow": 165, "leak": 1, "severity": 39, "freq": 48.7, "temp": 31.3, "humidity": 63, "valve": "OPEN", "anomaly": 0.88},
    {"date": "2026-02-15", "time": "08:45", "zone": "Z1", "pipe": "P103", "pressure": 5.1, "flow": 118, "leak": 0, "severity": 0, "freq": 12.9, "temp": 28.0, "humidity": 46, "valve": "CLOSED", "anomaly": 0.14},
    {"date": "2026-02-18", "time": "17:00", "zone": "Z2", "pipe": "P205", "pressure": 6.0, "flow": 140, "leak": 1, "severity": 28, "freq": 41.5, "temp": 29.8, "humidity": 58, "valve": "OPEN", "anomaly": 0.82},
    {"date": "2026-02-20", "time": "10:30", "zone": "Z5", "pipe": "P502", "pressure": 7.0, "flow": 190, "leak": 1, "severity": 72, "freq": 65.4, "temp": 33.0, "humidity": 72, "valve": "OPEN", "anomaly": 0.97},
    {"date": "2026-02-25", "time": "12:00", "zone": "Z3", "pipe": "P307", "pressure": 5.7, "flow": 138, "leak": 0, "severity": 0, "freq": 13.5, "temp": 30.5, "humidity": 50, "valve": "OPEN", "anomaly": 0.16},
    {"date": "2026-02-28", "time": "15:00", "zone": "Z4", "pipe": "P403", "pressure": 6.4, "flow": 168, "leak": 1, "severity": 50, "freq": 55.2, "temp": 31.7, "humidity": 66, "valve": "OPEN", "anomaly": 0.92},
    {"date": "2026-03-01", "time": "09:00", "zone": "Z1", "pipe": "P104", "pressure": 5.3, "flow": 122, "leak": 0, "severity": 0, "freq": 12.0, "temp": 28.2, "humidity": 45, "valve": "OPEN", "anomaly": 0.13},
    {"date": "2026-03-03", "time": "11:30", "zone": "Z2", "pipe": "P206", "pressure": 6.2, "flow": 150, "leak": 1, "severity": 33, "freq": 44.6, "temp": 29.7, "humidity": 59, "valve": "OPEN", "anomaly": 0.85},
    {"date": "2026-03-05", "time": "14:00", "zone": "Z5", "pipe": "P503", "pressure": 7.2, "flow": 200, "leak": 1, "severity": 80, "freq": 70.2, "temp": 33.5, "humidity": 75, "valve": "OPEN", "anomaly": 0.99},
    {"date": "2026-03-08", "time": "08:15", "zone": "Z3", "pipe": "P308", "pressure": 5.6, "flow": 135, "leak": 0, "severity": 0, "freq": 13.8, "temp": 30.1, "humidity": 51, "valve": "CLOSED", "anomaly": 0.17},
    {"date": "2026-03-10", "time": "16:30", "zone": "Z4", "pipe": "P404", "pressure": 6.6, "flow": 175, "leak": 1, "severity": 55, "freq": 58.9, "temp": 32.0, "humidity": 68, "valve": "OPEN", "anomaly": 0.93},
    {"date": "2026-03-12", "time": "10:00", "zone": "Z1", "pipe": "P105", "pressure": 5.0, "flow": 115, "leak": 0, "severity": 0, "freq": 12.6, "temp": 28.4, "humidity": 46, "valve": "OPEN", "anomaly": 0.12},
    {"date": "2026-03-15", "time": "13:45", "zone": "Z2", "pipe": "P207", "pressure": 6.1, "flow": 148, "leak": 1, "severity": 37, "freq": 46.1, "temp": 29.9, "humidity": 60, "valve": "OPEN", "anomaly": 0.87},
    {"date": "2026-03-18", "time": "09:20", "zone": "Z5", "pipe": "P504", "pressure": 7.3, "flow": 205, "leak": 1, "severity": 85, "freq": 72.5, "temp": 34.0, "humidity": 78, "valve": "OPEN", "anomaly": 0.995},
    {"date": "2026-03-20", "time": "15:10", "zone": "Z3", "pipe": "P309", "pressure": 5.8, "flow": 140, "leak": 0, "severity": 0, "freq": 14.0, "temp": 30.3, "humidity": 53, "valve": "OPEN", "anomaly": 0.19},
    {"date": "2026-03-22", "time": "11:00", "zone": "Z4", "pipe": "P405", "pressure": 6.7, "flow": 178, "leak": 1, "severity": 60, "freq": 61.7, "temp": 32.2, "humidity": 69, "valve": "OPEN", "anomaly": 0.94},
    {"date": "2026-03-25", "time": "08:30", "zone": "Z1", "pipe": "P106", "pressure": 5.2, "flow": 120, "leak": 0, "severity": 0, "freq": 12.7, "temp": 28.6, "humidity": 47, "valve": "CLOSED", "anomaly": 0.13},
    {"date": "2026-03-28", "time": "14:20", "zone": "Z2", "pipe": "P208", "pressure": 6.3, "flow": 152, "leak": 1, "severity": 42, "freq": 49.3, "temp": 30.0, "humidity": 61, "valve": "OPEN", "anomaly": 0.89},
    {"date": "2026-03-30", "time": "17:00", "zone": "Z5", "pipe": "P505", "pressure": 7.5, "flow": 210, "leak": 1, "severity": 90, "freq": 75.0, "temp": 34.5, "humidity": 80, "valve": "OPEN", "anomaly": 0.999},
]


def send_reading(api_url: str, reading: dict, api_key: str | None = None) -> dict:
    """Send a single reading to the ingestion API."""
    payload = {
        "pipe_id": reading["pipe"],
        "zone_id": reading["zone"],
        "reading_date": reading["date"],
        "reading_time": reading["time"],
        "pressure_bar": reading["pressure"],
        "flow_lpm": reading["flow"],
        "frequency_hz": reading["freq"],
        "temp_c": reading["temp"],
        "humidity_pct": reading["humidity"],
        "valve_status": reading["valve"],
        "anomaly_score": reading["anomaly"],
        "dominant_frequency": reading["freq"] * 1.02,
    }

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key

    response = requests.post(
        f"{api_url}/ingest",
        json=payload,
        headers=headers,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def send_batch(api_url: str, readings: list[dict], api_key: str | None = None) -> dict:
    """Send a batch of readings."""
    payloads = [
        {
            "pipe_id": r["pipe"],
            "zone_id": r["zone"],
            "reading_date": r["date"],
            "reading_time": r["time"],
            "pressure_bar": r["pressure"],
            "flow_lpm": r["flow"],
            "frequency_hz": r["freq"],
            "temp_c": r["temp"],
            "humidity_pct": r["humidity"],
            "valve_status": r["valve"],
            "anomaly_score": r["anomaly"],
            "dominant_frequency": r["freq"] * 1.02,
        }
        for r in readings
    ]

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key

    response = requests.post(
        f"{api_url}/ingest/batch",
        json={"readings": payloads},
        headers=headers,
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def main():
    parser = argparse.ArgumentParser(description="Seed Digital Stethoscope with sample data")
    parser.add_argument("--api-url", default="http://localhost:4000", help="Backend API URL")
    parser.add_argument("--api-key", default=None, help="API key (if required)")
    parser.add_argument("--batch", action="store_true", help="Use batch ingestion")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between requests (seconds)")
    args = parser.parse_args()

    print(f"\n🌱 Digital Stethoscope — Data Seeder")
    print(f"   API: {args.api_url}")
    print(f"   Records: {len(DATASET3)}")
    print("=" * 50)

    if args.batch:
        print(f"\n📦 Sending batch of {len(DATASET3)} records...")
        try:
            result = send_batch(args.api_url, DATASET3, args.api_key)
            print(f"✓ Batch complete: {result.get('processed', 0)} records processed")
        except Exception as e:
            print(f"✗ Batch failed: {e}")
            sys.exit(1)
    else:
        success = 0
        failed = 0
        for i, reading in enumerate(DATASET3, 1):
            try:
                result = send_reading(args.api_url, reading, args.api_key)
                pred = result.get("data", {}).get("prediction", {})
                status = "🔴 LEAK" if pred.get("leak_class") != "no_leak" else "🟢 OK"
                print(
                    f"  [{i:2d}/{len(DATASET3)}] {reading['pipe']} ({reading['zone']}) "
                    f"— {status} | {pred.get('leak_class', '?')} "
                    f"| severity={pred.get('severity_estimate', 0):.0f}%"
                )
                success += 1
            except Exception as e:
                print(f"  [{i:2d}/{len(DATASET3)}] {reading['pipe']} — ✗ FAILED: {e}")
                failed += 1

            if args.delay > 0:
                time.sleep(args.delay)

        print(f"\n{'='*50}")
        print(f"✅ Done: {success} succeeded, {failed} failed")


if __name__ == "__main__":
    main()
