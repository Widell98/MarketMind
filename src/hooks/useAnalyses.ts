
// Re-export all analysis hooks for backwards compatibility
export { useAnalysesList as useAnalyses } from './useAnalysesList';
export { useAnalysisDetail as useAnalysis } from './useAnalysisDetail';
export { 
  useCreateAnalysis, 
  useCreateSharedPortfolioAnalysis, 
  useToggleAnalysisLike 
} from './useAnalysisMutations';
export type { Analysis } from '@/types/analysis';
