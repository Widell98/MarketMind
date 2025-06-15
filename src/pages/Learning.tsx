
import React from 'react';
import Layout from '@/components/Layout';
import MemoryCheck from '@/components/MemoryCheck';
import ProgressDashboard from '@/components/ProgressDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Play } from 'lucide-react';

const Learning = () => {
  const handleQuizComplete = () => {
    // Quiz completion logic - could show results or reload new questions
    console.log('Quiz completed!');
  };

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
                <Button variant="outline" className="h-auto p-4 justify-start text-left">
                  <div className="flex-1">
                    <div className="font-medium text-sm md:text-base">Stock Basics</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                      Learn fundamental concepts
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 justify-start text-left">
                  <div className="flex-1">
                    <div className="font-medium text-sm md:text-base">Risk Management</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                      Understand investment risks
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 justify-start text-left">
                  <div className="flex-1">
                    <div className="font-medium text-sm md:text-base">Portfolio Strategy</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                      Build balanced portfolios
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 justify-start text-left">
                  <div className="flex-1">
                    <div className="font-medium text-sm md:text-base">Market Analysis</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                      Technical and fundamental analysis
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Learning;
