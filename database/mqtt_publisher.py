#!/usr/bin/env python3
"""
Digital Stethoscope — MQTT Test Publisher
==========================================
Simulates ESP32 sensors publishing readings to HiveMQ.
Use this to test the MQTT → Backend → ML → Supabase pipeline
without physical hardware.

Usage:
  pip install paho-mqtt
  python database/mqtt_publisher.py
  python database/mqtt_publisher.py --broker mqtt-dashboard.com --port 1883
  python database/mqtt_publisher.py --scenario leak --pipe P101 --zone Z1
  python database/mqtt_publisher.py --csv  # publish from CSV data
"""

import argparse
import csv
import json
import math
import random
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("❌ paho-mqtt not installed. Run: pip install paho-mqtt")
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────────────

BROKER_HOST = "broker.hivemq.com"
BROKER_PORT = 1883
TOPIC_BASE  = "stethoscope/readings"

DATA_CSV  = Path(__file__).parent.parent / "data" / "data_v1" / "data.csv"
LABEL_CSV = Path(__file__).parent.parent / "data" / "data_v1" / "label.csv"

PIPES = [
    ("P101", "Z1"), ("P102", "Z1"), ("P103", "Z1"),
    ("P203", "Z2"), ("P204", "Z2"),
    ("P305", "Z3"), ("P306", "Z3"),
    ("P401", "Z4"),
    ("P501", "Z5"),
]

LABEL_TO_SCENARIO = {
    1: "normal", 2: "normal", 3: "normal",
    4: "pre_leak", 5: "pre_leak",
    6: "minor_leak", 7: "minor_leak", 8: "minor_leak",
    9: "major_leak", 10: "major_leak", 11: "major_leak", 12: "major_leak",
}

# ── Scenario generators ───────────────────────────────────────────────────────

def generate_reading(pipe_id: str, zone_id: str, scenario: str = "normal") -> dict:
    now = datetime.now()

    if scenario == "normal":
        freq     = random.uniform(10, 20)
        anomaly  = random.uniform(0.02, 0.15)
        pressure = random.uniform(3.2, 3.8)
        flow     = random.uniform(42, 48)
    elif scenario == "pre_leak":
        freq     = random.uniform(22, 38)
        anomaly  = random.uniform(0.28, 0.48)
        pressure = random.uniform(3.5, 4.0)
        flow     = random.uniform(45, 52)
    elif scenario == "minor_leak":
        freq     = random.uniform(38, 58)
        anomaly  = random.uniform(0.52, 0.72)
        pressure = random.uniform(3.8, 4.5)
        flow     = random.uniform(48, 58)
    elif scenario == "major_leak":
        freq     = random.uniform(60, 95)
        anomaly  = random.uniform(0.78, 0.98)
        pressure = random.uniform(4.2, 5.8)
        flow     = random.uniform(55, 72)
    else:
        freq     = random.uniform(10, 20)
        anomaly  = random.uniform(0.02, 0.15)
        pressure = random.uniform(3.2, 3.8)
        flow     = random.uniform(42, 48)

    return {
        "pipe_id":            pipe_id,
        "zone_id":            zone_id,
        "reading_date":       now.strftime("%Y-%m-%d"),
        "reading_time":       now.strftime("%H:%M:%S"),
        "pressure_bar":       round(pressure, 3),
        "flow_lpm":           round(flow, 2),
        "frequency_hz":       round(freq, 2),
        "temp_c":             round(random.uniform(20, 26), 2),
        "humidity_pct":       round(random.uniform(50, 65), 2),
        "valve_status":       "OPEN",
        "anomaly_score":      round(anomaly, 4),
        "dominant_frequency": round(freq, 2),
    }


