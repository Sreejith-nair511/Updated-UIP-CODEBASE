#pragma once
#include <WiFi.h>
#include <time.h>

// NTP servers
static const char* NTP_SERVER1 = "pool.ntp.org";
static const char* NTP_SERVER2 = "time.nist.gov";
static const long  GMT_OFFSET_SEC = 19800;  // IST = UTC+5:30
static const int   DAYLIGHT_OFFSET_SEC = 0;

void initNTP() {
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER1, NTP_SERVER2);
  Serial.print("[NTP] Syncing time");
  struct tm timeinfo;
  int attempts = 0;
  while (!getLocalTime(&timeinfo) && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (attempts < 20) {
    char buf[32];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
    Serial.printf("\n[NTP] Time synced: %s\n", buf);
  } else {
    Serial.println("\n[NTP] Sync failed — using millis() fallback");
  }
}

String getDateStr() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    // Fallback: use a fixed date
    return "2026-05-13";
  }
  char buf[12];
  strftime(buf, sizeof(buf), "%Y-%m-%d", &timeinfo);
  return String(buf);
}

String getTimeStr() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    // Fallback: use millis
    unsigned long ms = millis();
    int h = (ms / 3600000) % 24;
    int m = (ms / 60000) % 60;
    int s = (ms / 1000) % 60;
    char buf[10];
    snprintf(buf, sizeof(buf), "%02d:%02d:%02d", h, m, s);
    return String(buf);
  }
  char buf[10];
  strftime(buf, sizeof(buf), "%H:%M:%S", &timeinfo);
  return String(buf);
}
