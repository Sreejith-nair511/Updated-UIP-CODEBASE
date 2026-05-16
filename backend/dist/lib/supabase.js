"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
const logger_1 = require("./logger");
if (!config_1.config.supabase.url || config_1.config.supabase.url.includes("your-project-ref")) {
    logger_1.logger.warn("Supabase URL not configured — database calls will fail. Set SUPABASE_URL in backend/.env");
}
exports.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url || "https://placeholder.supabase.co", config_1.config.supabase.serviceRoleKey || "placeholder-key", {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
//# sourceMappingURL=supabase.js.map