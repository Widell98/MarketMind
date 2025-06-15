
import React from 'react';
import Layout from '@/components/Layout';
import MemoryCheck from '@/components/MemoryCheck';
import MarketPulse from '@/components/MarketPulse';
import TrendingCases from '@/components/TrendingCases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, TrendingUp, Target } from 'lucide-react';
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
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homepage
          </Button>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Learning Center
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Test your knowledge with daily quizzes and discover top-performing stocks
            </p>
          </div>
        </div>

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

            {/* Learning Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">85%</div>
                      <p className="text-green-700 dark:text-green-300">Quiz Accuracy</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">12</div>
                      <p className="text-purple-700 dark:text-purple-300">Day Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
