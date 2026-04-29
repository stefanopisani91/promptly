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
          daily_goal: "trivial" | "easy" | "pro";
          onboarding_completed_at: string | null;
          signup_source: string | null;
          welcome_seen_at: string | null;
          push_prompted_at: string | null;
          ai_eval_prompted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          language?: "en" | "it";
          daily_goal?: "trivial" | "easy" | "pro";
          onboarding_completed_at?: string | null;
          signup_source?: string | null;
          welcome_seen_at?: string | null;
          push_prompted_at?: string | null;
          ai_eval_prompted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          language?: "en" | "it";
          daily_goal?: "trivial" | "easy" | "pro";
          onboarding_completed_at?: string | null;
          signup_source?: string | null;
          welcome_seen_at?: string | null;
          push_prompted_at?: string | null;
          ai_eval_prompted_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
