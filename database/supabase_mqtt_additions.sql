-- ============================================================
-- Digital Stethoscope — MQTT & Data Pipeline Additions
-- ============================================================
-- Run this AFTER supabase_setup.sql
-- Adds: mqtt_events log, data_pipeline view, bulk-load helpers
-- ============================================================

-- ─── MQTT EVENTS LOG ──────────────────────────────────────────────────────────
-- Tracks every message received from HiveMQ
CREATE TABLE IF NOT EXISTS mqtt_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic       TEXT NOT NULL,
    pipe_id     TEXT,
    zone_id     TEXT,
    payload     JSONB NOT NULL,
    processed   BOOLEAN DEFAULT FALSE,
    reading_id  UUID REFERENCES readings(id) ON DELETE SET NULL,
    error       TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mqtt_events_pipe_id    ON mqtt_events(pipe_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_events_received   ON mqtt_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_mqtt_events_processed  ON mqtt_events(processed);

ALTER TABLE mqtt_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to mqtt_events" ON mqtt_events;
CREATE POLICY "Service role full access to mqtt_events"
    ON mqtt_events FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anon can read mqtt_events" ON mqtt_events;
CREATE POLICY "Anon can read mqtt_events"
    ON mqtt_events FOR SELECT TO anon USING (TRUE);

-- ─── DATA PIPELINE VIEW ───────────────────────────────────────────────────────
-- Shows readings with their ML predictions joined
CREATE OR REPLACE VIEW readings_with_predictions AS
SELECT
    r.id                    AS reading_id,
    r.pipe_id,
    r.zone_id,
    r.reading_date,
    r.reading_time,
    r.pressure_bar,
    r.flow_lpm,
    r.frequency_hz,
    r.temp_c,
    r.humidity_pct,
    r.anomaly_score,
    r.leak,
    r.severity_pct,
    r.valve_status,
    r.created_at,
    p.leak_class,
    p.no_leak_prob,
    p.minor_leak_prob,
    p.major_leak_prob,
    p.confidence,
    p.inference_ms,
    p.model_version,
    p.severity_estimate
FROM readings r
LEFT JOIN predictions p ON p.reading_id = r.id
ORDER BY r.created_at DESC;

-- ─── HOURLY STATS VIEW ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW hourly_stats AS
SELECT
    date_trunc('hour', created_at)                                          AS hour,
    zone_id,
    COUNT(*)                                                                AS total_readings,
    SUM(CASE WHEN leak THEN 1 ELSE 0 END)                                  AS leak_count,
    ROUND(AVG(anomaly_score)::NUMERIC, 4)                                  AS avg_anomaly,
    ROUND(AVG(frequency_hz)::NUMERIC, 2)                                   AS avg_frequency,
    ROUND(AVG(pressure_bar)::NUMERIC, 3)                                   AS avg_pressure,
    ROUND(AVG(flow_lpm)::NUMERIC, 2)                                       AS avg_flow,
    MAX(severity_pct)                                                       AS max_severity
FROM readings
GROUP BY date_trunc('hour', created_at), zone_id
ORDER BY hour DESC, zone_id;

-- ─── PIPE HEALTH SCORE VIEW ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW pipe_health AS
SELECT
    p.pipe_id,
    p.zone_id,
    p.name,
    p.location,
    p.material,
    p.status,
    COUNT(r.id)                                                             AS total_readings,
    SUM(CASE WHEN r.leak THEN 1 ELSE 0 END)                               AS total_leaks,
    ROUND(AVG(r.anomaly_score)::NUMERIC, 4)                               AS avg_anomaly,
    ROUND(AVG(r.frequency_hz)::NUMERIC, 2)                                AS avg_frequency,
    MAX(r.severity_pct)                                                    AS max_severity,
    MAX(r.created_at)                                                      AS last_reading_at,
    CASE
        WHEN MAX(r.severity_pct) >= 80 THEN 'critical'
        WHEN MAX(r.severity_pct) >= 50 THEN 'warning'
        WHEN MAX(r.severity_pct) >= 20 THEN 'caution'
        ELSE 'healthy'
    END                                                                    AS health_status
FROM pipes p
LEFT JOIN readings r ON r.pipe_id = p.pipe_id
GROUP BY p.pipe_id, p.zone_id, p.name, p.location, p.material, p.status
ORDER BY max_severity DESC NULLS LAST;

-- ─── REALTIME ON MQTT EVENTS ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE mqtt_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── VERIFY ───────────────────────────────────────────────────────────────────
SELECT 'New tables:' AS info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('mqtt_events')
ORDER BY table_name;

SELECT 'New views:' AS info;
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('readings_with_predictions', 'hourly_stats', 'pipe_health')
ORDER BY table_name;
