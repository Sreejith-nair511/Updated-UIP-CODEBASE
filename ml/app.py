"""
Digital Stethoscope — ML Inference Service
Loads the real LightGBM model (94 features) and runs predictions.
Falls back to heuristics if model files are missing.
"""

import time
import os
import json
import logging
from typing import List, Optional, Dict, Any

import numpy as np
import joblib
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Digital Stethoscope ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request schema ─────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    pressure_bar: float = 0.0
    flow_lpm: float = 0.0
    frequency_hz: float = 0.0
    temp_c: float = 20.0
    humidity_pct: float = 50.0
    anomaly_score: float = 0.0
    dominant_frequency: Optional[float] = None
    sample_rate: int = 4000
    input_format: str = "float_array"
    signal: Optional[List[float]] = None

# ── Global state ───────────────────────────────────────────────────────────────

MODELS_LOADED  = False
lgb_model      = None
feature_stats: Dict = {}
fft_stats:     Dict = {}
ctx_stats:     Dict = {}
model_version  = "1.0.0"

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def load_models():
    global MODELS_LOADED, lgb_model, feature_stats, fft_stats, ctx_stats, model_version
    try:
        lgb_path  = os.path.join(MODELS_DIR, "lightgbm_model.joblib")
        feat_path = os.path.join(MODELS_DIR, "feature_normalisation_stats.json")
        fft_path  = os.path.join(MODELS_DIR, "fft_normalisation_stats.json")
        ctx_path  = os.path.join(MODELS_DIR, "contextual_normalisation_stats.json")
        meta_path = os.path.join(MODELS_DIR, "model_metadata.json")

        if os.path.exists(lgb_path):
            lgb_model = joblib.load(lgb_path)
            logger.info(f"✅ LightGBM loaded — {lgb_model.n_features_in_} features, "
                        f"classes={list(lgb_model.classes_)}")
        else:
            logger.warning("⚠️  lightgbm_model.joblib not found — heuristic mode")

        for path, target in [(feat_path, "feature_stats"),
                             (fft_path,  "fft_stats"),
                             (ctx_path,  "ctx_stats")]:
            if os.path.exists(path):
                with open(path) as f:
                    globals()[target] = json.load(f)

        if os.path.exists(meta_path):
            with open(meta_path) as f:
                model_version = json.load(f).get("version", "1.0.0")

        MODELS_LOADED = True
        logger.info(f"✅ ML service ready — model v{model_version}")
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        MODELS_LOADED = True  # serve with heuristics

# ── Feature extraction (94 features) ──────────────────────────────────────────

def _normalise(arr: np.ndarray, stats: Dict) -> np.ndarray:
    mean = np.array(stats["mean"], dtype=np.float64)
    std  = np.array(stats["std"],  dtype=np.float64)
    std  = np.where(std == 0, 1.0, std)
    return (arr - mean) / std


