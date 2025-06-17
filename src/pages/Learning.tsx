
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import MemoryCheck from '@/components/MemoryCheck';
import ProgressDashboard from '@/components/ProgressDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Play, TrendingUp, Shield, Target, BarChart3 } from 'lucide-react';
import { useProgressTracking } from '@/hooks/useProgressTracking';

const Learning = () => {
  const { refetch } = useProgressTracking();
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const handleQuizComplete = () => {
    // Quiz completion logic - reload progress data immediately
    console.log('Quiz completed!');
    refetch(); // This will update the progress dashboard immediately
  };

  const learningModules = [
    {
      id: 'stock-basics',
      title: 'Stock Basics',
      description: 'Learn fundamental concepts',
      icon: TrendingUp,
      content: {
        overview: 'Master the fundamentals of stock market investing with our comprehensive Stock Basics module.',
        topics: [
          'What are stocks and how they work',
          'Understanding stock prices and market capitalization',
          'Different types of stocks (common vs preferred)',
          'How to read stock quotes and charts',
          'Basic valuation metrics (P/E ratio, EPS, etc.)'
        ],
        duration: '45 minutes',
        difficulty: 'Beginner'
      }
    },
    {
      id: 'risk-management',
      title: 'Risk Management',
      description: 'Understand investment risks',
      icon: Shield,
      content: {
        overview: 'Learn essential risk management strategies to protect and grow your investment portfolio.',
        topics: [
          'Types of investment risks (market, credit, inflation)',
          'Risk tolerance assessment',
          'Position sizing and stop-loss strategies',
          'Correlation and diversification principles',
          'Risk-reward ratio calculations'
        ],
        duration: '35 minutes',
        difficulty: 'Intermediate'
      }
    },
    {
      id: 'portfolio-strategy',
      title: 'Portfolio Strategy',
      description: 'Build balanced portfolios',
      icon: Target,
      content: {
        overview: 'Develop effective portfolio construction and management strategies for long-term success.',
        topics: [
          'Asset allocation principles',
          'Modern Portfolio Theory basics',
          'Rebalancing strategies',
          'Dollar-cost averaging',
          'Tax-efficient investing'
        ],
        duration: '50 minutes',
        difficulty: 'Intermediate'
      }
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      description: 'Technical and fundamental analysis',
      icon: BarChart3,
      content: {
        overview: 'Learn both technical and fundamental analysis techniques to make informed investment decisions.',
        topics: [
          'Fundamental analysis: financial statements',
          'Technical analysis: charts and indicators',
          'Market trends and cycles',
          'Economic indicators and their impact',
          'Sector and industry analysis'
        ],
        duration: '60 minutes',
        difficulty: 'Advanced'
      }
    }
  ];

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        {/* Header Section - Mobile optimized */}
        <div className="text-center space-y-3 px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Learning Center
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Test your knowledge with daily quizzes and improve your financial literacy
          </p>
        </div>

        {/* Progress Dashboard - Full width on mobile */}
        <div className="px-2 md:px-0">
          <ProgressDashboard />
        </div>

        {/* Main Content - Centered layout */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quiz Introduction Card - Mobile optimized */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg md:text-xl text-blue-900 dark:text-blue-100">
                    Daily Knowledge Check
                  </CardTitle>
                  <p className="text-sm md:text-base text-blue-700 dark:text-blue-300 mt-1">
                    Improve your financial literacy with personalized questions
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Memory Check Component - Mobile optimized */}
          <div className="px-2 md:px-0">
            <MemoryCheck onComplete={handleQuizComplete} difficulty="novice" />
          </div>

          {/* Learning Modules - Mobile-first grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Play className="w-5 h-5" />
                Learning Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {learningModules.map((module) => (
                  <Dialog key={module.id} open={openDialog === module.id} onOpenChange={(open) => setOpenDialog(open ? module.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-auto p-4 justify-start text-left">
                        <div className="flex items-start gap-3 flex-1">
                          <module.icon className="w-5 h-5 mt-1 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-sm md:text-base">{module.title}</div>
                            <div className="text-xs md:text-sm text-muted-foreground mt-1">
                              {module.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <module.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          {module.title}
                        </DialogTitle>
                        <DialogDescription>
                          {module.content.overview}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">What you'll learn:</h4>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {module.content.topics.map((topic, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <div>
                            <span className="font-medium">Duration:</span> {module.content.duration}
                          </div>
                          <div>
                            <span className="font-medium">Level:</span> {module.content.difficulty}
                          </div>
                        </div>
                        
                        <Button className="w-full" disabled>
                          Coming Soon
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Learning;
