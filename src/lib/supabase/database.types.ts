export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cook_session_steps: {
        Row: {
          completed_at: string
          session_id: number
          step_number: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          session_id: number
          step_number: number
          user_id: string
        }
        Update: {
          completed_at?: string
          session_id?: number
          step_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_session_steps_session_owner_fkey"
            columns: ["session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "cook_sessions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      cook_sessions: {
        Row: {
          completed_at: string | null
          current_step: number
          id: number
          recipe_id: number
          servings: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number
          id?: never
          recipe_id: number
          servings: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number
          id?: never
          recipe_id?: number
          servings?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_sessions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_costs: {
        Row: {
          captured_on: string
          created_at: string
          id: number
          ingredient_id: number
          is_active: boolean
          location: string
          price_minor: number
          quantity: number
          source_label: string
          source_url: string
          unit: string
          updated_at: string
        }
        Insert: {
          captured_on: string
          created_at?: string
          id?: never
          ingredient_id: number
          is_active?: boolean
          location: string
          price_minor: number
          quantity: number
          source_label: string
          source_url: string
          unit: string
          updated_at?: string
        }
        Update: {
          captured_on?: string
          created_at?: string
          id?: never
          ingredient_id?: number
          is_active?: boolean
          location?: string
          price_minor?: number
          quantity?: number
          source_label?: string
          source_url?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_costs_ingredient_fkey"
            columns: ["ingredient_id", "unit"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id", "default_unit"]
          },
        ]
      }
      ingredient_substitutions: {
        Row: {
          alternative_ingredient_id: number
          alternative_quantity: number
          alternative_unit: string
          created_at: string
          id: number
          is_active: boolean
          note: string
          source_ingredient_id: number
          source_quantity: number
          source_unit: string
          updated_at: string
        }
        Insert: {
          alternative_ingredient_id: number
          alternative_quantity: number
          alternative_unit: string
          created_at?: string
          id?: never
          is_active?: boolean
          note: string
          source_ingredient_id: number
          source_quantity: number
          source_unit: string
          updated_at?: string
        }
        Update: {
          alternative_ingredient_id?: number
          alternative_quantity?: number
          alternative_unit?: string
          created_at?: string
          id?: never
          is_active?: boolean
          note?: string
          source_ingredient_id?: number
          source_quantity?: number
          source_unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_substitutions_alternative_fkey"
            columns: ["alternative_ingredient_id", "alternative_unit"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id", "default_unit"]
          },
          {
            foreignKeyName: "ingredient_substitutions_source_fkey"
            columns: ["source_ingredient_id", "source_unit"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id", "default_unit"]
          },
        ]
      }
      ingredients: {
        Row: {
          aliases: string[]
          category: string
          created_at: string
          default_unit: string
          id: number
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          aliases?: string[]
          category?: string
          created_at?: string
          default_unit: string
          id?: never
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          aliases?: string[]
          category?: string
          created_at?: string
          default_unit?: string
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      leftovers: {
        Row: {
          created_at: string
          expiry_date: string
          id: number
          name: string
          notes: string | null
          prepared_date: string
          recipe_id: number | null
          servings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date: string
          id?: never
          name: string
          notes?: string | null
          prepared_date: string
          recipe_id?: number | null
          servings: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string
          id?: never
          name?: string
          notes?: string | null
          prepared_date?: string
          recipe_id?: number | null
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leftovers_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_history: {
        Row: {
          cook_session_id: number | null
          created_at: string
          eaten_at: string
          id: number
          recipe_id: number
          source: string
          user_id: string
        }
        Insert: {
          cook_session_id?: number | null
          created_at?: string
          eaten_at?: string
          id?: never
          recipe_id: number
          source: string
          user_id: string
        }
        Update: {
          cook_session_id?: number | null
          created_at?: string
          eaten_at?: string
          id?: never
          recipe_id?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_history_cook_session_id_fkey"
            columns: ["cook_session_id"]
            isOneToOne: true
            referencedRelation: "cook_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_history_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_items: {
        Row: {
          budgeted_cost_minor: number
          created_at: string
          day_of_week: number
          estimated_cost_minor: number
          id: number
          meal_plan_id: number
          meal_type: string
          recipe_id: number
          servings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          budgeted_cost_minor: number
          created_at?: string
          day_of_week: number
          estimated_cost_minor: number
          id?: never
          meal_plan_id: number
          meal_type: string
          recipe_id: number
          servings: number
          updated_at?: string
          user_id: string
        }
        Update: {
          budgeted_cost_minor?: number
          created_at?: string
          day_of_week?: number
          estimated_cost_minor?: number
          id?: never
          meal_plan_id?: number
          meal_type?: string
          recipe_id?: number
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_plan_owner_fkey"
            columns: ["meal_plan_id", "user_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "meal_plan_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          budget_limit_minor: number
          created_at: string
          estimated_total_minor: number
          id: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          budget_limit_minor: number
          created_at?: string
          estimated_total_minor?: number
          id?: never
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          budget_limit_minor?: number
          created_at?: string
          estimated_total_minor?: number
          id?: never
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          archived_at: string | null
          created_at: string
          expiry_date: string | null
          id: number
          ingredient_id: number
          notes: string | null
          quantity: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: never
          ingredient_id: number
          notes?: string | null
          quantity: number
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: never
          ingredient_id?: number
          notes?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          available_minutes: number
          breakfast_minutes: number
          budget_minor: number | null
          budget_period: string
          dinner_minutes: number
          eat_now_minutes: number
          created_at: string
          dietary_preferences: string[]
          display_name: string | null
          equipment: string[]
          health_goals: string[]
          household_size: number
          lunch_minutes: number
          onboarding_completed: boolean
          preferred_cuisines: string[]
          preferred_dishes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          available_minutes?: number
          breakfast_minutes?: number
          budget_minor?: number | null
          budget_period?: string
          dinner_minutes?: number
          eat_now_minutes?: number
          created_at?: string
          dietary_preferences?: string[]
          display_name?: string | null
          equipment?: string[]
          health_goals?: string[]
          household_size?: number
          lunch_minutes?: number
          onboarding_completed?: boolean
          preferred_cuisines?: string[]
          preferred_dishes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          available_minutes?: number
          breakfast_minutes?: number
          budget_minor?: number | null
          budget_period?: string
          dinner_minutes?: number
          eat_now_minutes?: number
          created_at?: string
          dietary_preferences?: string[]
          display_name?: string | null
          equipment?: string[]
          health_goals?: string[]
          household_size?: number
          lunch_minutes?: number
          onboarding_completed?: boolean
          preferred_cuisines?: string[]
          preferred_dishes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_buckets: {
        Row: {
          action: string
          expires_at: string
          key_hash: string
          request_count: number
          window_started_at: string
        }
        Insert: {
          action: string
          expires_at: string
          key_hash: string
          request_count: number
          window_started_at: string
        }
        Update: {
          action?: string
          expires_at?: string
          key_hash?: string
          request_count?: number
          window_started_at?: string
        }
        Relationships: []
      }
      recipe_feedback: {
        Row: {
          created_at: string
          recipe_id: number
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          recipe_id: number
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          recipe_id?: number
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_feedback_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_images: {
        Row: {
          alt_text: string
          attribution_name: string
          attribution_url: string
          created_at: string
          height: number
          id: number
          is_primary: boolean
          license_name: string
          license_url: string
          local_path: string
          recipe_id: number
          width: number
        }
        Insert: {
          alt_text: string
          attribution_name: string
          attribution_url: string
          created_at?: string
          height: number
          id?: never
          is_primary?: boolean
          license_name: string
          license_url: string
          local_path: string
          recipe_id: number
          width: number
        }
        Update: {
          alt_text?: string
          attribution_name?: string
          attribution_url?: string
          created_at?: string
          height?: number
          id?: never
          is_primary?: boolean
          license_name?: string
          license_url?: string
          local_path?: string
          recipe_id?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_images_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          ingredient_id: number
          is_optional: boolean
          preparation: string | null
          quantity: number
          recipe_id: number
          sort_order: number
          unit: string
        }
        Insert: {
          ingredient_id: number
          is_optional?: boolean
          preparation?: string | null
          quantity: number
          recipe_id: number
          sort_order: number
          unit: string
        }
        Update: {
          ingredient_id?: number
          is_optional?: boolean
          preparation?: string | null
          quantity?: number
          recipe_id?: number
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_fkey"
            columns: ["ingredient_id", "unit"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id", "default_unit"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          instruction: string
          recipe_id: number
          step_number: number
        }
        Insert: {
          instruction: string
          recipe_id: number
          step_number: number
        }
        Update: {
          instruction?: string
          recipe_id?: number
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          accepted_heat_sources: string[]
          base_servings: number
          cook_minutes: number
          created_at: string
          cuisine: string
          dietary_tags: string[]
          difficulty: string
          health_tags: string[]
          id: number
          instructions: string[]
          is_active: boolean
          meal_types: string[]
          name: string
          prep_minutes: number
          required_equipment: string[]
          slug: string
          summary: string
          updated_at: string
        }
        Insert: {
          accepted_heat_sources?: string[]
          base_servings: number
          cook_minutes: number
          created_at?: string
          cuisine: string
          dietary_tags?: string[]
          difficulty: string
          health_tags?: string[]
          id?: never
          instructions: string[]
          is_active?: boolean
          meal_types: string[]
          name: string
          prep_minutes: number
          required_equipment?: string[]
          slug: string
          summary: string
          updated_at?: string
        }
        Update: {
          accepted_heat_sources?: string[]
          base_servings?: number
          cook_minutes?: number
          created_at?: string
          cuisine?: string
          dietary_tags?: string[]
          difficulty?: string
          health_tags?: string[]
          id?: never
          instructions?: string[]
          is_active?: boolean
          meal_types?: string[]
          name?: string
          prep_minutes?: number
          required_equipment?: string[]
          slug?: string
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          recipe_id: number
          saved_at: string
          user_id: string
        }
        Insert: {
          recipe_id: number
          saved_at?: string
          user_id: string
        }
        Update: {
          recipe_id?: number
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          created_at: string
          estimated_cost_minor: number
          id: number
          ingredient_id: number | null
          is_checked: boolean
          name: string
          quantity: number
          shopping_list_id: number
          source: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_cost_minor?: number
          id?: never
          ingredient_id?: number | null
          is_checked?: boolean
          name: string
          quantity: number
          shopping_list_id: number
          source: string
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_cost_minor?: number
          id?: never
          ingredient_id?: number | null
          is_checked?: boolean
          name?: string
          quantity?: number
          shopping_list_id?: number
          source?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_ingredient_unit_fkey"
            columns: ["ingredient_id", "unit"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id", "default_unit"]
          },
          {
            foreignKeyName: "shopping_list_items_list_owner_fkey"
            columns: ["shopping_list_id", "user_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          estimated_total_minor: number
          id: number
          is_active: boolean
          meal_plan_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_total_minor?: number
          id?: never
          is_active?: boolean
          meal_plan_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_total_minor?: number
          id?: never
          is_active?: boolean
          meal_plan_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_plan_owner_fkey"
            columns: ["meal_plan_id", "user_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_rate_limit: {
        Args: {
          p_action: string
          p_key_hash: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      get_recommendation_candidates: {
        Args: {
          p_budget_minor: number
          p_dietary: string[]
          p_equipment: string[]
          p_max_minutes: number
          p_meal_type?: string
          p_servings: number
        }
        Returns: {
          affordable_cost_minor: number
          estimated_cost_minor: number
          recipe_id: number
          uses_substitution: boolean
        }[]
      }
      mutate_cook_session: {
        Args: {
          p_completed?: boolean
          p_current_step?: number
          p_operation: string
          p_recipe_id: number
          p_servings?: number
          p_step_number?: number
        }
        Returns: {
          completed_steps: number
          cook_session_id: number
          session_current_step: number
          session_status: string
        }[]
      }
      mutate_recipe_personalisation: {
        Args: { p_operation: string; p_recipe_id: number }
        Returns: {
          feedback_state: string
          is_saved: boolean
          last_eaten_at: string
        }[]
      }
      mutate_shopping_list_item: {
        Args: {
          p_estimated_cost_minor?: number
          p_is_checked?: boolean
          p_item_id?: number
          p_name?: string
          p_operation: string
          p_quantity?: number
          p_shopping_list_id: number
          p_unit?: string
        }
        Returns: {
          estimated_total_minor: number
          shopping_list_item_id: number
        }[]
      }
      regenerate_shopping_list: {
        Args: { p_meal_plan_id: number }
        Returns: {
          estimated_total_minor: number
          item_count: number
          shopping_list_id: number
        }[]
      }
      replace_weekly_meal_plan: {
        Args: {
          p_budget_limit_minor: number
          p_items: Json
          p_week_start: string
        }
        Returns: {
          estimated_total_minor: number
          meal_plan_id: number
        }[]
      }
      search_public_recipes: {
        Args: {
          p_cuisine?: string
          p_dietary_tags?: string[]
          p_difficulty?: string
          p_equipment?: string[]
          p_ingredient_query?: string
          p_limit?: number
          p_max_cost_minor?: number
          p_max_minutes?: number
          p_offset?: number
          p_query?: string
        }
        Returns: {
          base_servings: number
          cost_captured_on: string
          cuisine: string
          dietary_tags: string[]
          difficulty: string
          estimated_cost_minor: number
          estimated_cost_per_serving_minor: number
          image_alt: string
          image_height: number
          image_path: string
          image_width: number
          meal_types: string[]
          name: string
          recipe_id: number
          required_equipment: string[]
          slug: string
          summary: string
          total_count: number
          total_minutes: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
