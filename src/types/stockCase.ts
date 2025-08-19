
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
  entry_price?: number;
  current_price?: number;
  target_price?: number;
  stop_loss?: number;
  performance_percentage?: number;
  status: 'active' | 'winner' | 'loser';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user_id?: string;
  is_public: boolean;
  category_id?: string;
  admin_comment?: string;
  ai_generated?: boolean;
  currency?: string;
  timeframe?: string;
  profiles?: {
    username: string;
    display_name: string | null;
  } | null;
  case_categories?: {
    name: string;
    color: string;
  } | null;
}
