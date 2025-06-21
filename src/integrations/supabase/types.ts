export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_chat_sessions: {
        Row: {
          context_data: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          session_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          session_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          session_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      case_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      portfolio_chat_history: {
        Row: {
          ai_confidence_score: number | null
          chat_session_id: string | null
          context_data: Json | null
          created_at: string
          id: string
          message: string
          message_type: string
          portfolio_id: string | null
          response_time_ms: number | null
          user_feedback: number | null
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          chat_session_id?: string | null
          context_data?: Json | null
          created_at?: string
          id?: string
          message: string
          message_type: string
          portfolio_id?: string | null
          response_time_ms?: number | null
          user_feedback?: number | null
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          chat_session_id?: string | null
          context_data?: Json | null
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          portfolio_id?: string | null
          response_time_ms?: number | null
          user_feedback?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_chat_history_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_chat_history_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "user_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_insights: {
        Row: {
          action_required: boolean | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_read: boolean | null
          related_holdings: Json | null
          severity: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_required?: boolean | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_read?: boolean | null
          related_holdings?: Json | null
          severity?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_required?: boolean | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_read?: boolean | null
          related_holdings?: Json | null
          severity?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_recommendations: {
        Row: {
          ai_reasoning: string | null
          created_at: string
          description: string
          id: string
          is_implemented: boolean | null
          portfolio_id: string
          priority: string | null
          recommendation_type: string
          title: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          created_at?: string
          description: string
          id?: string
          is_implemented?: boolean | null
          portfolio_id: string
          priority?: string | null
          recommendation_type: string
          title: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          created_at?: string
          description?: string
          id?: string
          is_implemented?: boolean | null
          portfolio_id?: string
          priority?: string | null
          recommendation_type?: string
          title?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_recommendations_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "user_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          interests: Json | null
          level: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          interests?: Json | null
          level?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: Json | null
          level?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      stock_case_follows: {
        Row: {
          created_at: string
          id: string
          stock_case_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stock_case_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stock_case_id?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_case_image_history: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          is_current: boolean
          stock_case_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_current?: boolean
          stock_case_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_current?: boolean
          stock_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_case_image_history_stock_case_id_fkey"
            columns: ["stock_case_id"]
            isOneToOne: false
            referencedRelation: "stock_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_case_likes: {
        Row: {
          created_at: string
          id: string
          stock_case_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stock_case_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stock_case_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_case_likes_stock_case_id_fkey"
            columns: ["stock_case_id"]
            isOneToOne: false
            referencedRelation: "stock_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_cases: {
        Row: {
          admin_comment: string | null
          category_id: string | null
          closed_at: string | null
          company_name: string
          created_at: string
          current_price: number | null
          description: string | null
          dividend_yield: string | null
          entry_price: number | null
          id: string
          image_url: string | null
          is_public: boolean | null
          market_cap: string | null
          pe_ratio: string | null
          performance_percentage: number | null
          sector: string | null
          status: string | null
          stop_loss: number | null
          target_price: number | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_comment?: string | null
          category_id?: string | null
          closed_at?: string | null
          company_name: string
          created_at?: string
          current_price?: number | null
          description?: string | null
          dividend_yield?: string | null
          entry_price?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          market_cap?: string | null
          pe_ratio?: string | null
          performance_percentage?: number | null
          sector?: string | null
          status?: string | null
          stop_loss?: number | null
          target_price?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_comment?: string | null
          category_id?: string | null
          closed_at?: string | null
          company_name?: string
          created_at?: string
          current_price?: number | null
          description?: string | null
          dividend_yield?: string | null
          entry_price?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          market_cap?: string | null
          pe_ratio?: string | null
          performance_percentage?: number | null
          sector?: string | null
          status?: string | null
          stop_loss?: number | null
          target_price?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_cases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_completed_quizzes: {
        Row: {
          completed_at: string
          id: string
          quiz_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          quiz_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          quiz_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_holdings: {
        Row: {
          created_at: string
          currency: string | null
          current_value: number | null
          holding_type: string
          id: string
          market: string | null
          name: string
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          sector: string | null
          symbol: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          current_value?: number | null
          holding_type: string
          id?: string
          market?: string | null
          name: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          sector?: string | null
          symbol?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          current_value?: number | null
          holding_type?: string
          id?: string
          market?: string | null
          name?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          sector?: string | null
          symbol?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_modules: {
        Row: {
          id: string
          module_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          module_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      user_portfolios: {
        Row: {
          asset_allocation: Json
          created_at: string
          expected_return: number | null
          id: string
          is_active: boolean | null
          last_rebalanced_at: string | null
          portfolio_name: string
          recommended_stocks: Json | null
          risk_profile_id: string
          risk_score: number | null
          total_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_allocation: Json
          created_at?: string
          expected_return?: number | null
          id?: string
          is_active?: boolean | null
          last_rebalanced_at?: string | null
          portfolio_name?: string
          recommended_stocks?: Json | null
          risk_profile_id: string
          risk_score?: number | null
          total_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_allocation?: Json
          created_at?: string
          expected_return?: number | null
          id?: string
          is_active?: boolean | null
          last_rebalanced_at?: string | null
          portfolio_name?: string
          recommended_stocks?: Json | null
          risk_profile_id?: string
          risk_score?: number | null
          total_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_portfolios_risk_profile_id_fkey"
            columns: ["risk_profile_id"]
            isOneToOne: false
            referencedRelation: "user_risk_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_categories: {
        Row: {
          category: string
          correct_answers: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          correct_answers?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          correct_answers?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quiz_progress: {
        Row: {
          correct_answers: number
          created_at: string
          current_streak: number
          id: string
          last_quiz_date: string | null
          level: string
          longest_streak: number
          points: number
          total_quizzes_taken: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_quiz_date?: string | null
          level?: string
          longest_streak?: number
          points?: number
          total_quizzes_taken?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_quiz_date?: string | null
          level?: string
          longest_streak?: number
          points?: number
          total_quizzes_taken?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_risk_profiles: {
        Row: {
          activity_preference: string | null
          age: number | null
          annual_income: number | null
          control_importance: number | null
          created_at: string
          current_allocation: Json | null
          current_holdings: Json | null
          current_portfolio_value: number | null
          emergency_buffer_months: number | null
          has_children: boolean | null
          has_loans: boolean | null
          housing_situation: string | null
          id: string
          investment_experience: string | null
          investment_goal: string | null
          investment_horizon: string | null
          investment_purpose: string[] | null
          investment_style_preference: string | null
          liquid_capital: number | null
          loan_details: string | null
          market_crash_reaction: string | null
          monthly_investment_amount: number | null
          overexposure_awareness: string | null
          panic_selling_history: boolean | null
          portfolio_change_frequency: string | null
          risk_comfort_level: number | null
          risk_tolerance: string | null
          sector_interests: Json | null
          target_amount: number | null
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_preference?: string | null
          age?: number | null
          annual_income?: number | null
          control_importance?: number | null
          created_at?: string
          current_allocation?: Json | null
          current_holdings?: Json | null
          current_portfolio_value?: number | null
          emergency_buffer_months?: number | null
          has_children?: boolean | null
          has_loans?: boolean | null
          housing_situation?: string | null
          id?: string
          investment_experience?: string | null
          investment_goal?: string | null
          investment_horizon?: string | null
          investment_purpose?: string[] | null
          investment_style_preference?: string | null
          liquid_capital?: number | null
          loan_details?: string | null
          market_crash_reaction?: string | null
          monthly_investment_amount?: number | null
          overexposure_awareness?: string | null
          panic_selling_history?: boolean | null
          portfolio_change_frequency?: string | null
          risk_comfort_level?: number | null
          risk_tolerance?: string | null
          sector_interests?: Json | null
          target_amount?: number | null
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_preference?: string | null
          age?: number | null
          annual_income?: number | null
          control_importance?: number | null
          created_at?: string
          current_allocation?: Json | null
          current_holdings?: Json | null
          current_portfolio_value?: number | null
          emergency_buffer_months?: number | null
          has_children?: boolean | null
          has_loans?: boolean | null
          housing_situation?: string | null
          id?: string
          investment_experience?: string | null
          investment_goal?: string | null
          investment_horizon?: string | null
          investment_purpose?: string[] | null
          investment_style_preference?: string | null
          liquid_capital?: number | null
          loan_details?: string | null
          market_crash_reaction?: string | null
          monthly_investment_amount?: number | null
          overexposure_awareness?: string | null
          panic_selling_history?: boolean | null
          portfolio_change_frequency?: string | null
          risk_comfort_level?: number | null
          risk_tolerance?: string | null
          sector_interests?: Json | null
          target_amount?: number | null
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_stock_case_follow_count: {
        Args: { case_id: string }
        Returns: number
      }
      get_stock_case_like_count: {
        Args: { case_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      user_follows_case: {
        Args: { case_id: string; user_id: string }
        Returns: boolean
      }
      user_has_liked_case: {
        Args: { case_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
