# Quick Start — Hardware Setup

> **Get your first ESP32 sensor running in 30 minutes**

---

## ⚡ Prerequisites

- [ ] ESP32 DevKit board
- [ ] Piezo sensor (27mm disc)
- [ ] USB cable (for programming)
- [ ] Arduino IDE 2.0+ installed
- [ ] WiFi network credentials
- [ ] Backend API running (see [README.md](README.md))

---

## 🔌 Minimal Wiring (Piezo Only)

```
ESP32 DevKit          Piezo Sensor
┌──────────┐          ┌────┐
│          │          │    │
│  GPIO34  ├──────────┤ +  │  (Red wire)
│          │          │    │
│  GND     ├──────────┤ -  │  (Black wire)
│          │          └────┘
│  GPIO2   ├──────────→ LED (optional)
│          │
└──────────┘
```

**That's it!** This minimal setup is enough to detect leaks.

---

## 📥 Install Arduino IDE

### Windows / macOS / Linux

1. Download from https://www.arduino.cc/en/software
2. Install and open Arduino IDE
3. Go to **File → Preferences**
4. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
5. Go to **Tools → Board → Boards Manager**
6. Search "ESP32" and click **Install**

---

## 📚 Install Libraries

1. Go to **Tools → Manage Libraries**
2. Search and install:
   - **ArduinoJson** (by Benoit Blanchon) ≥ 6.21.0
   - **arduinoFFT** (by Enrique Condes) ≥ 2.0.0

---

## 💾 Flash Firmware

### 1. Download Firmware

```bash
git clone https://github.com/tejaswinisa1/water_leakage-unisys-.git
cd water_leakage-unisys-/firmware/esp32_stethoscope
```

Or download directly:
https://github.com/tejaswinisa1/water_leakage-unisys-/tree/main/firmware/esp32_stethoscope

### 2. Open in Arduino IDE

- **File → Open** → `esp32_stethoscope.ino`

### 3. Configure Settings

Edit these lines at the top of the file:

```cpp
// ── WiFi credentials ──────────────────────────────────────────
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

// ── Backend API ───────────────────────────────────────────────
#define BACKEND_URL      "http://192.168.1.100:4000/ingest"
#define DEVICE_API_KEY   "your_device_api_key_here"

// ── Device identity ───────────────────────────────────────────
#define PIPE_ID          "P101"
#define ZONE_ID          "Z1"
```

**Get your API key:**

```bash
curl -X POST http://YOUR_BACKEND_IP:4000/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "pipe_id": "P101",
    "zone_id": "Z1",
    "location": "Test Location"
  }'
```

Copy the `api_key` from the response.

### 4. Select Board & Port

