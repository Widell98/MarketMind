
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DAILY_QUIZ_QUESTIONS } from '@/utils/quizUtils';

interface QuizCompletionCardProps {
  isCompleted: boolean;
  dailyQuizCompleted: boolean;
  correctAnswers: number;
  earnedBadge: any;
  onComplete: () => void;
}

const QuizCompletionCard: React.FC<QuizCompletionCardProps> = ({
  isCompleted,
  dailyQuizCompleted,
  correctAnswers,
  earnedBadge,
  onComplete
}) => {
  if (dailyQuizCompleted && !isCompleted) {
    return (
      <div className="card-finance p-5 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2 dark:text-white">Daily Quiz Completed!</h3>
        <p className="text-sm mb-4 dark:text-gray-300">
          You've completed today's {DAILY_QUIZ_QUESTIONS} quiz questions. Come back tomorrow for more!
        </p>
        <div className="text-2xl mb-3">🎯</div>
        <Badge className="bg-green-500 text-white" variant="secondary">
          {DAILY_QUIZ_QUESTIONS}/{DAILY_QUIZ_QUESTIONS} Daily Questions Complete
        </Badge>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="card-finance p-5 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2 dark:text-white">Daily Quiz Completed!</h3>
        <p className="text-sm mb-4 dark:text-gray-300">
          You got <span className="font-semibold">{correctAnswers}</span> out of <span className="font-semibold">{DAILY_QUIZ_QUESTIONS}</span> correct
        </p>
        <div className="text-2xl mb-3">🎯</div>
        <Badge className="bg-green-500 text-white mb-4" variant="secondary">
          {DAILY_QUIZ_QUESTIONS}/{DAILY_QUIZ_QUESTIONS} Daily Questions Complete
        </Badge>
        
        {earnedBadge && (
          <div className="mt-2 mb-4">
            <div className="text-3xl mb-3 animate-scale-in">{earnedBadge.icon}</div>
            <Badge className="bg-green-500 text-white" variant="secondary">{earnedBadge.name}</Badge>
            <p className="text-xs text-gray-600 mt-2 dark:text-gray-400">{earnedBadge.description}</p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Come back tomorrow for {DAILY_QUIZ_QUESTIONS} new questions!
        </p>
      </div>
    );
  }

  return null;
};

export default QuizCompletionCard;
