-- ============================================================
-- Digital Stethoscope — Supabase Complete Setup SQL
-- Project: tmxvrtlzyyummrgxvndq
-- ============================================================
-- HOW TO RUN:
--   1. Go to https://supabase.com/dashboard/project/tmxvrtlzyyummrgxvndq
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste this entire file and click "Run"
-- ============================================================

-- ─── EXTENSIONS ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUMS ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE pipe_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE valve_status_type AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('minor_leak', 'major_leak', 'anomaly', 'pressure_spike');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE leak_class AS ENUM ('no_leak', 'minor_leak', 'major_leak');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'operator', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── USERS TABLE ──────────────────────────────────────────────────────────────
-- Clerk manages auth; this stores app-level metadata
-- user.id = Clerk user ID (e.g. "user_2abc123...")
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    full_name       TEXT,
    role            user_role NOT NULL DEFAULT 'viewer',
    zone_access     TEXT[],
    push_token      TEXT,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PIPES TABLE ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipe_id         TEXT UNIQUE NOT NULL,
    zone_id         TEXT NOT NULL,
    name            TEXT NOT NULL,
    location        TEXT,
    material        TEXT,
    diameter_mm     NUMERIC(6,2),
    install_date    DATE,
    status          pipe_status DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipes_zone_id ON pipes(zone_id);
CREATE INDEX IF NOT EXISTS idx_pipes_status  ON pipes(status);

-- ─── READINGS TABLE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS readings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipe_id                 TEXT NOT NULL REFERENCES pipes(pipe_id) ON DELETE CASCADE,
    zone_id                 TEXT NOT NULL,
    reading_date            DATE NOT NULL,
    reading_time            TIME NOT NULL,
    pressure_bar            NUMERIC(6,3) NOT NULL,
    flow_lpm                NUMERIC(8,2) NOT NULL,
    leak                    BOOLEAN NOT NULL DEFAULT FALSE,
    severity_pct            NUMERIC(5,2) NOT NULL DEFAULT 0,
    frequency_hz            NUMERIC(8,3) NOT NULL,
    temp_c                  NUMERIC(5,2) NOT NULL DEFAULT 22.0,
    humidity_pct            NUMERIC(5,2) NOT NULL DEFAULT 55.0,
    valve_status            valve_status_type NOT NULL DEFAULT 'OPEN',
    anomaly_score           NUMERIC(6,4) NOT NULL DEFAULT 0,
    dominant_frequency      NUMERIC(8,3),
    frequency_distribution  JSONB,
    spectrogram_url         TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_pipe_id    ON readings(pipe_id);
