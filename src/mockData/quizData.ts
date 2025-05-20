
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
  category: 'macro' | 'stocks' | 'technical' | 'historical' | 'concept';
  relatedSymbols?: string[];
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
    relatedSymbols: ['GLD', 'IAU']
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
  { id: 'tech_titan', name: 'Tech Titan', description: 'Answered 10 tech questions correctly', icon: '💻' }
];
