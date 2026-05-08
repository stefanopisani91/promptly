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
          // Lesson 3 — counter for /api/lesson-context-evaluate calls so
          // the context-prompt grader has its own daily budget too. Same
          // pattern as claudemd_attempts_count.
          context_attempts_count: number;
          // Lesson 4 — counter for /api/lesson-constraints-evaluate calls.
          // Independent budget so the user can finish lesson 2/3 and
          // still try lesson 4 in the same day.
          constraints_attempts_count: number;
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