CREATE INDEX IF NOT EXISTS idx_readings_zone_id    ON readings(zone_id);
CREATE INDEX IF NOT EXISTS idx_readings_date       ON readings(reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_leak       ON readings(leak) WHERE leak = TRUE;
CREATE INDEX IF NOT EXISTS idx_readings_pipe_date  ON readings(pipe_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_readings_anomaly    ON readings(anomaly_score DESC) WHERE anomaly_score > 0.5;

-- ─── PREDICTIONS TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_id          UUID NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
    pipe_id             TEXT NOT NULL,
    model_version       TEXT NOT NULL DEFAULT '1.0.0',
    leak_class          leak_class NOT NULL,
    no_leak_prob        NUMERIC(6,4) NOT NULL DEFAULT 0,
    minor_leak_prob     NUMERIC(6,4) NOT NULL DEFAULT 0,
    major_leak_prob     NUMERIC(6,4) NOT NULL DEFAULT 0,
    severity_estimate   NUMERIC(5,2) NOT NULL DEFAULT 0,
    confidence          NUMERIC(6,4) NOT NULL DEFAULT 0,
    inference_ms        NUMERIC(8,2),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_reading_id ON predictions(reading_id);
CREATE INDEX IF NOT EXISTS idx_predictions_pipe_id    ON predictions(pipe_id);
CREATE INDEX IF NOT EXISTS idx_predictions_leak_class ON predictions(leak_class);

-- ─── ALERTS TABLE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipe_id             TEXT NOT NULL,
    zone_id             TEXT NOT NULL,
    reading_id          UUID REFERENCES readings(id) ON DELETE SET NULL,
    alert_type          alert_type NOT NULL,
    severity_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
    leak_probability    NUMERIC(6,4) NOT NULL DEFAULT 0,
    message             TEXT NOT NULL,
    status              alert_status NOT NULL DEFAULT 'active',
    acknowledged_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at     TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_pipe_id    ON alerts(pipe_id);
CREATE INDEX IF NOT EXISTS idx_alerts_zone_id    ON alerts(zone_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status     ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_active     ON alerts(status, created_at DESC) WHERE status = 'active';

-- ─── PUSH SUBSCRIPTIONS TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
    endpoint    TEXT UNIQUE NOT NULL,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_user_id ON push_subscriptions(user_id);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS pipes_updated_at ON pipes;
CREATE TRIGGER pipes_updated_at
    BEFORE UPDATE ON pipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE pipes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anon read (frontend uses anon key)
DROP POLICY IF EXISTS "Anon can read pipes"        ON pipes;
CREATE POLICY "Anon can read pipes"
    ON pipes FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Anon can read readings"     ON readings;
CREATE POLICY "Anon can read readings"
    ON readings FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Anon can read alerts"       ON alerts;
CREATE POLICY "Anon can read alerts"
    ON alerts FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Anon can read predictions"  ON predictions;
CREATE POLICY "Anon can read predictions"
    ON predictions FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Anon can read users"        ON users;
CREATE POLICY "Anon can read users"
    ON users FOR SELECT TO anon USING (TRUE);

-- Anon can update alert status (acknowledge / resolve from frontend)
DROP POLICY IF EXISTS "Anon can update alerts"     ON alerts;
CREATE POLICY "Anon can update alerts"
    ON alerts FOR UPDATE TO anon USING (TRUE) WITH CHECK (TRUE);

-- Service role (backend) has full access to everything
DROP POLICY IF EXISTS "Service role full access to readings"    ON readings;
CREATE POLICY "Service role full access to readings"
    ON readings FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to alerts"      ON alerts;
CREATE POLICY "Service role full access to alerts"
    ON alerts FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to predictions" ON predictions;
CREATE POLICY "Service role full access to predictions"
    ON predictions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to pipes"       ON pipes;
CREATE POLICY "Service role full access to pipes"
    ON pipes FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to users"       ON users;
CREATE POLICY "Service role full access to users"
    ON users FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to push"        ON push_subscriptions;
CREATE POLICY "Service role full access to push"
    ON push_subscriptions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
-- Enable realtime on key tables so the dashboard updates live
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE readings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── VIEWS ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW zone_summary AS
SELECT
    r.zone_id,
    COUNT(DISTINCT r.pipe_id)                                                       AS total_pipes,
    COUNT(*)                                                                        AS total_readings,
    SUM(CASE WHEN r.leak THEN 1 ELSE 0 END)                                        AS leak_readings,
    ROUND(AVG(r.pressure_bar)::NUMERIC, 2)                                         AS avg_pressure,
    ROUND(AVG(r.flow_lpm)::NUMERIC, 2)                                             AS avg_flow,
    ROUND(AVG(r.frequency_hz)::NUMERIC, 2)                                         AS avg_frequency,
    ROUND(AVG(r.anomaly_score)::NUMERIC, 4)                                        AS avg_anomaly,
    ROUND((SUM(CASE WHEN r.leak THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*),0)) * 100, 2) AS leak_rate_pct,
    MAX(r.created_at)                                                               AS last_reading_at
FROM readings r
GROUP BY r.zone_id;

CREATE OR REPLACE VIEW pipe_latest_reading AS
SELECT DISTINCT ON (r.pipe_id)
    r.pipe_id, r.zone_id, r.reading_date, r.reading_time,
    r.pressure_bar, r.flow_lpm, r.leak, r.severity_pct,
    r.frequency_hz, r.anomaly_score, r.valve_status, r.created_at
FROM readings r
ORDER BY r.pipe_id, r.created_at DESC;

-- ─── SEED: PIPE REGISTRY ──────────────────────────────────────────────────────
INSERT INTO pipes (pipe_id, zone_id, name, location, material, diameter_mm, status) VALUES
    ('P101', 'Z1', 'Zone 1 Main Line A',  'Building A, Floor 1',    'Steel',  150.0, 'active'),
    ('P102', 'Z1', 'Zone 1 Branch B',     'Building A, Floor 2',    'PVC',    100.0, 'active'),
    ('P103', 'Z1', 'Zone 1 Branch C',     'Building A, Floor 3',    'PVC',    100.0, 'active'),
    ('P104', 'Z1', 'Zone 1 Branch D',     'Building A, Basement',   'Steel',  125.0, 'active'),
    ('P105', 'Z1', 'Zone 1 Branch E',     'Building A, Roof',       'Copper',  75.0, 'active'),
    ('P106', 'Z1', 'Zone 1 Branch F',     'Building A, Ext',        'PVC',    100.0, 'active'),
    ('P203', 'Z2', 'Zone 2 Main Line A',  'Building B, Floor 1',    'Steel',  150.0, 'active'),
    ('P204', 'Z2', 'Zone 2 Branch B',     'Building B, Floor 2',    'PVC',    100.0, 'active'),
    ('P205', 'Z2', 'Zone 2 Branch C',     'Building B, Floor 3',    'PVC',    100.0, 'active'),
    ('P206', 'Z2', 'Zone 2 Branch D',     'Building B, Basement',   'Steel',  125.0, 'active'),
    ('P207', 'Z2', 'Zone 2 Branch E',     'Building B, Roof',       'Copper',  75.0, 'active'),
    ('P208', 'Z2', 'Zone 2 Branch F',     'Building B, Ext',        'PVC',    100.0, 'active'),
    ('P305', 'Z3', 'Zone 3 Main Line A',  'Building C, Floor 1',    'Steel',  200.0, 'active'),
    ('P306', 'Z3', 'Zone 3 Branch B',     'Building C, Floor 2',    'PVC',    100.0, 'active'),
    ('P307', 'Z3', 'Zone 3 Branch C',     'Building C, Floor 3',    'PVC',    100.0, 'active'),
    ('P308', 'Z3', 'Zone 3 Branch D',     'Building C, Basement',   'Steel',  125.0, 'active'),
    ('P309', 'Z3', 'Zone 3 Branch E',     'Building C, Roof',       'Copper',  75.0, 'active'),
    ('P401', 'Z4', 'Zone 4 Main Line A',  'Building D, Floor 1',    'Steel',  200.0, 'active'),
    ('P402', 'Z4', 'Zone 4 Branch B',     'Building D, Floor 2',    'PVC',    100.0, 'active'),
    ('P403', 'Z4', 'Zone 4 Branch C',     'Building D, Floor 3',    'PVC',    100.0, 'active'),
    ('P404', 'Z4', 'Zone 4 Branch D',     'Building D, Basement',   'Steel',  125.0, 'active'),
    ('P405', 'Z4', 'Zone 4 Branch E',     'Building D, Roof',       'Copper',  75.0, 'active'),
    ('P501', 'Z5', 'Zone 5 Main Line A',  'Building E, Floor 1',    'Steel',  250.0, 'active'),
    ('P502', 'Z5', 'Zone 5 Branch B',     'Building E, Floor 2',    'PVC',    100.0, 'active'),
    ('P503', 'Z5', 'Zone 5 Branch C',     'Building E, Floor 3',    'PVC',    100.0, 'active'),
    ('P504', 'Z5', 'Zone 5 Branch D',     'Building E, Basement',   'Steel',  125.0, 'active'),
    ('P505', 'Z5', 'Zone 5 Branch E',     'Building E, Roof',       'Copper',  75.0, 'active')
ON CONFLICT (pipe_id) DO NOTHING;

-- ─── SEED: SAMPLE READINGS ────────────────────────────────────────────────────
-- 27 realistic readings across zones (normal + leak scenarios)
INSERT INTO readings (pipe_id, zone_id, reading_date, reading_time, pressure_bar, flow_lpm, leak, severity_pct, frequency_hz, temp_c, humidity_pct, valve_status, anomaly_score, dominant_frequency) VALUES
    -- Normal readings
    ('P101', 'Z1', CURRENT_DATE, '08:00:00', 3.50, 45.2, FALSE,  5.0, 14.8, 22.1, 54.3, 'OPEN', 0.08, 14.8),
    ('P102', 'Z1', CURRENT_DATE, '08:01:00', 3.45, 44.8, FALSE,  4.0, 15.2, 22.3, 55.1, 'OPEN', 0.06, 15.2),
    ('P103', 'Z1', CURRENT_DATE, '08:02:00', 3.48, 45.5, FALSE,  6.0, 15.0, 22.0, 54.8, 'OPEN', 0.09, 15.0),
    ('P203', 'Z2', CURRENT_DATE, '08:03:00', 3.52, 46.1, FALSE,  5.0, 14.5, 21.8, 56.2, 'OPEN', 0.07, 14.5),
    ('P204', 'Z2', CURRENT_DATE, '08:04:00', 3.49, 45.9, FALSE,  4.0, 15.1, 22.2, 55.5, 'OPEN', 0.05, 15.1),
    ('P305', 'Z3', CURRENT_DATE, '08:05:00', 3.55, 47.2, FALSE,  7.0, 14.9, 21.9, 54.0, 'OPEN', 0.10, 14.9),
    ('P401', 'Z4', CURRENT_DATE, '08:06:00', 3.51, 45.8, FALSE,  5.0, 15.3, 22.4, 55.8, 'OPEN', 0.07, 15.3),
    ('P501', 'Z5', CURRENT_DATE, '08:07:00', 3.53, 46.5, FALSE,  6.0, 14.7, 22.1, 54.6, 'OPEN', 0.08, 14.7),
    -- Pre-leak readings (elevated anomaly)
    ('P104', 'Z1', CURRENT_DATE, '08:08:00', 3.62, 47.8, FALSE, 28.0, 32.5, 22.5, 56.0, 'OPEN', 0.35, 32.5),
    ('P205', 'Z2', CURRENT_DATE, '08:09:00', 3.58, 47.1, FALSE, 25.0, 30.2, 22.3, 55.2, 'OPEN', 0.31, 30.2),
    ('P306', 'Z3', CURRENT_DATE, '08:10:00', 3.65, 48.2, FALSE, 30.0, 35.1, 22.6, 56.5, 'OPEN', 0.38, 35.1),
    -- Minor leak readings
    ('P105', 'Z1', CURRENT_DATE, '08:11:00', 3.72, 49.5, TRUE,  55.0, 48.3, 23.1, 57.2, 'OPEN', 0.62, 48.3),
    ('P206', 'Z2', CURRENT_DATE, '08:12:00', 3.68, 48.9, TRUE,  52.0, 45.7, 22.9, 56.8, 'OPEN', 0.58, 45.7),
    ('P307', 'Z3', CURRENT_DATE, '08:13:00', 3.75, 50.1, TRUE,  58.0, 51.2, 23.2, 57.5, 'OPEN', 0.65, 51.2),
    ('P402', 'Z4', CURRENT_DATE, '08:14:00', 3.70, 49.2, TRUE,  53.0, 46.9, 23.0, 57.0, 'OPEN', 0.60, 46.9),
    -- Major leak readings
    ('P106', 'Z1', CURRENT_DATE, '08:15:00', 3.95, 55.8, TRUE,  88.0, 72.4, 24.1, 59.3, 'OPEN', 0.91, 72.4),
    ('P207', 'Z2', CURRENT_DATE, '08:16:00', 3.88, 53.2, TRUE,  82.0, 68.1, 23.8, 58.7, 'OPEN', 0.87, 68.1),
    ('P308', 'Z3', CURRENT_DATE, '08:17:00', 3.92, 54.5, TRUE,  85.0, 70.3, 24.0, 59.0, 'OPEN', 0.89, 70.3),
    -- More normal readings (recent)
    ('P101', 'Z1', CURRENT_DATE, '09:00:00', 3.51, 45.4, FALSE,  5.0, 15.0, 22.2, 54.5, 'OPEN', 0.07, 15.0),
    ('P203', 'Z2', CURRENT_DATE, '09:01:00', 3.53, 46.0, FALSE,  5.0, 14.6, 21.9, 56.0, 'OPEN', 0.08, 14.6),
    ('P305', 'Z3', CURRENT_DATE, '09:02:00', 3.56, 47.0, FALSE,  6.0, 15.0, 22.0, 54.2, 'OPEN', 0.09, 15.0),
    ('P401', 'Z4', CURRENT_DATE, '09:03:00', 3.52, 45.9, FALSE,  5.0, 15.2, 22.3, 55.7, 'OPEN', 0.07, 15.2),
    ('P501', 'Z5', CURRENT_DATE, '09:04:00', 3.54, 46.6, FALSE,  6.0, 14.8, 22.2, 54.7, 'OPEN', 0.08, 14.8),
    ('P502', 'Z5', CURRENT_DATE, '09:05:00', 3.50, 45.3, FALSE,  4.0, 15.1, 22.1, 55.0, 'OPEN', 0.06, 15.1),
    ('P503', 'Z5', CURRENT_DATE, '09:06:00', 3.49, 45.1, FALSE,  4.0, 14.9, 22.0, 54.9, 'OPEN', 0.06, 14.9),
    ('P504', 'Z5', CURRENT_DATE, '09:07:00', 3.51, 45.5, FALSE,  5.0, 15.0, 22.1, 55.1, 'OPEN', 0.07, 15.0),
    ('P505', 'Z5', CURRENT_DATE, '09:08:00', 3.52, 45.7, FALSE,  5.0, 15.2, 22.2, 55.3, 'OPEN', 0.07, 15.2);

-- ─── SEED: SAMPLE ALERTS ──────────────────────────────────────────────────────
INSERT INTO alerts (pipe_id, zone_id, alert_type, severity_pct, leak_probability, message, status) VALUES
    ('P106', 'Z1', 'major_leak',    88.0, 0.91, 'Major leak detected on Zone 1 Branch F — immediate action required', 'active'),
    ('P207', 'Z2', 'major_leak',    82.0, 0.87, 'Major leak detected on Zone 2 Branch E — immediate action required', 'active'),
    ('P105', 'Z1', 'minor_leak',    55.0, 0.62, 'Minor leak detected on Zone 1 Branch E — schedule inspection', 'acknowledged'),
    ('P206', 'Z2', 'minor_leak',    52.0, 0.58, 'Minor leak detected on Zone 2 Branch D — schedule inspection', 'resolved'),
    ('P308', 'Z3', 'major_leak',    85.0, 0.89, 'Major leak detected on Zone 3 Branch D — immediate action required', 'active');

-- ─── VERIFY SETUP ─────────────────────────────────────────────────────────────
-- Run these SELECT statements to confirm everything was created correctly:

SELECT 'Tables created:' AS info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users','pipes','readings','predictions','alerts','push_subscriptions')
ORDER BY table_name;

SELECT 'Pipes seeded:' AS info;
SELECT COUNT(*) AS pipe_count FROM pipes;

SELECT 'Readings seeded:' AS info;
SELECT COUNT(*) AS reading_count FROM readings;

SELECT 'Alerts seeded:' AS info;
SELECT COUNT(*) AS alert_count, status FROM alerts GROUP BY status;

SELECT 'Zone summary:' AS info;
SELECT zone_id, total_pipes, total_readings, leak_readings, leak_rate_pct
FROM zone_summary
ORDER BY zone_id;
