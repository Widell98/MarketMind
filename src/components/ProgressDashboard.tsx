import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Calendar, TrendingUp, Star, Flame } from 'lucide-react';
import { useProgressTracking } from '@/hooks/useProgressTracking';

const ProgressDashboard = () => {
  const { progress, loading } = useProgressTracking();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionRate = progress.totalQuizzes > 0 ? (progress.completedQuizzes / progress.totalQuizzes) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Your Progress
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Completion Rate */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(completionRate)}%
                </span>
                <Badge variant="secondary">
                  {progress.completedQuizzes}/{progress.totalQuizzes}
                </Badge>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-800 dark:text-green-200 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {progress.averageScore}%
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Across all quizzes
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-orange-800 dark:text-orange-200 flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {progress.streak}
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Days in a row
            </p>
          </CardContent>
        </Card>

        {/* Last Activity */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-800 dark:text-purple-200 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Last Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
              {progress.lastActivity 
                ? new Date(progress.lastActivity).toLocaleDateString() 
                : 'No activity yet'
              }
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Keep the streak going!
            </p>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950 dark:to-slate-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {progress.averageScore >= 80 ? '📈' : progress.averageScore >= 60 ? '📊' : '📉'}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {progress.averageScore >= 80 ? 'Excellent' : progress.averageScore >= 60 ? 'Good' : 'Improving'}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Keep learning!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressDashboard;
