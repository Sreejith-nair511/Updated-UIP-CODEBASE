export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pipes: {
        Row: {
          id: string;
          pipe_id: string;
          zone_id: string;
          name: string;
          location: string | null;
          material: string | null;
          diameter_mm: number | null;
          install_date: string | null;
          status: "active" | "inactive" | "maintenance";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["pipes"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["pipes"]["Insert"]>;
      };
      readings: {
        Row: {
          id: string;
          pipe_id: string;
          zone_id: string;
          reading_date: string;
          reading_time: string;
          pressure_bar: number;
          flow_lpm: number;
          leak: boolean;
          severity_pct: number;
          frequency_hz: number;
          temp_c: number;
          humidity_pct: number;
          valve_status: "OPEN" | "CLOSED";
          anomaly_score: number;
          dominant_frequency: number | null;
          frequency_distribution: Json | null;
          spectrogram_url: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["readings"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["readings"]["Insert"]>;
      };
      alerts: {
        Row: {
          id: string;
          pipe_id: string;
          zone_id: string;
          reading_id: string | null;
          alert_type: "minor_leak" | "major_leak" | "anomaly" | "pressure_spike";
          severity_pct: number;
          leak_probability: number;
          message: string;
          status: "active" | "acknowledged" | "resolved";
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["alerts"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };
      predictions: {
        Row: {
          id: string;
          reading_id: string;
          pipe_id: string;
          model_version: string;
          leak_class: "no_leak" | "minor_leak" | "major_leak";
          no_leak_prob: number;
          minor_leak_prob: number;
          major_leak_prob: number;
          severity_estimate: number;
          confidence: number;
          inference_ms: number | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["predictions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["predictions"]["Insert"]>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "operator" | "viewer";
          zone_access: string[] | null;
          push_token: string | null;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["users"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Pipe = Database["public"]["Tables"]["pipes"]["Row"];
export type Reading = Database["public"]["Tables"]["readings"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];

export type LeakClass = "no_leak" | "minor_leak" | "major_leak";
export type AlertType = "minor_leak" | "major_leak" | "anomaly" | "pressure_spike";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type PipeStatus = "active" | "inactive" | "maintenance";
export type ValveStatus = "OPEN" | "CLOSED";
