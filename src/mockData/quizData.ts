
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
    resources?: {
      title: string;
      url: string;
      type: 'article' | 'video' | 'podcast' | 'chart';
    }[];
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
    relatedSymbols: ['SPY', 'DIA', 'QQQ'],
    learningModule: {
      title: "Understanding Central Bank Impacts",
      content: "Central banks like the Federal Reserve influence markets through monetary policy decisions. When the Fed signals potential rate cuts, it typically creates a positive market reaction as investors anticipate cheaper borrowing costs for businesses and consumers, potentially boosting economic activity and corporate profits.",
      resources: [
        {
          title: "How Fed Rate Decisions Impact Stocks",
          url: "https://example.com/fed-impacts",
          type: "article"
        },
        {
          title: "Chart: S&P 500 Reaction to Fed Announcements",
          url: "https://example.com/fed-chart",
          type: "chart"
        }
      ]
    }
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
    relatedSymbols: ['NVDA', 'SMH'],
    learningModule: {
      title: "Tech Product Cycles and Stock Performance",
      content: "Technology companies often experience stock price movements around product announcements. When companies like Nvidia reveal significant improvements in their products along with strong demand forecasts, investors typically respond positively as this signals potential revenue and profit growth.",
      resources: [
        {
          title: "Tech Product Cycle Investing",
          url: "https://example.com/tech-cycles",
          type: "article"
        },
        {
          title: "Semiconductor Industry Deep Dive",
          url: "https://example.com/semiconductor-podcast",
          type: "podcast"
        }
      ]
    }
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
    relatedSymbols: ['CL=F', 'USO', 'XLE'],
    learningModule: {
      title: "Understanding Crude Oil Price Drivers",
      content: "Crude oil prices are highly sensitive to inventory reports as they provide insights into supply and demand dynamics. Unexpected inventory declines typically signal either stronger demand or lower supply than forecasted, which can lead to higher oil prices as traders adjust their market view.",
      resources: [
        {
          title: "How to Read EIA Oil Inventory Reports",
          url: "https://example.com/eia-guide",
          type: "article"
        },
        {
          title: "Oil Market Technical Analysis",
          url: "https://example.com/oil-video",
          type: "video"
        }
      ]
    }
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
      videoUrl: "https://example.com/safehaven-video",
      resources: [
        {
          title: "Gold Performance in Historical Crises",
          url: "https://example.com/gold-history",
          type: "chart"
        },
        {
          title: "Understanding Safe Haven Asset Dynamics",
          url: "https://example.com/safe-haven-podcast",
          type: "podcast"
        }
      ]
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
      content: "The Price-to-Earnings (P/E) ratio compares a company's share price to its earnings per share. A high P/E suggests investors expect higher growth in the future, while a low P/E may indicate undervaluation or concerns about future performance. Industry context is crucial - technology companies often have higher P/E ratios than more mature industries.",
      resources: [
        {
          title: "P/E Ratio Analysis Fundamentals",
          url: "https://example.com/pe-guide",
          type: "article"
        },
        {
          title: "Historical P/E Ranges by Sector",
          url: "https://example.com/pe-sectors",
          type: "chart"
        }
      ]
    }
  },
  {
    id: '6',
    day: 'Monday',
    theme: 'Macro Monday',
    question: "How did the European markets react to yesterday's ECB interest rate decision?",
    context: "The European Central Bank raised interest rates by 25 basis points, which was higher than the expected 10 basis points.",
    options: [
      "European indices rose as investors saw the move as confidence in economic strength",
      "Markets fell sharply as higher rates threatened to slow economic growth",
      "European bank stocks rose while tech stocks declined",
      "Markets were relatively flat as the decision was largely priced in"
    ],
    correctAnswer: 1,
    explanation: "When central banks raise rates more aggressively than expected, markets often react negatively as higher borrowing costs can slow economic activity and reduce corporate profits.",
    difficulty: 'analyst',
    category: 'macro',
    relatedSymbols: ['FEZ', 'EZU', 'EUFN'],
    learningModule: {
      title: "Interest Rate Surprises and Market Reactions",
      content: "When central banks like the ECB make unexpected interest rate decisions, markets often experience significant volatility. Higher-than-expected rate increases typically cause negative market reactions as they suggest tighter monetary conditions, potentially slowing economic growth and reducing corporate profitability.",
      resources: [
        {
          title: "ECB Rate History and Market Effects",
          url: "https://example.com/ecb-rates",
          type: "chart"
        },
        {
          title: "European Banking Sector Analysis",
          url: "https://example.com/eubanks-video",
          type: "video"
        }
      ]
    }
  },
  {
    id: '7',
    day: 'Tuesday',
    theme: 'Tech Tuesday',
    question: "What happened to Apple's stock price after their latest earnings report exceeded analyst expectations by 15%?",
    context: "Apple reported quarterly earnings that beat Wall Street forecasts significantly, with especially strong iPhone sales in emerging markets.",
    options: [
      "Jumped 8% to a new all-time high",
      "Rose moderately by 2-3%",
      "Surprisingly declined despite the good news",
      "Initially jumped but closed flat due to cautious forward guidance"
    ],
    correctAnswer: 3,
    explanation: "Strong earnings often boost a stock initially, but cautious guidance about future quarters can temper or reverse gains, as investors focus more on future prospects than past performance.",
    difficulty: 'pro',
    category: 'stocks',
    relatedSymbols: ['AAPL', 'QQQ', 'XLK'],
    learningModule: {
      title: "Earnings Reports vs. Forward Guidance",
      content: "While beating earnings expectations is generally positive for stock prices, forward guidance often carries more weight with investors. Companies that report strong results but issue cautious outlooks may see limited stock price gains or even declines, as the market is primarily focused on future performance rather than past results.",
      resources: [
        {
          title: "How to Analyze Earnings Reports",
          url: "https://example.com/earnings-analysis",
          type: "article"
        },
        {
          title: "Tech Sector Earnings Patterns",
          url: "https://example.com/tech-earnings-podcast",
          type: "podcast"
        }
      ]
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
  { id: 'learning_streak', name: 'Knowledge Seeker', description: 'Viewed 5 learning modules', icon: '🧠' },
  { id: 'commodities_expert', name: 'Commodities Expert', description: 'Answered 8 commodities questions correctly', icon: '🛢️' },
  { id: 'golden_analyst', name: 'Golden Analyst', description: 'Achieved analyst level in 3 different categories', icon: '🏅' }
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
  viewedLearningModules?: string[];
  quizAccuracy?: number; // Percentage of correct answers
  totalQuizzesTaken?: number;
  longestStreak?: number;
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
    concept: 0,
    commodities: 0
  },
  badges: [],
  completedQuizzes: [],
  viewedLearningModules: [],
  quizAccuracy: 0,
  totalQuizzesTaken: 0,
  longestStreak: 0
};

