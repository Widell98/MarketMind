
export interface Analysis {
  id: string;
  title: string;
  content: string;
  analysis_type: 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive';
  created_at: string;
  updated_at: string;
  user_id: string;
  stock_case_id?: string;
  portfolio_id?: string;
  tags: string[];
  is_public: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  ai_generated?: boolean;
  related_holdings?: any[];
  shared_from_insight_id?: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
  stock_cases?: {
    company_name: string;
    title: string;
  } | null;
  user_portfolios?: {
    portfolio_name: string;
  } | null;
  isLiked: boolean;
}
