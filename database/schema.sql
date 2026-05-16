-- ============================================================
-- Digital Stethoscope — Supabase PostgreSQL Schema
-- With Clerk Auth Integration
-- ============================================================
-- Run this in Supabase SQL Editor.
-- Users are managed by Clerk; this table stores app-level metadata.
-- ============================================================

-- Enable required extensions
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

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Clerk manages auth; we store app metadata here.
-- user.id = Clerk user ID (e.g. "user_2abc123...")
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,              -- Clerk user ID
    email           TEXT UNIQUE NOT NULL,
    full_name       TEXT,
    role            user_role NOT NULL DEFAULT 'viewer',
    zone_access     TEXT[],                        -- NULL = all zones
    push_token      TEXT,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PIPES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipe_id         TEXT UNIQUE NOT NULL,          -- e.g. P101
    zone_id         TEXT NOT NULL,                 -- e.g. Z1
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
CREATE INDEX IF NOT EXISTS idx_pipes_status ON pipes(status);

-- ─── READINGS ─────────────────────────────────────────────────────────────────
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
    temp_c                  NUMERIC(5,2) NOT NULL,
    humidity_pct            NUMERIC(5,2) NOT NULL,
    valve_status            valve_status_type NOT NULL DEFAULT 'OPEN',
    anomaly_score           NUMERIC(6,4) NOT NULL DEFAULT 0,
    dominant_frequency      NUMERIC(8,3),
    frequency_distribution  JSONB,
    spectrogram_url         TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_pipe_id ON readings(pipe_id);
CREATE INDEX IF NOT EXISTS idx_readings_zone_id ON readings(zone_id);
CREATE INDEX IF NOT EXISTS idx_readings_date ON readings(reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_leak ON readings(leak) WHERE leak = TRUE;
CREATE INDEX IF NOT EXISTS idx_readings_pipe_date ON readings(pipe_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_readings_anomaly ON readings(anomaly_score DESC) WHERE anomaly_score > 0.5;

-- ─── PREDICTIONS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_id          UUID NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
    pipe_id             TEXT NOT NULL,
    model_version       TEXT NOT NULL,
    leak_class          leak_class NOT NULL,
    no_leak_prob        NUMERIC(6,4) NOT NULL,
    minor_leak_prob     NUMERIC(6,4) NOT NULL,
    major_leak_prob     NUMERIC(6,4) NOT NULL,
    severity_estimate   NUMERIC(5,2) NOT NULL DEFAULT 0,
    confidence          NUMERIC(6,4) NOT NULL,
    inference_ms        NUMERIC(8,2),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_reading_id ON predictions(reading_id);
CREATE INDEX IF NOT EXISTS idx_predictions_pipe_id ON predictions(pipe_id);
CREATE INDEX IF NOT EXISTS idx_predictions_leak_class ON predictions(leak_class);

-- ─── ALERTS ───────────────────────────────────────────────────────────────────
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
    acknowledged_by     TEXT REFERENCES users(id) ON DELETE SET NULL,  -- Clerk user ID
    acknowledged_at     TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_pipe_id ON alerts(pipe_id);
CREATE INDEX IF NOT EXISTS idx_alerts_zone_id ON alerts(zone_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(status, created_at DESC) WHERE status = 'active';

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
-- NOTE: With Clerk auth, we use the service role key from the backend.
-- The frontend uses the anon key with RLS policies below.
-- Clerk JWT can be configured in Supabase Dashboard > Auth > JWT Settings
-- to use Clerk's JWKS endpoint for native RLS support.

ALTER TABLE pipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anon read for dashboard (frontend uses anon key + Clerk session)
-- In production: configure Clerk JWT in Supabase for user-level RLS
DROP POLICY IF EXISTS "Anon can read pipes" ON pipes;
CREATE POLICY "Anon can read pipes"
    ON pipes FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Anon can read readings" ON readings;
CREATE POLICY "Anon can read readings"
    ON readings FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Anon can read alerts" ON alerts;
CREATE POLICY "Anon can read alerts"
    ON alerts FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Anon can read predictions" ON predictions;
CREATE POLICY "Anon can read predictions"
    ON predictions FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Anon can read users" ON users;
CREATE POLICY "Anon can read users"
    ON users FOR SELECT TO anon USING (TRUE);

-- Service role (backend API) has full access
DROP POLICY IF EXISTS "Service role full access to readings" ON readings;
CREATE POLICY "Service role full access to readings"
    ON readings FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to alerts" ON alerts;
CREATE POLICY "Service role full access to alerts"
    ON alerts FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to predictions" ON predictions;
CREATE POLICY "Service role full access to predictions"
    ON predictions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to pipes" ON pipes;
CREATE POLICY "Service role full access to pipes"
    ON pipes FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role full access to users" ON users;
CREATE POLICY "Service role full access to users"
    ON users FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Anon can update alert status (acknowledge/resolve from frontend)
DROP POLICY IF EXISTS "Anon can update alerts" ON alerts;
CREATE POLICY "Anon can update alerts"
    ON alerts FOR UPDATE TO anon USING (TRUE) WITH CHECK (TRUE);

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
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
    COUNT(DISTINCT r.pipe_id)                                           AS total_pipes,
    COUNT(*)                                                            AS total_readings,
    SUM(CASE WHEN r.leak THEN 1 ELSE 0 END)                            AS leak_readings,
    ROUND(AVG(r.pressure_bar)::NUMERIC, 2)                             AS avg_pressure,
    ROUND(AVG(r.flow_lpm)::NUMERIC, 2)                                 AS avg_flow,
    ROUND(AVG(r.frequency_hz)::NUMERIC, 2)                             AS avg_frequency,
    ROUND(AVG(r.anomaly_score)::NUMERIC, 4)                            AS avg_anomaly,
    ROUND((SUM(CASE WHEN r.leak THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) AS leak_rate_pct,
    MAX(r.created_at)                                                   AS last_reading_at
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
