
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";
import { getOptionClass } from '@/utils/quizUtils';

interface QuizQuestionCardProps {
  question: any;
  selectedOption: number | null;
  isAnswered: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  correctAnswer: number;
  streakGained: boolean;
  user: any;
  onOptionSelect: (index: number) => void;
  onNextQuestion: () => void;
  onLearnMore: () => void;
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  selectedOption,
  isAnswered,
  currentQuestionIndex,
  totalQuestions,
  correctAnswer,
  streakGained,
  user,
  onOptionSelect,
  onNextQuestion,
  onLearnMore
}) => {
  return (
    <div className="card-finance p-4 mb-4 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-finance-gray dark:text-gray-400">{question.context}</span>
        {question.category && (
          <Badge variant="outline" className="text-xs dark:text-gray-300">
            {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
          </Badge>
        )}
      </div>
      
      <h3 className="text-base font-medium mb-4 dark:text-white">{question.question}</h3>
      
      <div className="space-y-2 mb-4">
        {question.options.map((option: string, index: number) => (
          <button
            key={index}
            className={`w-full text-left p-3 border rounded-md transition-colors ${getOptionClass(index, isAnswered, selectedOption, correctAnswer)} dark:text-gray-200`}
            onClick={() => onOptionSelect(index)}
            disabled={isAnswered}
          >
            <div className="text-sm">{option}</div>
          </button>
        ))}
      </div>
      
      {isAnswered && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className={`text-sm ${selectedOption === correctAnswer ? 'text-finance-green dark:text-green-400' : 'text-finance-red dark:text-red-400'} mb-3`}>
            {selectedOption === correctAnswer ? 'Correct! 🎯' : 'Incorrect 🧐'}
          </div>
          <p className="text-xs text-finance-gray mb-4 dark:text-gray-400">{question.explanation}</p>
          
          <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
            {question.learningModule && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onLearnMore}
                className="text-finance-blue dark:text-blue-400 dark:border-blue-900"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Learn More
              </Button>
            )}
            
            <Button 
              onClick={onNextQuestion}
              className="w-full sm:w-auto bg-finance-lightBlue text-white hover:bg-finance-blue dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {currentQuestionIndex < totalQuestions - 1 ? 'Continue Quiz' : 'Complete Quiz'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {user && streakGained && (
            <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
              🔥 Streak increased!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizQuestionCard;
