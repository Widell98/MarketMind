
export interface QuizQuestion {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  theme: string;
  question: string;
  context: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'novice' | 'analyst' | 'pro';
  category: 'macro' | 'stocks' | 'technical' | 'historical' | 'concept' | 'commodities';
  relatedSymbols?: string[];
  learningModule?: {
    title: string;
    content: string;
    videoUrl?: string;
  };
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: '1',
    day: 'Monday',
    theme: 'Macro Monday',
    question: "How did the S&P 500 react to yesterday's Fed announcement?",
    context: "The Federal Reserve announced they're keeping rates steady but signaled potential cuts later this year.",
    options: [
      "Rose by over 1%",
      "Fell slightly by 0.2-0.5%",
      "Remained relatively unchanged",
      "Dropped sharply by over 1.5%"
    ],
    correctAnswer: 0,
    explanation: "Markets typically react positively to signals of potential rate cuts, as lower borrowing costs can boost corporate profits and economic activity.",
    difficulty: 'novice',
    category: 'macro',
    relatedSymbols: ['SPY', 'DIA', 'QQQ']
  },
  {
    id: '2',
    day: 'Tuesday',
    theme: 'Tech Tuesday',
    question: "What happened to Nvidia's stock after their AI chip announcement yesterday?",
    context: "Nvidia unveiled their next-generation AI chips with 50% better performance than the previous generation.",
    options: [
      "Dropped by 2% on sell-the-news reaction",
      "Rose by over 3% on strong demand forecast",
      "Remained flat as the announcement was already priced in",
      "Initially jumped but ended the day lower on profit-taking"
    ],
    correctAnswer: 1,
    explanation: "Strong product announcements with improved performance metrics typically boost investor confidence in tech companies, especially when paired with positive demand outlooks.",
    difficulty: 'analyst',
    category: 'stocks',
    relatedSymbols: ['NVDA', 'SMH']
  },
  {
    id: '3',
    day: 'Wednesday',
    theme: 'Wildcard Wednesday',
    question: "How did crude oil prices respond to yesterday's unexpected inventory report?",
    context: "The EIA report showed a surprising decline in U.S. crude inventories despite analysts expecting an increase.",
    options: [
      "Jumped over 2% on supply concerns",
      "Fell due to concerns about demand",
      "Remained flat as traders awaited OPEC's response",
      "Initially rose but gave up gains after the dollar strengthened"
    ],
    correctAnswer: 0,
    explanation: "Oil markets typically respond positively to unexpected inventory draws as they indicate stronger demand or lower supply than anticipated, both of which can lead to higher prices.",
    difficulty: 'analyst',
    category: 'commodities',
    relatedSymbols: ['CL=F', 'USO', 'XLE']
  },
  {
    id: '4',
    day: 'Thursday',
    theme: 'Throwback Thursday',
    question: "During the 2008 financial crisis, what happened to gold prices?",
    context: "The global financial system was under extreme stress with major banks failing.",
    options: [
      "Crashed along with stocks",
      "Remained stable throughout the crisis",
      "Initially fell but then rose significantly",
      "Immediately shot up as a safe haven"
    ],
    correctAnswer: 2,
    explanation: "During the initial panic of the 2008 crisis, gold actually fell as investors sold assets for cash, but it later rose significantly as a safe haven when confidence in the financial system deteriorated further.",
    difficulty: 'pro',
    category: 'historical',
    relatedSymbols: ['GLD', 'IAU'],
    learningModule: {
      title: "Safe Haven Assets During Market Crashes",
      content: "During market crashes, traditional safe haven assets like gold often exhibit complex behavior. In the initial phase of a crisis, gold may fall as investors liquidate positions for cash. However, as fear intensifies and confidence in the financial system wanes, gold typically attracts significant investment, driving prices higher.",
      videoUrl: "https://example.com/safehaven-video"
    }
  },
  {
    id: '5',
    day: 'Friday',
    theme: 'Fundamental Friday',
    question: "What does a high P/E ratio generally indicate about a company?",
    context: "You're analyzing a tech stock with a P/E ratio of 45 compared to the sector average of 22.",
    options: [
      "The company is undervalued",
      "Investors expect high future growth",
      "The company has strong current profitability",
      "The stock has low volatility"
    ],
    correctAnswer: 1,
    explanation: "A high P/E ratio typically indicates that investors expect significant future earnings growth, justifying the premium they're paying relative to current earnings.",
    difficulty: 'novice',
    category: 'concept',
    learningModule: {
      title: "Understanding P/E Ratios",
      content: "The Price-to-Earnings (P/E) ratio compares a company's share price to its earnings per share. A high P/E suggests investors expect higher growth in the future, while a low P/E may indicate undervaluation or concerns about future performance. Industry context is crucial - technology companies often have higher P/E ratios than more mature industries."
    }
  }
];

export const userLevels = [
  { id: 'novice', name: 'Novice', requiredPoints: 0 },
  { id: 'beginner', name: 'Beginner', requiredPoints: 100 },
  { id: 'intermediate', name: 'Intermediate', requiredPoints: 300 },
  { id: 'analyst', name: 'Analyst', requiredPoints: 750 },
  { id: 'expert', name: 'Expert', requiredPoints: 1500 },
  { id: 'pro', name: 'Pro', requiredPoints: 3000 }
];

export const badges = [
  { id: 'first_quiz', name: 'First Steps', description: 'Completed your first quiz', icon: '🎯' },
  { id: 'streak_3', name: 'On Fire', description: 'Achieved a 3-day streak', icon: '🔥' },
  { id: 'streak_7', name: 'Weekly Warrior', description: 'Achieved a 7-day streak', icon: '🏆' },
  { id: 'perfect_score', name: 'Perfect Eye', description: 'Got a perfect score on a quiz', icon: '👁️' },
  { id: 'macro_master', name: 'Macro Master', description: 'Answered 10 macro questions correctly', icon: '🌍' },
  { id: 'tech_titan', name: 'Tech Titan', description: 'Answered 10 tech questions correctly', icon: '💻' },
  { id: 'wildcard_wizard', name: 'Wildcard Wizard', description: 'Answered 10 wildcard questions correctly', icon: '🃏' },
  { id: 'history_buff', name: 'History Buff', description: 'Answered 10 historical questions correctly', icon: '📜' },
  { id: 'fundamental_fanatic', name: 'Fundamental Fanatic', description: 'Answered 10 fundamental questions correctly', icon: '📊' },
  { id: 'learning_streak', name: 'Knowledge Seeker', description: 'Viewed 5 learning modules', icon: '🧠' }
];

export interface UserProgress {
  level: string;
  points: number;
  streakDays: number;
  lastQuizDate?: string;
  correctByCategory: {
    [key: string]: number;
  };
  badges: string[];
  completedQuizzes: string[];
}

export const defaultUserProgress: UserProgress = {
  level: 'novice',
  points: 0,
  streakDays: 0,
  correctByCategory: {
    macro: 0,
    stocks: 0,
    technical: 0,
    historical: 0,
    concept: 0
  },
  badges: [],
  completedQuizzes: []
};
