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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_chat_sessions: {
        Row: {
          context_data: Json | null
          created_at: string
          folder_id: string | null
          id: string
          is_active: boolean | null
          session_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          folder_id?: string | null
          id?: string
          is_active?: boolean | null
          session_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          folder_id?: string | null
          id?: string
          is_active?: boolean | null
          session_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "chat_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_market_insights: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string
          data_sources: Json | null
          expires_at: string | null
          id: string
          insight_type: string
          is_personalized: boolean | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string
          data_sources?: Json | null
          expires_at?: string | null
          id?: string
          insight_type: string
          is_personalized?: boolean | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string
          data_sources?: Json | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_personalized?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_cases: {
        Row: {
          case_date: string
          company_name: string
          created_at: string
          downside: number | null
          gpt_raw: Json | null
          id: string
          summary: string
          tavily_payload: Json | null
          thesis: Json | null
          ticker: string
          updated_at: string
          upvotes: number
          downvotes: number
          upside: number | null
        }
        Insert: {
          case_date: string
          company_name: string
          created_at?: string
          downside?: number | null
          gpt_raw?: Json | null
          id?: string
          summary: string
          tavily_payload?: Json | null
          thesis?: Json | null
          ticker: string
          updated_at?: string
          upvotes?: number
          downvotes?: number
          upside?: number | null
        }
        Update: {
          case_date?: string
          company_name?: string
          created_at?: string
          downside?: number | null
          gpt_raw?: Json | null
          id?: string
          summary?: string
          tavily_payload?: Json | null
          thesis?: Json | null
          ticker?: string
          updated_at?: string
          upvotes?: number
          downvotes?: number
          upside?: number | null
        }
        Relationships: []
      }
      analyses: {
        Row: {
          ai_generated: boolean | null
          analysis_type: string
          comments_count: number
          content: string
          created_at: string
          id: string
          is_public: boolean
          likes_count: number
          portfolio_id: string | null
          related_holdings: Json | null
          shared_from_insight_id: string | null
          stock_case_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          ai_generated?: boolean | null
          analysis_type?: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          portfolio_id?: string | null
          related_holdings?: Json | null
          shared_from_insight_id?: string | null
          stock_case_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          ai_generated?: boolean | null
          analysis_type?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          portfolio_id?: string | null
          related_holdings?: Json | null
          shared_from_insight_id?: string | null
          stock_case_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "analyses_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "user_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_shared_from_insight_id_fkey"
            columns: ["shared_from_insight_id"]
            isOneToOne: false
            referencedRelation: "portfolio_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_analyses_stock_case"
            columns: ["stock_case_id"]
            isOneToOne: false
            referencedRelation: "stock_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_comments: {
        Row: {
          analysis_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_analysis_comments_analysis"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_likes: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_analysis_likes_analysis"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
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
      chat_folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_calendar_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_momentum_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_snapshots: {
        Row: {
          created_at: string
          gpt_raw: Json | null
          highlights: Json | null
          id: string
          indices: Json
          narrative: string
          sector_heatmap: Json | null
          sentiment_label: string
          snapshot_date: string
          tavily_payload: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gpt_raw?: Json | null
          highlights?: Json | null
          id?: string
          indices: Json
          narrative: string
          sector_heatmap?: Json | null
          sentiment_label: string
          snapshot_date: string
          tavily_payload?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gpt_raw?: Json | null
          highlights?: Json | null
          id?: string
          indices?: Json
          narrative?: string
          sector_heatmap?: Json | null
          sentiment_label?: string
          snapshot_date?: string
          tavily_payload?: Json | null
          updated_at?: string
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
      portfolio_performance_history: {
        Row: {
          created_at: string
          currency: string
          date: string
          holding_id: string
          id: string
          price_per_unit: number
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          date?: string
          holding_id: string
          id?: string
          price_per_unit: number
          total_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          date?: string
          holding_id?: string
          id?: string
          price_per_unit?: number
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_portfolio_performance_holding"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "user_holdings"
            referencedColumns: ["id"]
          },
        ]
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
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_public: boolean
          portfolio_id: string | null
          post_type: string
          stock_case_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_public?: boolean
          portfolio_id?: string | null
          post_type?: string
          stock_case_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          portfolio_id?: string | null
          post_type?: string
          stock_case_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "user_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_stock_case_id_fkey"
            columns: ["stock_case_id"]
            isOneToOne: false
            referencedRelation: "stock_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          follower_count: number | null
          following_count: number | null
          id: string
          interests: Json | null
          investment_philosophy: string | null
          level: string | null
          location: string | null
          post_count: number | null
          updated_at: string
          username: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id: string
          interests?: Json | null
          investment_philosophy?: string | null
          level?: string | null
          location?: string | null
          post_count?: number | null
          updated_at?: string
          username: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          interests?: Json | null
          investment_philosophy?: string | null
          level?: string | null
          location?: string | null
          post_count?: number | null
          updated_at?: string
          username?: string
          website_url?: string | null
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          notes: string | null
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shared_portfolio_analyses: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          original_data: Json | null
          portfolio_id: string
          share_type: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          original_data?: Json | null
          portfolio_id: string
          share_type?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          original_data?: Json | null
          portfolio_id?: string
          share_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_portfolio_analyses_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_portfolio_analyses_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "user_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_case_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          stock_case_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          stock_case_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          stock_case_id?: string
          updated_at?: string
          user_id?: string
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
      stock_case_updates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          stock_case_id: string
          title: string | null
          update_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          stock_case_id: string
          title?: string | null
          update_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          stock_case_id?: string
          title?: string | null
          update_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_case_updates_stock_case_id_fkey"
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
          ai_generated: boolean | null
          category_id: string | null
          closed_at: string | null
          company_name: string
          created_at: string
          currency: string | null
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
          stop_loss_hit: boolean
          target_price: number | null
          target_reached: boolean
          timeframe: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_comment?: string | null
          ai_generated?: boolean | null
          category_id?: string | null
          closed_at?: string | null
          company_name: string
          created_at?: string
          currency?: string | null
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
          stop_loss_hit?: boolean
          target_price?: number | null
          target_reached?: boolean
          timeframe?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_comment?: string | null
          ai_generated?: boolean | null
          category_id?: string | null
          closed_at?: string | null
          company_name?: string
          created_at?: string
          currency?: string | null
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
          stop_loss_hit?: boolean
          target_price?: number | null
          target_reached?: boolean
          timeframe?: string | null
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
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_ai_insights: {
        Row: {
          created_at: string
          id: string
          insight_type: string
          insights_data: Json
          is_personalized: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          insight_type: string
          insights_data?: Json
          is_personalized?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          insight_type?: string
          insights_data?: Json
          is_personalized?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_ai_memory: {
        Row: {
          communication_style: string | null
          created_at: string
          current_goals: Json | null
          expertise_level: string | null
          favorite_sectors: Json | null
          frequently_asked_topics: Json | null
          id: string
          investment_philosophy: string | null
          last_interaction: string | null
          preferred_companies: Json | null
          preferred_interaction_times: Json | null
          preferred_response_length: string | null
          risk_comfort_patterns: Json | null
          total_conversations: number | null
          typical_session_length: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          communication_style?: string | null
          created_at?: string
          current_goals?: Json | null
          expertise_level?: string | null
          favorite_sectors?: Json | null
          frequently_asked_topics?: Json | null
          id?: string
          investment_philosophy?: string | null
          last_interaction?: string | null
          preferred_companies?: Json | null
          preferred_interaction_times?: Json | null
          preferred_response_length?: string | null
          risk_comfort_patterns?: Json | null
          total_conversations?: number | null
          typical_session_length?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          communication_style?: string | null
          created_at?: string
          current_goals?: Json | null
          expertise_level?: string | null
          favorite_sectors?: Json | null
          frequently_asked_topics?: Json | null
          id?: string
          investment_philosophy?: string | null
          last_interaction?: string | null
          preferred_companies?: Json | null
          preferred_interaction_times?: Json | null
          preferred_response_length?: string | null
          risk_comfort_patterns?: Json | null
          total_conversations?: number | null
          typical_session_length?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ai_usage: {
        Row: {
          ai_messages_count: number
          analysis_count: number
          created_at: string
          id: string
          insights_count: number
          predictive_analysis_count: number
          updated_at: string
          usage_date: string
          user_id: string | null
        }
        Insert: {
          ai_messages_count?: number
          analysis_count?: number
          created_at?: string
          id?: string
          insights_count?: number
          predictive_analysis_count?: number
          updated_at?: string
          usage_date?: string
          user_id?: string | null
        }
        Update: {
          ai_messages_count?: number
          analysis_count?: number
          created_at?: string
          id?: string
          insights_count?: number
          predictive_analysis_count?: number
          updated_at?: string
          usage_date?: string
          user_id?: string | null
        }
        Relationships: []
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
          allocation: number | null
          created_at: string
          currency: string | null
          current_price_per_unit: number | null
          current_value: number | null
          holding_type: string
          id: string
          is_cash: boolean | null
          market: string | null
          name: string
          price_currency: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          sector: string | null
          symbol: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation?: number | null
          created_at?: string
          currency?: string | null
          current_price_per_unit?: number | null
          current_value?: number | null
          holding_type: string
          id?: string
          is_cash?: boolean | null
          market?: string | null
          name: string
          price_currency?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          sector?: string | null
          symbol?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation?: number | null
          created_at?: string
          currency?: string | null
          current_price_per_unit?: number | null
          current_value?: number | null
          holding_type?: string
          id?: string
          is_cash?: boolean | null
          market?: string | null
          name?: string
          price_currency?: string | null
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
          cash_balance: number | null
          cash_currency: string | null
          created_at: string
          expected_return: number | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
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
          cash_balance?: number | null
          cash_currency?: string | null
          created_at?: string
          expected_return?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
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
          cash_balance?: number | null
          cash_currency?: string | null
          created_at?: string
          expected_return?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
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
          preferred_stock_count: number | null
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
          preferred_stock_count?: number | null
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
          preferred_stock_count?: number | null
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
      user_role_audit: {
        Row: {
          action: string
          id: string
          performed_at: string
          performed_by: string
          reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          performed_at?: string
          performed_by: string
          reason?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          performed_at?: string
          performed_by?: string
          reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
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
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          reason?: string
          target_user_id: string
        }
        Returns: boolean
      }
      assign_user_role_secure: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          reason?: string
          target_user_id: string
        }
        Returns: boolean
      }
      check_usage_limit: {
        Args: { _usage_type: string; _user_id: string }
        Returns: boolean
      }
      get_analysis_comment_count: {
        Args: { analysis_id: string }
        Returns: number
      }
      get_analysis_like_count: {
        Args: { analysis_id: string }
        Returns: number
      }
      get_post_comment_count: {
        Args: { post_id: string }
        Returns: number
      }
      get_post_like_count: {
        Args: { post_id: string }
        Returns: number
      }
      get_stock_case_comment_count: {
        Args: { case_id: string }
        Returns: number
      }
      get_stock_case_follow_count: {
        Args: { case_id: string }
        Returns: number
      }
      get_stock_case_like_count: {
        Args: { case_id: string }
        Returns: number
      }
      increment_vote: {
        Args: { case_id: string; direction: string }
        Returns: Database["public"]["Tables"]["daily_cases"]["Row"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_usage: {
        Args: { _usage_type: string; _user_id: string }
        Returns: boolean
      }
      invalidate_suspicious_sessions: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      revoke_user_role: {
        Args: {
          reason?: string
          role_to_revoke: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      user_follows_case: {
        Args: { case_id: string; user_id: string }
        Returns: boolean
      }
      user_has_liked_analysis: {
        Args: { analysis_id: string; user_id: string }
        Returns: boolean
      }
      user_has_liked_case: {
        Args: { case_id: string; user_id: string }
        Returns: boolean
      }
      user_has_liked_post: {
        Args: { post_id: string; user_id: string }
        Returns: boolean
      }
      validate_admin_action: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_session_security: {
        Args: { p_session_token: string }
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