- **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
- **Tools → Port → [Select your ESP32's COM port]**

### 5. Upload

1. Click **Upload** button (→)
2. Wait for "Hard resetting via RTS pin..." message
3. Open **Serial Monitor** (115200 baud)
4. Press **EN** button on ESP32 to restart

---

## ✅ Verify Connection

### Expected Serial Output

```
[BOOT] Digital Stethoscope ESP32
[WiFi] Connecting to YourNetwork.....
[WiFi] Connected — IP: 192.168.1.150
[NTP] Time synced: 2026-05-12 14:32:18
[PAYLOAD] {"pipe_id":"P101","zone_id":"Z1",...}
[HTTP] POST success: 201
[DONE] domFreq=15.2 Hz  anomaly=0.123  ok=1
```

### LED Blink Codes

| Pattern | Meaning |
|---------|---------|
| **1 blink** | Sampling signal |
| **3 blinks** | POST success ✓ |
| **5 blinks** | POST failed ✗ |

### Check Dashboard

1. Open http://localhost:3000/dashboard
2. You should see a new reading within 60 seconds
3. Verify pipe ID matches your configuration

---

## 🧪 Test Acoustic Detection

### 1. Tap Test

- **Gently tap** the pipe near the sensor
- **Expected:** Frequency spike to 50-100 Hz in serial output

### 2. Scratch Test

- **Scratch** the pipe surface
- **Expected:** High-frequency noise (200+ Hz)

### 3. Running Water Test

- **Turn on a faucet** downstream
- **Expected:** Broadband noise (20-80 Hz)

---

## 🚀 Deploy on Pipe

### 1. Prepare Pipe Surface

- Clean with cloth (remove dirt, rust, paint)
- Dry completely

### 2. Apply Coupling Gel

- Use ultrasound gel or petroleum jelly
- Apply thin layer to piezo sensor

### 3. Attach Sensor

**Option A: Hose Clamp (Temporary)**
- Wrap clamp around pipe
- Position sensor on top of pipe
- Tighten until snug (don't overtighten)

**Option B: Epoxy (Permanent)**
- Apply epoxy to sensor back
- Press firmly onto pipe
- Hold for 60 seconds
- Let cure for 24 hours

### 4. Secure Wires

- Use cable ties to prevent strain
- Keep wires away from moving parts

### 5. Power On

- Connect USB power
- Wait for 3 blinks (success)
- Check dashboard for readings

---

## 🔧 Troubleshooting

### WiFi Won't Connect

**Symptom:** "Connecting..." never ends

**Solutions:**
- Double-check SSID and password (case-sensitive!)
- Move ESP32 closer to router
- Check if WiFi is 2.4 GHz (ESP32 doesn't support 5 GHz)
- Try a different WiFi network

### HTTP POST Fails

**Symptom:** 5 blinks, "POST failed: -1" in serial

**Solutions:**
- Verify backend is running: `curl http://YOUR_IP:4000/health`
- Check firewall allows port 4000
- Try IP address instead of hostname in `BACKEND_URL`
- Verify API key matches backend

### No Acoustic Signal

**Symptom:** Frequency always ~0 Hz

**Solutions:**
- Check wiring: GPIO34 → Piezo +, GND → Piezo -
- Test with multimeter: should see ~1.65V DC on GPIO34
- Tap pipe and watch serial output for changes
- Try different piezo sensor (may be faulty)

### Readings Not in Dashboard

**Symptom:** Serial shows "POST success: 201" but no data in UI

**Solutions:**
- Check pipe ID matches in firmware and dashboard filter
- Verify Supabase Realtime is enabled on `readings` table
- Check browser console for errors
- Try refreshing dashboard

---

## 📊 Expected Performance

| Metric | Value |
|--------|-------|
| **Sampling rate** | 4000 Hz |
| **FFT window** | 512 samples (128 ms) |
| **POST interval** | 60 seconds |
| **Power consumption** | ~160 mA (active) |
| **WiFi range** | 50-100 m (line of sight) |
| **Battery life** | ~18 hours (3000 mAh) |

---

## 🎯 Next Steps

1. **Add more sensors** — Pressure, flow, temperature
2. **Deploy multiple units** — Monitor entire pipe network
3. **Configure alerts** — Set thresholds for notifications
4. **Analyze trends** — Use analytics page to identify patterns
5. **Optimize placement** — Experiment with sensor positions

---

## 📚 Full Documentation

- **[HARDWARE_SETUP.md](HARDWARE_SETUP.md)** — Complete assembly guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** — REST API reference
- **[README.md](README.md)** — Project overview
- **[UI_IMPROVEMENTS.md](UI_IMPROVEMENTS.md)** — UI/UX guide

---

## 🆘 Get Help

- **GitHub Issues:** https://github.com/tejaswinisa1/water_leakage-unisys-/issues
- **Discord:** [Join our server](#)
- **Email:** support@digitalstethoscope.io

---

## ✨ Success Checklist

- [ ] ESP32 connects to WiFi
- [ ] Serial monitor shows "POST success: 201"
- [ ] LED blinks 3 times every 60 seconds
- [ ] Dashboard shows new readings
- [ ] Tapping pipe changes frequency reading
- [ ] Sensor is securely mounted
- [ ] Wires are strain-relieved
- [ ] Enclosure is weatherproof (if outdoor)

**Congratulations!** Your first sensor is live. 🎉

---

**Last updated:** May 12, 2026  
**Firmware version:** 1.0.0  
**Estimated setup time:** 30 minutes