def generate_from_adc(adc_values: list, pipe_id: str, zone_id: str, label: int) -> dict:
    """Generate a reading from raw ADC values with FFT feature extraction."""
    now = datetime.now()
    n = min(512, len(adc_values))
    signal = [v - 2048 for v in adc_values[:n]]

    # Simple FFT dominant frequency
    freq_resolution = 4000 / n
    best_freq = 15.0
    best_mag = 0.0
    for k in range(1, n // 2):
        real = sum(signal[t] * math.cos(2 * math.pi * k * t / n) for t in range(min(n, 64)))
        imag = sum(signal[t] * math.sin(2 * math.pi * k * t / n) for t in range(min(n, 64)))
        mag = math.sqrt(real**2 + imag**2)
        if mag > best_mag:
            best_mag = mag
            best_freq = k * freq_resolution

    scenario = LABEL_TO_SCENARIO.get(label, "normal")
    reading = generate_reading(pipe_id, zone_id, scenario)
    reading["frequency_hz"] = round(best_freq, 2)
    reading["dominant_frequency"] = round(best_freq, 2)

    # Include normalized signal
    max_val = max(abs(v) for v in signal) or 1
    reading["signal"] = [round(v / max_val, 4) for v in signal[:512]]
    reading["sample_rate"] = 4000

    return reading


# ── MQTT Client ───────────────────────────────────────────────────────────────

class StethoscopePublisher:
    def __init__(self, broker: str, port: int):
        self.broker = broker
        self.port = port
        self.client = mqtt.Client(client_id=f"stethoscope-publisher-{int(time.time())}")
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish
        self.connected = False
        self.published = 0

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            print(f"✅ Connected to MQTT broker: {self.broker}:{self.port}")
        else:
            print(f"❌ MQTT connection failed: rc={rc}")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        if rc != 0:
            print(f"⚠️  MQTT disconnected unexpectedly: rc={rc}")

    def _on_publish(self, client, userdata, mid):
        self.published += 1

    def connect(self) -> bool:
        try:
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.5)
                timeout -= 0.5
            return self.connected
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False

    def publish(self, pipe_id: str, payload: dict) -> bool:
        topic = f"{TOPIC_BASE}/{pipe_id}"
        msg = json.dumps(payload)
        result = self.client.publish(topic, msg, qos=1)
        return result.rc == mqtt.MQTT_ERR_SUCCESS

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()


# ── Modes ─────────────────────────────────────────────────────────────────────

def run_continuous(publisher: StethoscopePublisher, scenario: str, pipe: str, zone: str, interval: float):
    """Continuously publish readings for one pipe."""
    print(f"\n🔄 Publishing {scenario} readings for {pipe}/{zone} every {interval}s")
    print("   Press Ctrl+C to stop\n")
    count = 0
    try:
        while True:
            reading = generate_reading(pipe, zone, scenario)
            ok = publisher.publish(pipe, reading)
            count += 1
            status = "✓" if ok else "✗"
            print(
                f"  [{count:4d}] {status} {pipe}/{zone} "
                f"freq={reading['frequency_hz']:.1f}Hz "
                f"anomaly={reading['anomaly_score']:.3f} "
                f"scenario={scenario}"
            )
            time.sleep(interval)
    except KeyboardInterrupt:
        print(f"\n\nStopped. Published {count} readings.")


def run_all_pipes(publisher: StethoscopePublisher, interval: float, rounds: int):
    """Publish one reading per pipe, cycling through scenarios."""
    scenarios = ["normal", "normal", "normal", "pre_leak", "minor_leak", "major_leak"]
    print(f"\n🔄 Publishing to all {len(PIPES)} pipes, {rounds} rounds\n")
    total = 0
    for r in range(rounds):
        for i, (pipe_id, zone_id) in enumerate(PIPES):
            scenario = scenarios[i % len(scenarios)]
            reading = generate_reading(pipe_id, zone_id, scenario)
            ok = publisher.publish(pipe_id, reading)
            total += 1
            status = "✓" if ok else "✗"
            print(
                f"  [{total:4d}] {status} {pipe_id}/{zone_id} "
                f"freq={reading['frequency_hz']:.1f}Hz "
                f"anomaly={reading['anomaly_score']:.3f} "
                f"scenario={scenario}"
            )
            time.sleep(0.1)
        print(f"  --- Round {r+1}/{rounds} complete ---")
        time.sleep(interval)
    print(f"\n✅ Done. Published {total} readings.")


