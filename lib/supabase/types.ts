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
          total_xp: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          last_level_up_notified: number;
          referral_code: string | null;
          referral_link_activated_at: string | null;
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
          total_xp?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          last_level_up_notified?: number;
          referral_code?: string | null;
          referral_link_activated_at?: string | null;
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
          total_xp?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          last_level_up_notified?: number;
          referral_code?: string | null;
          referral_link_activated_at?: string | null;
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
