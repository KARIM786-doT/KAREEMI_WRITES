// The Supabase URL and publishable key are designed for browser use. Never place a service-role key here.
export const SUPABASE_URL = "https://royziiuorwmnwxcjsjca.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fSnz7f4EvbnuNHJ_hkhH2w_-dWXXbW6";
export const isSupabaseConfigured = !SUPABASE_URL.startsWith("YOUR_") && !SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_");