def run_from_csv(publisher: StethoscopePublisher, max_samples: int, delay: float):
    """Publish readings from the CSV training data."""
    if not DATA_CSV.exists():
        print(f"❌ {DATA_CSV} not found")
        return
    if not LABEL_CSV.exists():
        print(f"❌ {LABEL_CSV} not found")
        return

    print(f"\n📂 Loading CSV data...")
    with open(DATA_CSV) as f:
        data_rows = [list(map(int, row)) for row in csv.reader(f) if row]
    with open(LABEL_CSV) as f:
        labels = [int(row[0]) for row in csv.reader(f) if row]

    total = min(len(data_rows), len(labels), max_samples)
    print(f"   {total} samples loaded\n")

    for i in range(total):
        pipe_id, zone_id = PIPES[i % len(PIPES)]
        reading = generate_from_adc(data_rows[i], pipe_id, zone_id, labels[i])
        ok = publisher.publish(pipe_id, reading)
        scenario = LABEL_TO_SCENARIO.get(labels[i], "?")
        status = "✓" if ok else "✗"
        print(
            f"  [{i+1:4d}/{total}] {status} {pipe_id}/{zone_id} "
            f"label={labels[i]} ({scenario}) "
            f"freq={reading['frequency_hz']:.1f}Hz "
            f"anomaly={reading['anomaly_score']:.3f}"
        )
        time.sleep(delay)

    print(f"\n✅ Done. Published {total} readings from CSV.")


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="MQTT publisher for Digital Stethoscope (simulates ESP32 sensors)"
    )
    parser.add_argument("--broker",   default=BROKER_HOST, help=f"MQTT broker host (default: {BROKER_HOST})")
    parser.add_argument("--port",     type=int, default=BROKER_PORT, help=f"MQTT broker port (default: {BROKER_PORT})")
    parser.add_argument("--scenario", default="normal",
                        choices=["normal", "pre_leak", "minor_leak", "major_leak", "all"],
                        help="Leak scenario to simulate (default: normal)")
    parser.add_argument("--pipe",     default="P101", help="Pipe ID (default: P101)")
    parser.add_argument("--zone",     default="Z1",   help="Zone ID (default: Z1)")
    parser.add_argument("--interval", type=float, default=5.0, help="Seconds between readings (default: 5)")
    parser.add_argument("--rounds",   type=int,   default=3,   help="Rounds for --scenario all (default: 3)")
    parser.add_argument("--csv",      action="store_true",     help="Publish from CSV training data")
    parser.add_argument("--max",      type=int,   default=684, help="Max CSV samples to publish (default: 684)")
    parser.add_argument("--delay",    type=float, default=0.3, help="Delay between CSV messages (default: 0.3s)")

    args = parser.parse_args()

    print("=" * 60)
    print("  Digital Stethoscope — MQTT Publisher")
    print(f"  Broker: {args.broker}:{args.port}")
    print(f"  Topic:  {TOPIC_BASE}/<pipe_id>")
    print("=" * 60)

    publisher = StethoscopePublisher(args.broker, args.port)
    if not publisher.connect():
        print("❌ Failed to connect to MQTT broker")
        sys.exit(1)

    try:
        if args.csv:
            run_from_csv(publisher, args.max, args.delay)
        elif args.scenario == "all":
            run_all_pipes(publisher, args.interval, args.rounds)
        else:
            run_continuous(publisher, args.scenario, args.pipe, args.zone, args.interval)
    finally:
        publisher.disconnect()
        print(f"\nTotal published: {publisher.published}")