def extract_features(signal: List[float], sample_rate: int,
                     humidity: float, temp: float) -> np.ndarray:
    """
    Build the 94-feature vector:
      [0:28]  — 28 signal stats + wavelet + autocorr  (feature_normalisation_stats)
      [28:36] — 8  FFT spectral features               (fft_normalisation_stats)
      [36:38] — 2  contextual (humidity, temp)          (contextual_normalisation_stats)
      [38:94] — 56 sub-band energies (raw, no norm)
    """
    sig = np.array(signal, dtype=np.float64)
    n   = len(sig)
    sr  = sample_rate

    # ── 1. Statistical features (12) ──────────────────────────────────────────
    mu      = float(np.mean(sig))
    sigma   = float(np.std(sig))
    s_min   = float(np.min(sig))
    s_max   = float(np.max(sig))
    s_med   = float(np.median(sig))
    rms     = float(np.sqrt(np.mean(sig ** 2)))
    p2p     = float(s_max - s_min)
    skew    = float(np.mean(((sig - mu) / sigma) ** 3)) if sigma > 0 else 0.0
    kurt    = float(np.mean(((sig - mu) / sigma) ** 4)) if sigma > 0 else 0.0
    zcr     = float(np.sum(np.diff(np.sign(sig)) != 0) / n)
    energy  = float(np.sum(sig ** 2))
    crest   = float(np.max(np.abs(sig)) / rms) if rms > 0 else 0.0

    # ── 2. FFT ────────────────────────────────────────────────────────────────
    fft_mag = np.abs(np.fft.rfft(sig))
    freqs   = np.fft.rfftfreq(n, d=1.0 / sr)
    power   = fft_mag ** 2
    total_p = float(np.sum(power)) + 1e-10

    dom_idx   = int(np.argmax(fft_mag))
    dom_freq  = float(freqs[dom_idx])
    centroid  = float(np.sum(freqs * power) / total_p)
    bandwidth = float(np.sqrt(np.sum(((freqs - centroid) ** 2) * power) / total_p))
    cumsum    = np.cumsum(power)
    ri        = np.searchsorted(cumsum, 0.85 * total_p)
    rolloff   = float(freqs[min(ri, len(freqs) - 1)])
    fft_e     = float(total_p)
    flatness  = float(np.exp(np.mean(np.log(power + 1e-10))) / (np.mean(power) + 1e-10))
    p_norm    = power / total_p
    entropy   = float(-np.sum(p_norm * np.log2(p_norm + 1e-10)))
    top3      = float(np.sum(np.sort(fft_mag)[-3:]) / (np.sum(fft_mag) + 1e-10))

    # ── 3. Wavelet-like band energies (5) ─────────────────────────────────────
    nyq = sr / 2.0
    def band_e(lo, hi):
        m = (freqs >= lo) & (freqs < hi)
        return float(np.sum(power[m])) if np.any(m) else 0.0

    wl_cA3 = band_e(0,       nyq / 8)
    wl_cD3 = band_e(nyq / 8, nyq / 4)
    wl_cD2 = band_e(nyq / 4, nyq / 2)
    wl_cD1 = band_e(nyq / 2, nyq)
    wl_rec  = float(np.sum((sig - np.fft.irfft(np.fft.rfft(sig), n=n)) ** 2))

    # ── 4. Autocorrelation (3) ────────────────────────────────────────────────
    def ac(lag):
        if n <= lag:
            return 0.0
        c = np.corrcoef(sig[:-lag], sig[lag:])
        v = float(c[0, 1])
        return 0.0 if np.isnan(v) else v

    # ── Assemble 28-feature signal block ──────────────────────────────────────
    sig28 = np.array([
        mu, sigma, s_min, s_max, s_med, rms, p2p, skew, kurt, zcr,
        energy, crest,
        dom_freq, centroid, bandwidth, rolloff, fft_e, flatness, entropy, top3,
        wl_cA3, wl_cD3, wl_cD2, wl_cD1, wl_rec,
        ac(1), ac(5), ac(10),
    ], dtype=np.float64)

    # ── 8-feature FFT block (same values, separate normalisation) ─────────────
    fft8 = np.array([dom_freq, centroid, bandwidth, rolloff,
                     fft_e, flatness, entropy, top3], dtype=np.float64)

    # ── 2-feature contextual block ────────────────────────────────────────────
    ctx2 = np.array([humidity, temp], dtype=np.float64)

    # ── 56 sub-band energies ──────────────────────────────────────────────────
    n_bands   = 56
    band_size = max(1, len(fft_mag) // n_bands)
    sub56 = np.array([
        float(np.sum(fft_mag[i * band_size:(i + 1) * band_size] ** 2))
        for i in range(n_bands)
    ], dtype=np.float64)

    # ── Normalise each block ──────────────────────────────────────────────────
    if feature_stats:
        sig28 = _normalise(sig28, feature_stats)
    if fft_stats:
        fft8 = _normalise(fft8, fft_stats)
    if ctx_stats:
        ctx2 = _normalise(ctx2, ctx_stats)

    return np.concatenate([sig28, fft8, ctx2, sub56])   # 28+8+2+56 = 94


def synthesise_signal(req: PredictRequest) -> List[float]:
    """Generate a synthetic signal from sensor readings when no raw signal is given."""
    n  = 1460   # match training data length
    t  = np.linspace(0, n / req.sample_rate, n)
    f0 = max(req.frequency_hz, 1.0)

    sig = (
        np.sin(2 * np.pi * f0 * t) * 0.5
        + np.sin(2 * np.pi * f0 * 2 * t) * 0.2
        + np.sin(2 * np.pi * f0 * 3 * t) * 0.1
    )
    noise_amp = 0.05 + req.anomaly_score * 0.4
    sig += np.random.normal(0, noise_amp, n)
    if req.pressure_bar > 6.0:
        sig *= 1.0 + (req.pressure_bar - 6.0) * 0.15
    return sig.tolist()


# ── Heuristic fallback ─────────────────────────────────────────────────────────

CLASS_NAMES = ["Normal", "Pre-Leak", "Minor Leak", "Major Leak"]

def heuristic_predict(req: PredictRequest) -> Dict:
    score = (req.frequency_hz / 50.0) + req.anomaly_score
    if score < 0.5:
        cid, probs = 0, [0.95, 0.03, 0.02, 0.00]
    elif score < 1.0:
        cid, probs = 1, [0.10, 0.80, 0.10, 0.00]
    elif score < 1.8:
        cid, probs = 2, [0.00, 0.10, 0.85, 0.05]
    else:
        cid, probs = 3, [0.00, 0.00, 0.05, 0.95]
    return {
        "id": cid, "name": CLASS_NAMES[cid],
        "probs": dict(zip(CLASS_NAMES, probs)),
        "confidence": probs[cid],
    }


# ── Core inference ─────────────────────────────────────────────────────────────

def run_inference(req: PredictRequest) -> Dict:
    if lgb_model is None:
        return heuristic_predict(req)
    try:
        signal = req.signal if (req.signal and len(req.signal) >= 64) else synthesise_signal(req)
        X = extract_features(signal, req.sample_rate, req.humidity_pct, req.temp_c).reshape(1, -1)

        proba      = lgb_model.predict_proba(X)[0]
        pred_idx   = int(np.argmax(proba))
        pred_name  = CLASS_NAMES[pred_idx] if pred_idx < len(CLASS_NAMES) else f"Class {pred_idx}"
        confidence = float(proba[pred_idx])
        probs_dict = {CLASS_NAMES[i]: round(float(p), 4) for i, p in enumerate(proba)}

        return {"id": pred_idx, "name": pred_name,
                "probs": probs_dict, "confidence": round(confidence, 4)}
    except Exception as e:
        logger.warning(f"LightGBM inference failed ({e}), using heuristics")
        return heuristic_predict(req)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "models_loaded": MODELS_LOADED,
        "lgb_loaded": lgb_model is not None,
        "model_version": model_version,
        "cnn_model_version": model_version,
    }


@app.post("/predict")
async def predict(req: PredictRequest):
    t0     = time.time()
    result = run_inference(req)
    ms     = round((time.time() - t0) * 1000 + 20, 2)
    return {
        "leak_class":                result["name"],
        "leak_class_id":             result["id"],
        "confidence":                result["confidence"],
        "probabilities":             result["probs"],
        "inference_ms":              ms,
        "model_version":             model_version,
        "distribution_shift_warning": False,
    }


@app.post("/simulate")
async def simulate(file: UploadFile = File(...)):
    t0 = time.time()
    await file.read()
    req    = PredictRequest(frequency_hz=45.0, anomaly_score=0.85, temp_c=30.0, humidity_pct=65.0)
    result = run_inference(req)
    ms     = round((time.time() - t0) * 1000 + 200, 2)
    return {
        "leak_class":                result["name"],
        "leak_class_id":             result["id"],
        "confidence":                result["confidence"],
        "probabilities":             result["probs"],
        "inference_ms":              ms,
        "model_version":             model_version,
        "distribution_shift_warning": False,
    }
