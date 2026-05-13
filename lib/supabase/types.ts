// Generated-style Database type stub. Kept hand-maintained while the schema
// is small. Regenerate with the Supabase CLI (`supabase gen types typescript`)
// once more tables ship.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          language: "en" | "it";
          daily_goal: "mini" | "trivial" | "easy" | "pro";
          onboarding_completed_at: string | null;
          signup_source: string | null;
          welcome_seen_at: string | null;
          push_prompted_at: string | null;
          ai_eval_prompted_at: string | null;
          total_xp: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          last_level_up_notified: number;
          referral_code: string | null;
          referral_link_activated_at: string | null;
          archetype_key: string | null;
          experience_level:
            | "beginner"
            | "tried_failed"
            | "working_on_it"
            | "advanced"
            | null;
          project_clarity: "precise" | "vague" | "exploring" | null;
          project_description: string | null;
          tools_used: string[];
          tools_other: string | null;
          preferred_tool: string | null;
          deep_motivation: string | null;
          promises: Json | null;
          last_profile_check: string | null;
          // Glossario Vivo — terms the user has clicked at least once.
          // Drives the "already seen" attenuated style on subsequent
          // occurrences. Defaults to '{}'.
          glossary_seen: string[];
          // Mitigation 2 (2026-05-09) — ≤80-char Haiku-compressed view
          // of project_description, used in frequent AI prompts (Spark
          // chat, evaluators). Null until generated; lazy-backfilled by
          // getUserProfile when raw > 100 chars and this column is null.
          project_description_compressed: string | null;
          // Same pattern, applied to deep_motivation (2026-05-09).
          // ≤100-char compressed view that preserves the emotional core
          // (in first person). Used in Spark's session context for
          // empathic interventions; raw stays for the 3-promises generator.
          deep_motivation_compressed: string | null;
          // Rate-limit tier — 'standard' default, others promoted via
          // /admin/users. Migration 20260509170000_user_account_types.
          account_type: "standard" | "beta" | "qa" | "dev" | "press";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          language?: "en" | "it";
          daily_goal?: "mini" | "trivial" | "easy" | "pro";
          onboarding_completed_at?: string | null;
          signup_source?: string | null;
          welcome_seen_at?: string | null;
          push_prompted_at?: string | null;
          ai_eval_prompted_at?: string | null;
          total_xp?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          last_level_up_notified?: number;
          referral_code?: string | null;
          referral_link_activated_at?: string | null;
          archetype_key?: string | null;
          experience_level?:
            | "beginner"
            | "tried_failed"
            | "working_on_it"
            | "advanced"
            | null;
          project_clarity?: "precise" | "vague" | "exploring" | null;
          project_description?: string | null;
          tools_used?: string[];
          tools_other?: string | null;
          preferred_tool?: string | null;
          deep_motivation?: string | null;
          promises?: Json | null;
          last_profile_check?: string | null;
          glossary_seen?: string[];
          project_description_compressed?: string | null;
          deep_motivation_compressed?: string | null;
          account_type?: "standard" | "beta" | "qa" | "dev" | "press";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          language?: "en" | "it";
          daily_goal?: "mini" | "trivial" | "easy" | "pro";
          onboarding_completed_at?: string | null;
          signup_source?: string | null;
          welcome_seen_at?: string | null;
          push_prompted_at?: string | null;
          ai_eval_prompted_at?: string | null;
          total_xp?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          last_level_up_notified?: number;
          referral_code?: string | null;
          referral_link_activated_at?: string | null;
          archetype_key?: string | null;
          experience_level?:
            | "beginner"
            | "tried_failed"
            | "working_on_it"
            | "advanced"
            | null;
          project_clarity?: "precise" | "vague" | "exploring" | null;
          project_description?: string | null;
          tools_used?: string[];
          tools_other?: string | null;
          preferred_tool?: string | null;
          deep_motivation?: string | null;
          promises?: Json | null;
          last_profile_check?: string | null;
          glossary_seen?: string[];
          project_description_compressed?: string | null;
          deep_motivation_compressed?: string | null;
          account_type?: "standard" | "beta" | "qa" | "dev" | "press";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          path_slug: string;
          completed: boolean;
          attempts: number;
          xp_earned: number;
          completed_at: string | null;
          current_step: number;
          step_state: Json;
          spark_chat_count: number;
          // Spark Helper (contextual tutor in V3 quick-wins) — per-lesson
          // message counter. Sibling of spark_chat_count. Added by
          // migration 20260512120000_spark_helper_quota.sql.
          spark_helper_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          path_slug: string;
          completed?: boolean;
          attempts?: number;
          xp_earned?: number;
          completed_at?: string | null;
          current_step?: number;
          step_state?: Json;
          spark_chat_count?: number;
          spark_helper_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          path_slug?: string;
          completed?: boolean;
          attempts?: number;
          xp_earned?: number;
          completed_at?: string | null;
          current_step?: number;
          step_state?: Json;
          spark_chat_count?: number;
          spark_helper_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referee_id: string;
          xp_awarded_referrer: number;
          xp_awarded_referee: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referee_id: string;
          xp_awarded_referrer?: number;
          xp_awarded_referee?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referee_id?: string;
          xp_awarded_referrer?: number;
          xp_awarded_referee?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      spark_usage_daily: {
        Row: {
          user_id: string;
          usage_date: string; // YYYY-MM-DD
          message_count: number;
          // Round 8b — separate counter for promise generation calls so
          // chat usage and promise spend don't share the same quota.
          promise_regen_count: number;
          // Lesson 2 — counter for /api/lesson-claudemd-evaluate calls so
          // the CLAUDE.md grader has its own daily budget independent of
          // chat and promise spend.
          claudemd_attempts_count: number;
          // Lesson 3 — legacy daily counter for the v3 context-prompt
          // grader (replaced by block_picker, scored deterministically).
          // Column kept to avoid a migration; no longer incremented.
          context_attempts_count: number;
          // Lesson 4 — counter for /api/lesson-constraints-evaluate calls.
          // Independent budget so the user can finish lesson 2/3 and
          // still try lesson 4 in the same day.
          constraints_attempts_count: number;
          // Lesson 5 — counter for /api/lesson-debug-evaluate calls
          // (broken-session debugger). Same isolation as the other
          // per-lesson counters.
          debug_attempts_count: number;
          // Lesson 6 — counter for /api/lesson-architecture-prompt
          // calls (prompt-architecture hero widget). Same pattern.
          architecture_attempts_count: number;
          // Spark Helper (contextual tutor in V3 quick-wins) — per-day
          // message counter, across all quick-wins. Sibling of
          // message_count / *_attempts_count. Added by migration
          // 20260512120000_spark_helper_quota.sql.
          helper_messages_count: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          usage_date: string;
          message_count?: number;
          promise_regen_count?: number;
          claudemd_attempts_count?: number;
          context_attempts_count?: number;
          constraints_attempts_count?: number;
          debug_attempts_count?: number;
          architecture_attempts_count?: number;
          helper_messages_count?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          usage_date?: string;
          message_count?: number;
          promise_regen_count?: number;
          claudemd_attempts_count?: number;
          context_attempts_count?: number;
          constraints_attempts_count?: number;
          debug_attempts_count?: number;
          architecture_attempts_count?: number;
          helper_messages_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      spark_safety_log: {
        Row: {
          id: number;
          user_id: string;
          lesson_id: string | null;
          signal: string;
          excerpt: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          lesson_id?: string | null;
          signal: string;
          excerpt?: string | null;
          occurred_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          lesson_id?: string | null;
          signal?: string;
          excerpt?: string | null;
          occurred_at?: string;
        };
        Relationships: [];
      };
      pending_account_tiers: {
        // Email → tier pre-assignments. Consumed by the onboarding
        // action when the user signs up — see app/(auth)/onboarding/
        // actions.ts. Migration 20260509180000_pending_account_tiers.
        Row: {
          email: string;
          account_type: "standard" | "beta" | "qa" | "dev" | "press";
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          email: string;
          account_type: "standard" | "beta" | "qa" | "dev" | "press";
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          account_type?: "standard" | "beta" | "qa" | "dev" | "press";
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      usage_logs: {
        // Append-only audit of every rate-limit hit. Inserted by the
        // 5 API routes from the user's session at 403 time; read only
        // by dev-tier users on /admin/users. Migration
        // 20260509190000_usage_logs.
        Row: {
          id: number;
          user_id: string;
          account_type: "standard" | "beta" | "qa" | "dev" | "press";
          event_type: string;
          endpoint: string;
          lesson_id: string | null;
          attempt_number: number | null;
          limit_value: number | null;
          occurred_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          account_type: "standard" | "beta" | "qa" | "dev" | "press";
          event_type: string;
          endpoint: string;
          lesson_id?: string | null;
          attempt_number?: number | null;
          limit_value?: number | null;
          occurred_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          account_type?: "standard" | "beta" | "qa" | "dev" | "press";
          event_type?: string;
          endpoint?: string;
          lesson_id?: string | null;
          attempt_number?: number | null;
          limit_value?: number | null;
          occurred_at?: string;
        };
        Relationships: [];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
