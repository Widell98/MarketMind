// Common TypeScript interfaces and types for portfolio-ai-chat

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type MacroTheme = 'inflation' | 'rates' | 'growth';

export type AnalysisAngle = 'cash_flow' | 'margin_focus' | 'demand' | 'capital_allocation';

export type AnalysisFocusSignals = {
  wantsOverview?: boolean;
  wantsTriggers?: boolean;
  wantsRisks?: boolean;
  wantsValuation?: boolean;
  wantsFinancials?: boolean;
  wantsRecommendation?: boolean;
  wantsAlternatives?: boolean;
};

export type SheetTickerEdgeItem = {
  symbol?: string | null;
  name?: string | null;
  price?: number | null;
  currency?: string | null;
};

export type SheetTickerEdgeResponse = {
  tickers?: SheetTickerEdgeItem[];
};

export type HoldingRecord = {
  symbol?: string | null;
  name?: string | null;
  holding_type?: string | null;
  quantity?: number | string | null;
  current_price_per_unit?: number | string | null;
  price_currency?: string | null;
  currency?: string | null;
  current_value?: number | string | null;
  purchase_price?: number | string | null;
};

export type HoldingValueBreakdown = {
  quantity: number;
  pricePerUnit: number | null;
  priceCurrency: string;
  valueInOriginalCurrency: number;
  valueCurrency: string;
  valueInSEK: number;
  pricePerUnitInSEK: number | null;
  hasDirectPrice: boolean;
};

export type ReturnQuestionType = 'total' | 'specific' | 'all' | 'ranking' | 'none';

export type ReturnQuestionAnalysis = {
  isReturnQuestion: boolean;
  questionType: ReturnQuestionType;
  mentionedTickers: string[];
  mentionedCompanyNames: string[];
};

export type HoldingWithReturn = {
  holding: HoldingRecord;
  value: HoldingValueBreakdown;
  investedValue: number;
  returnAmount: number;
  returnPercentage: number | null;
  hasPurchasePrice: boolean;
};

export type RealTimeAssessment = {
  needsRealtime: boolean;
  questionType?: string;
  recommendations?: 'yes' | 'no';
  reason?: string;
};

export type NewsIntentLabel = 'news_update' | 'general_news' | 'none';

export type StockIntentEvaluationResult = {
  classification: 'stock_focus' | 'general';
  rationale?: string;
};

export type RecommendationPreference = 'yes' | 'no';

export type RealTimeDecision = {
  realtime: RecommendationPreference;
  reason?: string;
  question_type?: string;
  recommendations?: RecommendationPreference;
};

export type StockDetectionPattern = {
  regex: RegExp;
  requiresContext?: boolean;
};

