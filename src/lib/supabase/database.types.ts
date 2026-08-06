export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      ingredients: {
        Row: {
          aliases: string[];
          created_at: string;
          default_unit: string;
          id: number;
          is_active: boolean;
          name: string;
          slug: string;
        };
        Insert: {
          aliases?: string[];
          created_at?: string;
          default_unit: string;
          id?: never;
          is_active?: boolean;
          name: string;
          slug: string;
        };
        Update: {
          aliases?: string[];
          created_at?: string;
          default_unit?: string;
          id?: never;
          is_active?: boolean;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      leftovers: {
        Row: {
          created_at: string;
          expiry_date: string;
          id: number;
          name: string;
          notes: string | null;
          prepared_date: string;
          recipe_id: number | null;
          servings: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expiry_date: string;
          id?: never;
          name: string;
          notes?: string | null;
          prepared_date: string;
          recipe_id?: number | null;
          servings: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expiry_date?: string;
          id?: never;
          name?: string;
          notes?: string | null;
          prepared_date?: string;
          recipe_id?: number | null;
          servings?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      pantry_items: {
        Row: {
          created_at: string;
          expiry_date: string | null;
          id: number;
          ingredient_id: number;
          notes: string | null;
          quantity: number;
          unit: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expiry_date?: string | null;
          id?: never;
          ingredient_id: number;
          notes?: string | null;
          quantity: number;
          unit: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expiry_date?: string | null;
          id?: never;
          ingredient_id?: number;
          notes?: string | null;
          quantity?: number;
          unit?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pantry_items_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          available_minutes: number;
          budget_minor: number | null;
          budget_period: string;
          created_at: string;
          dietary_preferences: string[];
          display_name: string | null;
          equipment: string[];
          health_goals: string[];
          household_size: number;
          onboarding_completed: boolean;
          preferred_cuisines: string[];
          preferred_dishes: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          available_minutes?: number;
          budget_minor?: number | null;
          budget_period?: string;
          created_at?: string;
          dietary_preferences?: string[];
          display_name?: string | null;
          equipment?: string[];
          health_goals?: string[];
          household_size?: number;
          onboarding_completed?: boolean;
          preferred_cuisines?: string[];
          preferred_dishes?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          available_minutes?: number;
          budget_minor?: number | null;
          budget_period?: string;
          created_at?: string;
          dietary_preferences?: string[];
          display_name?: string | null;
          equipment?: string[];
          health_goals?: string[];
          household_size?: number;
          onboarding_completed?: boolean;
          preferred_cuisines?: string[];
          preferred_dishes?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      rate_limit_buckets: {
        Row: {
          action: string;
          expires_at: string;
          key_hash: string;
          request_count: number;
          window_started_at: string;
        };
        Insert: {
          action: string;
          expires_at: string;
          key_hash: string;
          request_count: number;
          window_started_at: string;
        };
        Update: {
          action?: string;
          expires_at?: string;
          key_hash?: string;
          request_count?: number;
          window_started_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_rate_limit: {
        Args: {
          p_action: string;
          p_key_hash: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals["public"];

export type Tables<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Update"];

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
