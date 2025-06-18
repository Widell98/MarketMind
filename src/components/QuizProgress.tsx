
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { DAILY_QUIZ_QUESTIONS } from '@/utils/quizUtils';

interface QuizProgressProps {
  currentQuestionIndex: number;
  questionTheme: string;
  isDynamicMode: boolean;
  setIsDynamicMode: (mode: boolean) => void;
  user: any;
}

const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestionIndex,
  questionTheme,
  isDynamicMode,
  setIsDynamicMode,
  user
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-finance-navy dark:text-gray-200">
        Daily Quiz: {questionTheme}
      </h2>
      <div className="flex items-center space-x-2">
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Static</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDynamicMode(!isDynamicMode)}
              className="p-1"
            >
              {isDynamicMode ? (
                <ToggleRight className="w-6 h-6 text-blue-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-gray-400" />
              )}
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">AI</span>
          </div>
        )}
        <span className="badge-finance bg-finance-lightBlue bg-opacity-10 text-finance-lightBlue dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
          Question {currentQuestionIndex + 1}/{DAILY_QUIZ_QUESTIONS}
        </span>
      </div>
    </div>
  );
};

export default QuizProgress;
