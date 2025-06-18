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
    question: "What typically happens to stock prices when central banks lower interest rates?",
    context: "Central banks use interest rate policy as a tool to influence economic activity and market conditions.",
    options: [
      "Stock prices typically rise",
      "Stock prices typically fall",
      "Interest rates have no effect on stock prices",
      "Only tech stocks are affected"
    ],
    correctAnswer: 0,
    explanation: "Lower interest rates reduce borrowing costs for companies and make bonds less attractive, typically leading investors to move money into stocks, driving prices higher.",
    difficulty: 'novice',
    category: 'macro',
    relatedSymbols: ['SPY', 'DIA', 'QQQ'],
    learningModule: {
      title: "Understanding Interest Rates and Markets",
      content: "Interest rates are one of the most important factors affecting stock markets. When rates are low, companies can borrow money more cheaply to grow their business, and investors seek higher returns in stocks rather than bonds.",
      resources: [
        {
          title: "How Interest Rates Affect Stock Markets",
          url: "https://example.com/interest-rates",
          type: "article"
        }
      ]
    }
  },
  {
    id: '2',
    day: 'Tuesday',
    theme: 'Tech Tuesday',
    question: "What is a key advantage of investing in technology ETFs compared to individual tech stocks?",
    context: "Technology sector investing can be approached through individual stocks or diversified funds.",
    options: [
      "Higher potential returns",
      "Reduced risk through diversification",
      "Lower fees",
      "Better tax treatment"
    ],
    correctAnswer: 1,
    explanation: "Technology ETFs spread investment across multiple tech companies, reducing the risk of any single company significantly impacting your investment.",
    difficulty: 'analyst',
    category: 'stocks',
    relatedSymbols: ['QQQ', 'XLK', 'VGT'],
    learningModule: {
      title: "ETF vs Individual Stock Investing",
      content: "Exchange-Traded Funds (ETFs) offer instant diversification by holding many stocks in a single fund. This reduces company-specific risk while still providing exposure to sector growth.",
      resources: [
        {
          title: "Guide to Technology ETFs",
          url: "https://example.com/tech-etfs",
          type: "article"
        }
      ]
    }
  },
  {
    id: '3',
    day: 'Wednesday',
    theme: 'Wildcard Wednesday',
    question: "What is the primary factor that drives long-term commodity prices?",
    context: "Commodity markets are influenced by various economic and physical factors.",
    options: [
      "Government regulations",
      "Supply and demand fundamentals",
      "Currency exchange rates",
      "Stock market performance"
    ],
    correctAnswer: 1,
    explanation: "Like all markets, commodity prices are fundamentally driven by the balance between supply (production) and demand (consumption) over time.",
    difficulty: 'analyst',
    category: 'commodities',
    relatedSymbols: ['GLD', 'USO', 'DBC'],
    learningModule: {
      title: "Understanding Commodity Markets",
      content: "Commodity prices fluctuate based on supply and demand dynamics. Factors like weather, geopolitical events, and economic growth affect both the supply of and demand for raw materials.",
      resources: [
        {
          title: "Commodity Market Fundamentals",
          url: "https://example.com/commodities",
          type: "article"
        }
      ]
    }
  },
  {
    id: '4',
    day: 'Thursday',
    theme: 'Throwback Thursday',
    question: "What lesson did the 2008 financial crisis teach investors about diversification?",
    context: "The 2008 financial crisis revealed important lessons about portfolio construction and risk management.",
    options: [
      "Diversification doesn't work during market crashes",
      "Geographic diversification is more important than asset diversification",  
      "Correlations between assets can increase during crisis periods",
      "Only cash investments are truly safe"
    ],
    correctAnswer: 2,
    explanation: "During the 2008 crisis, many asset classes that normally moved independently began moving together, showing that correlations can spike during market stress.",
    difficulty: 'pro',
    category: 'historical',
    relatedSymbols: ['VTI', 'VXUS', 'BND'],
    learningModule: {
      title: "Crisis Lessons for Portfolio Construction",
      content: "The 2008 financial crisis taught investors that during extreme market stress, correlations between different assets can increase dramatically, reducing the effectiveness of traditional diversification strategies.",
      resources: [
        {
          title: "Lessons from the 2008 Financial Crisis",
          url: "https://example.com/2008-lessons",
          type: "article"
        }
      ]
    }
  },
  {
    id: '5',
    day: 'Friday',
    theme: 'Fundamental Friday',
    question: "What does a high P/E ratio generally indicate about a company?",
    context: "The Price-to-Earnings ratio is a fundamental metric used to evaluate stock valuations.",
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
      content: "The Price-to-Earnings (P/E) ratio compares a company's share price to its earnings per share. A high P/E suggests investors expect higher growth in the future, while a low P/E may indicate undervaluation or concerns about future performance.",
      resources: [
        {
          title: "P/E Ratio Analysis Guide",
          url: "https://example.com/pe-guide",
          type: "article"
        }
      ]
    }
  },
  {
    id: '6',
    day: 'Monday',
    theme: 'Macro Monday',
    question: "What is inflation's typical effect on stock investments over the long term?",
    context: "Inflation is a persistent increase in the general price level of goods and services.",
    options: [
      "Stocks generally provide protection against moderate inflation",
      "Inflation always destroys stock returns",
      "Only commodity stocks benefit from inflation",
      "Inflation has no effect on stock prices"
    ],
    correctAnswer: 0,
    explanation: "Over time, stocks have historically provided better protection against inflation than bonds or cash, as companies can often raise prices and grow earnings with inflation.",
    difficulty: 'analyst',
    category: 'macro',
    relatedSymbols: ['SPY', 'VTI', 'TIPS'],
    learningModule: {
      title: "Stocks and Inflation Protection",
      content: "While inflation can hurt stocks in the short term, over longer periods, stocks have historically outpaced inflation as companies can adjust their prices and grow their earnings along with rising price levels.",
      resources: [
        {
          title: "Inflation and Investment Returns",
          url: "https://example.com/inflation-stocks",
          type: "article"
        }
      ]
    }
  },
  {
    id: '7',
    day: 'Tuesday',
    theme: 'Tech Tuesday',
    question: "What is a key risk when investing in individual technology stocks?",
    context: "Technology companies can offer high growth potential but also come with specific risks.",
    options: [
      "Technology companies never pay dividends",
      "High volatility and rapid business model changes",
      "Technology stocks are not affected by economic cycles",
      "Government regulation is minimal in tech"
    ],
    correctAnswer: 1,
    explanation: "Technology stocks often experience high volatility due to rapid innovation cycles, changing consumer preferences, and the potential for business models to become obsolete quickly.",
    difficulty: 'pro',
    category: 'stocks',
    relatedSymbols: ['AAPL', 'GOOGL', 'MSFT'],
    learningModule: {
      title: "Technology Stock Investment Risks",
      content: "While technology stocks can provide substantial returns, they also carry unique risks including rapid technological change, high valuations, regulatory challenges, and intense competition that can quickly change market dynamics.",
      resources: [
        {
          title: "Understanding Tech Stock Volatility",
          url: "https://example.com/tech-volatility",
          type: "article"
        }
      ]
    }
  },
  {
    id: '8',
    day: 'Wednesday',
    theme: 'Wildcard Wednesday',
    question: "What is dollar-cost averaging?",
    context: "Dollar-cost averaging is a popular investment strategy for building long-term wealth.",
    options: [
      "Buying stocks only when prices are low",
      "Investing a fixed amount regularly regardless of market conditions",
      "Converting foreign investments to dollars",
      "Averaging down on losing positions"
    ],
    correctAnswer: 1,
    explanation: "Dollar-cost averaging involves investing a fixed amount at regular intervals, which helps reduce the impact of market volatility by buying more shares when prices are low and fewer when prices are high.",
    difficulty: 'novice',
    category: 'concept',
    learningModule: {
      title: "Dollar-Cost Averaging Strategy",
      content: "Dollar-cost averaging is an investment technique where you invest a fixed amount of money at regular intervals regardless of market conditions. This strategy can help reduce the impact of volatility and remove emotion from investment decisions.",
      resources: [
        {
          title: "Dollar-Cost Averaging Explained",
          url: "https://example.com/dca-guide",
          type: "article"
        }
      ]
    }
  },
  {
    id: '9',
    day: 'Thursday',
    theme: 'Throwback Thursday',
    question: "What was a key characteristic of the dot-com bubble of the late 1990s?",
    context: "The dot-com bubble was a significant market event that offers lessons for modern investors.",
    options: [
      "Technology companies had very low valuations",
      "Investors focused heavily on company profits",
      "Many internet companies were valued highly despite having no profits",
      "Traditional industries outperformed technology stocks"
    ],
    correctAnswer: 2,
    explanation: "During the dot-com bubble, many internet companies achieved extremely high valuations based on growth potential and website traffic rather than actual profits or sustainable business models.",
    difficulty: 'analyst',
    category: 'historical',
    relatedSymbols: ['QQQ', 'XLK'],
    learningModule: {
      title: "Lessons from the Dot-Com Bubble",
      content: "The dot-com bubble of the late 1990s demonstrated the dangers of speculative investing and the importance of fundamental analysis. Many companies with no profits commanded huge valuations based solely on potential.",
      resources: [
        {
          title: "The Rise and Fall of the Dot-Com Bubble",
          url: "https://example.com/dotcom-bubble",
          type: "article"
        }
      ]
    }
  },
  {
    id: '10',
    day: 'Friday',
    theme: 'Fundamental Friday',
    question: "What does a company's debt-to-equity ratio measure?",
    context: "Financial ratios help investors assess a company's financial health and risk profile.",
    options: [
      "How much profit the company makes relative to its size",
      "The company's financial leverage and risk level",
      "How quickly the company can pay its short-term bills",
      "The company's stock price performance"
    ],
    correctAnswer: 1,
    explanation: "The debt-to-equity ratio measures how much debt a company has relative to shareholder equity, indicating the level of financial leverage and associated risk.",
    difficulty: 'analyst',
    category: 'concept',
    learningModule: {
      title: "Understanding Financial Ratios",
      content: "The debt-to-equity ratio is calculated by dividing total debt by total equity. A higher ratio indicates more leverage and potentially higher financial risk, while a lower ratio suggests a more conservative capital structure.",
      resources: [
        {
          title: "Financial Ratio Analysis Guide",
          url: "https://example.com/financial-ratios",
          type: "article"
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

// Update fallback questions in useQuizAPI to also be timeless
export const getTimelessFallbackQuestions = (userLevel: string, category?: string) => {
  return [
    {
      id: 'fall back_1',
      theme: 'Investment Basics',
      question: 'What is the primary benefit of diversifying your investment portfolio?',
      context: 'Diversification is a fundamental principle of risk management in investing.',
      options: [
        'To maximize returns in bull markets',
        'To reduce overall portfolio risk',
        'To minimize trading costs',
        'To focus on the best performing assets'
      ],
      correctAnswer: 1,
      explanation: 'Diversification helps reduce risk by spreading investments across different assets, sectors, or geographic regions, so that poor performance in one area doesn\'t severely impact the entire portfolio.',
      difficulty: userLevel as 'novice' | 'analyst' | 'pro',
      category: (category as any) || 'concept',
      isGenerated: true
    },
    {
      id: 'fallback_2',
      theme: 'Risk Management',
      question: 'What is compound interest?',
      context: 'Understanding compound interest is crucial for long-term wealth building.',
      options: [
        'Interest paid only on the initial investment',
        'Interest earned on both the initial investment and previously earned interest',
        'A type of bank fee',
        'Interest that decreases over time'
      ],
      correctAnswer: 1,
      explanation: 'Compound interest is the interest earned on both the original principal and the accumulated interest from previous periods, leading to exponential growth over time.',
      difficulty: userLevel as 'novice' | 'analyst' | 'pro',
      category: (category as any) || 'concept',
      isGenerated: true
    }
  ];
};
