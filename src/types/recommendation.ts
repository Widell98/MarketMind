export interface Recommendation {
  title: string;
  description: string;
  tags?: string[];
  author?: string;
  isAI: boolean;
}

export default Recommendation;
