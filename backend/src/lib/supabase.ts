import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import { logger } from "./logger";

if (!config.supabase.url || config.supabase.url.includes("your-project-ref")) {
  logger.warn(
    "Supabase URL not configured — database calls will fail. Set SUPABASE_URL in backend/.env"
  );
}

export const supabase = createClient(
  config.supabase.url || "https://placeholder.supabase.co",
  config.supabase.serviceRoleKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