// Adaptive difficulty system - determines what questions to show next based on user performance
export const getAdaptiveQuestions = (userProgress: UserProgress, availableQuestions: QuizQuestion[]): QuizQuestion[] => {
  // If user has very little history, provide a balanced mix
  if (userProgress.totalQuizzesTaken && userProgress.totalQuizzesTaken < 5) {
    return availableQuestions;
  }

  // Find categories where user is weakest
  const categories = Object.keys(userProgress.correctByCategory) as Array<keyof typeof userProgress.correctByCategory>;
  
  // Sort categories by success rate (ascending)
  categories.sort((a, b) => {
    const aCorrect = userProgress.correctByCategory[a] || 0;
    const bCorrect = userProgress.correctByCategory[b] || 0;
    return aCorrect - bCorrect;
  });

  // Prioritize questions from the 2 weakest categories
  const priorityCategories = categories.slice(0, 2);
  
  // Filter questions to include more from weak categories
  const priorityQuestions = availableQuestions.filter(q => 
    priorityCategories.includes(q.category as any)
  );

  // If we found priority questions, ensure they make up at least 60% of questions
  if (priorityQuestions.length > 0) {
    const otherQuestions = availableQuestions.filter(q => 
      !priorityCategories.includes(q.category as any)
    );
    
    // Return 60% priority questions, 40% other questions
    const priorityCount = Math.ceil(availableQuestions.length * 0.6);
    const otherCount = availableQuestions.length - priorityCount;
    
    return [
      ...priorityQuestions.slice(0, priorityCount),
      ...otherQuestions.slice(0, otherCount)
    ];
  }
  
  // Fallback to all available questions
  return availableQuestions;
};

// Learning path recommendations based on user level and interests
export const getLearningPathRecommendations = (userProgress: UserProgress): string[] => {
  const level = userProgress.level;
  const recommendations: string[] = [];
  
  // Basic recommendations by level
  if (level === 'novice') {
    recommendations.push(
      "Introduction to Market Analysis",
      "Understanding Stock Fundamentals",
      "How to Read Financial News"
    );
  } else if (level === 'beginner' || level === 'intermediate') {
    recommendations.push(
      "Technical Analysis Foundations",
      "Understanding Market Sectors",
      "Introduction to Economic Indicators"
    );
  } else {
    recommendations.push(
      "Advanced Chart Patterns",
      "Options Trading Strategies",
      "Macroeconomic Analysis Techniques"
    );
  }
  
  // Add recommendations based on weakest categories
  const categories = Object.keys(userProgress.correctByCategory) as Array<keyof typeof userProgress.correctByCategory>;
  
  // Find weakest category
  const weakestCategory = categories.reduce((a, b) => 
    (userProgress.correctByCategory[a] || 0) <= (userProgress.correctByCategory[b] || 0) ? a : b
  );
  
  // Add specific recommendations based on weakest category
  switch(weakestCategory) {
    case 'macro':
      recommendations.push("Central Bank Policy Impact Analysis");
      break;
    case 'stocks':
      recommendations.push("Fundamental Stock Analysis Techniques");
      break;
    case 'technical':
      recommendations.push("Advanced Technical Indicators");
      break;
    case 'historical':
      recommendations.push("Historical Market Crash Analysis");
      break;
    case 'concept':
      recommendations.push("Key Financial Concepts Explained");
      break;
    case 'commodities':
      recommendations.push("Commodity Market Fundamentals");
      break;
  }
  
  return recommendations;
};
