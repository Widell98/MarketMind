
export interface StockCase {
  id: string;
  title: string;
  company_name: string;
  image_url?: string;
  sector?: string;
  market_cap?: string;
  pe_ratio?: string;
  dividend_yield?: string;
  description?: string;
  ai_intro?: string | null;
  long_description?: string;
  ticker?: string;
  entry_price?: number;
  current_price?: number;
  target_price?: number;
  stop_loss?: number;
  performance_percentage?: number;
  likes_count?: number;
  status: 'active' | 'winner' | 'loser';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user_id?: string;
  is_public: boolean;
  category_id?: string;
  admin_comment?: string;
  ai_generated?: boolean;
  ai_batch_id?: string;
  generated_at?: string;
  currency?: string;
  timeframe?: string;
  target_reached?: boolean;
  stop_loss_hit?: boolean;
  profiles?: {
    username: string;
    display_name: string | null;
  } | null;
  case_categories?: {
    name: string;
    color: string;
  } | null;
}
