/**
 * Unit tests for ml.service.ts
 * Uses fetch mocking to simulate the Python ML service.
 */

// Mock global fetch before importing the module
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  createReadStream: jest.fn(() => ({ pipe: jest.fn() })),
}));

// Mock form-data
jest.mock("form-data", () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn(() => ({ "content-type": "multipart/form-data; boundary=test" })),
  }));
});

import fs from "fs";
import { runMLInference, simulateFromWav, MLFeatures } from "../ml.service";

const mockFs = fs as jest.Mocked<typeof fs>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMLResponse(leak_class_id: number, confidence = 0.9) {
  const classNames = ["Normal", "Pre-Leak", "Minor Leak", "Major Leak"];
  const probs: Record<string, number> = {
    Normal: 0,
    "Pre-Leak": 0,
    "Minor Leak": 0,
    "Major Leak": 0,
  };
  probs[classNames[leak_class_id]] = confidence;
  // Distribute remaining probability
  const remaining = (1 - confidence) / 3;
  Object.keys(probs).forEach((k) => {
    if (probs[k] === 0) probs[k] = remaining;
  });

  return {
    leak_class: classNames[leak_class_id],
    leak_class_id,
    confidence,
    probabilities: probs,
    inference_ms: 42.5,
    model_version: "1.0.0",
    distribution_shift_warning: false,
  };
}

function mockSuccessResponse(body: object) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response);
}

function mockErrorResponse(status: number) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: `Error ${status}`,
    json: async () => ({ detail: "error" }),
  } as Response);
}

const baseFeatures: MLFeatures = {
  pressure_bar: 5.5,
  flow_lpm: 120,
  frequency_hz: 25,
  temp_c: 28,
  humidity_pct: 60,
  anomaly_score: 0.4,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFetch.mockClear();
});

describe("runMLInference — class mapping", () => {
  test("leak_class_id 0 (Normal) maps to no_leak", async () => {
    mockSuccessResponse(makeMLResponse(0));
    const result = await runMLInference(baseFeatures);
    expect(result.leak_class).toBe("no_leak");
  });

  test("leak_class_id 1 (Pre-Leak) maps to minor_leak", async () => {
    mockSuccessResponse(makeMLResponse(1));
    const result = await runMLInference(baseFeatures);
    expect(result.leak_class).toBe("minor_leak");
  });

  test("leak_class_id 2 (Minor Leak) maps to minor_leak", async () => {
    mockSuccessResponse(makeMLResponse(2));
    const result = await runMLInference(baseFeatures);
    expect(result.leak_class).toBe("minor_leak");
  });

  test("leak_class_id 3 (Major Leak) maps to major_leak", async () => {
    mockSuccessResponse(makeMLResponse(3));
    const result = await runMLInference(baseFeatures);
    expect(result.leak_class).toBe("major_leak");
  });
});

describe("runMLInference — response fields", () => {
  test("includes model_version from ML service response", async () => {
    mockSuccessResponse(makeMLResponse(0));
    const result = await runMLInference(baseFeatures);
    expect(result.model_version).toBe("1.0.0");
  });

  test("includes distribution_shift_warning from ML service response", async () => {
    const resp = makeMLResponse(0);
    resp.distribution_shift_warning = true;
    mockSuccessResponse(resp);
    const result = await runMLInference(baseFeatures);
    expect(result.distribution_shift_warning).toBe(true);
  });

  test("inference_ms is a non-negative number", async () => {
    mockSuccessResponse(makeMLResponse(0));
    const result = await runMLInference(baseFeatures);
    expect(result.inference_ms).toBeGreaterThanOrEqual(0);
  });
});

describe("runMLInference — fallback behavior", () => {
  test("falls back to heuristic when ML service returns 503", async () => {
    mockErrorResponse(503);
    const result = await runMLInference(baseFeatures);
    // Heuristic fallback should return a valid prediction
    expect(["no_leak", "minor_leak", "major_leak"]).toContain(result.leak_class);
    expect(result.model_version).toBe("heuristic_v1");
  });

  test("falls back to heuristic when fetch throws (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await runMLInference(baseFeatures);
    expect(result.model_version).toBe("heuristic_v1");
  });

  test("falls back to heuristic on timeout (AbortError)", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    mockFetch.mockRejectedValueOnce(abortError);
    const result = await runMLInference(baseFeatures);
    expect(result.model_version).toBe("heuristic_v1");
  });
});

describe("simulateFromWav", () => {
  test("throws Error when WAV file does not exist", async () => {
    mockFs.existsSync.mockReturnValueOnce(false);
    await expect(simulateFromWav("/nonexistent/signal.wav")).rejects.toThrow(
      "WAV file not found: /nonexistent/signal.wav"
    );
  });

  test("returns MLPrediction on successful simulate response", async () => {
    mockFs.existsSync.mockReturnValueOnce(true);
    mockSuccessResponse(makeMLResponse(2));
    const result = await simulateFromWav("/path/to/signal.wav");
    expect(result.leak_class).toBe("minor_leak");
    expect(result.model_version).toBe("1.0.0");
  });

  test("re-throws error when simulate endpoint fails", async () => {
    mockFs.existsSync.mockReturnValueOnce(true);
    mockErrorResponse(400);
    await expect(simulateFromWav("/path/to/signal.wav")).rejects.toThrow();
  });
});
