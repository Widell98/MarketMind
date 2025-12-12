export type IntentType =
  | 'stock_analysis'
  | 'portfolio_optimization'
  | 'buy_sell_decisions'
  | 'market_analysis'
  | 'general_news'
  | 'news_update'
  | 'general_advice'
  | 'document_summary'
  | 'prediction_analysis';

export type IntentDetectionResult = {
  intents: IntentType[];
  entities: string[];
  language: string | null;
  raw?: string;
};
