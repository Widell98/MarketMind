
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useQuizAPI, APIQuizQuestion } from '@/hooks/useQuizAPI';
import { UserProgress } from '@/mockData/quizData';

interface DynamicMemoryCheckProps {
  onComplete: () => void;
  difficulty?: 'novice' | 'analyst' | 'pro';
  userProgress: UserProgress;
}

const DynamicMemoryCheck: React.FC<DynamicMemoryCheckProps> = ({ 
  onComplete, 
  difficulty = 'novice',
  userProgress
}) => {
  const { user } = useAuth();
  const { generateQuestions, loading: apiLoading, error: apiError } = useQuizAPI();
  
  const [questions, setQuestions] = useState<APIQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load questions on component mount
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsGenerating(true);
    try {
      const generatedQuestions = await generateQuestions(difficulty, userProgress);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const refreshQuestions = async () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectAnswers(0);
    setIsCompleted(false);
    await loadQuestions();
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    if (optionIndex === currentQuestion.correctAnswer) {
      setCorrectAnswers(correctAnswers + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      setTimeout(() => onComplete(), 2000);
    }
  };

  const getOptionClass = (index: number) => {
    if (!isAnswered) {
      return 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600';
    }
    
    if (index === currentQuestion.correctAnswer) {
      return 'border-finance-green bg-green-50 dark:bg-green-900 dark:bg-opacity-20 dark:border-green-700';
    }
    
    if (index === selectedOption && selectedOption !== currentQuestion.correctAnswer) {
      return 'border-finance-red bg-red-50 dark:bg-red-900 dark:bg-opacity-20 dark:border-red-700';
    }
    
    return 'border-gray-200 opacity-70 dark:border-gray-700 dark:opacity-50';
  };

  if (isGenerating || apiLoading) {
    return (
      <div className="card-finance p-6 text-center dark:bg-gray-800 dark:border-gray-700">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-medium mb-2 dark:text-white">Generating Personalized Questions</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Creating questions based on current market data and your progress...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card-finance p-6 text-center dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4 dark:text-white">Unable to Load Questions</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {apiError || 'Failed to generate questions. Please try again.'}
        </p>
        <Button onClick={loadQuestions} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="card-finance p-6 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2 dark:text-white">Dynamic Quiz Completed!</h3>
        <p className="text-sm mb-4 dark:text-gray-300">
          You got <span className="font-semibold">{correctAnswers}</span> out of <span className="font-semibold">{questions.length}</span> correct
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Zap className="w-4 h-4" />
          <span>Powered by AI & Live Market Data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-finance-navy dark:text-gray-200">
            {currentQuestion.theme}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {currentQuestion.isGenerated ? 'AI Generated' : 'Static'}
            </Badge>
            {currentQuestion.isGenerated && (
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Zap className="w-3 h-3" />
                <span>Live Data</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshQuestions}
            disabled={isGenerating}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            New Questions
          </Button>
          <span className="badge-finance bg-finance-lightBlue bg-opacity-10 text-finance-lightBlue dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </div>
      
      <div className="card-finance p-4 mb-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-finance-gray dark:text-gray-400">{currentQuestion.context}</span>
          <Badge variant="outline" className="text-xs dark:text-gray-300">
            {currentQuestion.category.charAt(0).toUpperCase() + currentQuestion.category.slice(1)}
          </Badge>
        </div>
        
        <h3 className="text-base font-medium mb-4 dark:text-white">{currentQuestion.question}</h3>
        
        <div className="space-y-2 mb-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`w-full text-left p-3 border rounded-md transition-colors ${getOptionClass(index)} dark:text-gray-200`}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnswered}
            >
              <div className="text-sm">{option}</div>
            </button>
          ))}
        </div>
        
        {isAnswered && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className={`text-sm ${selectedOption === currentQuestion.correctAnswer ? 'text-finance-green dark:text-green-400' : 'text-finance-red dark:text-red-400'} mb-3`}>
              {selectedOption === currentQuestion.correctAnswer ? 'Korrekt! 🎯' : 'Fel svar 🧐'}
            </div>
            <p className="text-xs text-finance-gray mb-4 dark:text-gray-400">{currentQuestion.explanation}</p>
            
            <Button 
              onClick={handleNextQuestion}
              className="w-full bg-finance-lightBlue text-white hover:bg-finance-blue dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicMemoryCheck;
