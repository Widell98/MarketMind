
import React from 'react';
import Layout from '@/components/Layout';
import MemoryCheck from '@/components/MemoryCheck';
import MarketPulse from '@/components/MarketPulse';
import TrendingCases from '@/components/TrendingCases';
import ProgressDashboard from '@/components/ProgressDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Target, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Learning = () => {
  const navigate = useNavigate();

  const handleQuizComplete = () => {
    // Quiz completion logic - could show results or reload new questions
    console.log('Quiz completed!');
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Learning Center
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Test your knowledge with daily quizzes and discover top-performing stocks
          </p>
        </div>

        {/* Progress Dashboard */}
        <ProgressDashboard />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quiz Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Introduction Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">Daily Knowledge Check</CardTitle>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Improve your financial literacy with personalized questions
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Memory Check Component */}
            <MemoryCheck onComplete={handleQuizComplete} difficulty="novice" />

            {/* Learning Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Learning Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <div className="font-medium">Stock Basics</div>
                      <div className="text-sm text-muted-foreground">Learn fundamental concepts</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <div className="font-medium">Risk Management</div>
                      <div className="text-sm text-muted-foreground">Understand investment risks</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <div className="font-medium">Portfolio Strategy</div>
                      <div className="text-sm text-muted-foreground">Build balanced portfolios</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <div className="font-medium">Market Analysis</div>
                      <div className="text-sm text-muted-foreground">Technical and fundamental analysis</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Market Performance */}
          <div className="space-y-6">
            <TrendingCases />
            <MarketPulse />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Learning;
