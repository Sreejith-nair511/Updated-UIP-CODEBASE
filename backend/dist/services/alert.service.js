"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAndCreateAlert = evaluateAndCreateAlert;
const supabase_1 = require("../lib/supabase");
const logger_1 = require("../lib/logger");
const config_1 = require("../config");
const notification_service_1 = require("./notification.service");
async function evaluateAndCreateAlert(input) {
    const { pipe_id, zone_id, reading_id, prediction, severity_pct, frequency_hz, pressure_bar } = input;
    const leakProb = prediction.minor_leak_prob + prediction.major_leak_prob;
    const shouldAlert = leakProb >= config_1.config.alerts.leakThreshold ||
        severity_pct >= config_1.config.alerts.severityThreshold;
    if (!shouldAlert)
        return;
    // Determine alert type
    let alertType;
    let message;
    if (prediction.leak_class === "major_leak" || severity_pct >= 50) {
        alertType = "major_leak";
        message = `Major leak detected on ${pipe_id} — Severity ${severity_pct}%, Frequency ${frequency_hz.toFixed(1)} Hz`;
    }
    else if (prediction.leak_class === "minor_leak") {
        alertType = "minor_leak";
        message = `Minor leak detected on ${pipe_id} — Severity ${severity_pct}%, Anomaly ${(leakProb * 100).toFixed(0)}%`;
    }
    else if (pressure_bar > 7.0) {
        alertType = "pressure_spike";
        message = `Pressure spike on ${pipe_id} — ${pressure_bar} bar exceeds safe threshold`;
    }
    else {
        alertType = "anomaly";
        message = `Anomaly detected on ${pipe_id} — Frequency ${frequency_hz.toFixed(1)} Hz, Score ${leakProb.toFixed(2)}`;
    }
    // Check for existing active alert on this pipe (avoid duplicates)
    const { data: existing } = await supabase_1.supabase
        .from("alerts")
        .select("id")
        .eq("pipe_id", pipe_id)
        .eq("status", "active")
        .eq("alert_type", alertType)
        .limit(1);
    if (existing && existing.length > 0) {
        logger_1.logger.debug("Skipping duplicate alert", { pipe_id, alertType });
        return;
    }
    const { error } = await supabase_1.supabase.from("alerts").insert({
        pipe_id,
        zone_id,
        reading_id,
        alert_type: alertType,
        severity_pct,
        leak_probability: parseFloat(leakProb.toFixed(4)),
        message,
        status: "active",
    });
    if (error) {
        logger_1.logger.error("Failed to create alert", { error: error.message, pipe_id });
    }
    else {
        logger_1.logger.info("Alert created", { pipe_id, alertType, severity_pct });
        // Fire push notification (non-blocking)
        (0, notification_service_1.sendAlertNotification)({
            title: alertType === "major_leak" ? "🚨 Major Leak Detected" : "⚠️ Leak Alert",
            body: message,
            tag: `${pipe_id}-${alertType}`,
            url: "/alerts",
        }).catch(() => { });
    }
}
//# sourceMappingURL=alert.service.js.map