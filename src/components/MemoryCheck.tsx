
import React, { useState } from 'react';
import { quizQuestions, badges } from '../mockData/quizData';
import Badge from './ui/Badge';

interface MemoryCheckProps {
  onComplete: () => void;
  difficulty?: 'novice' | 'analyst' | 'pro';
}

const MemoryCheck: React.FC<MemoryCheckProps> = ({ 
  onComplete, 
  difficulty = 'novice' 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Filter questions by difficulty
  const filteredQuestions = quizQuestions.filter(q => q.difficulty === difficulty);
  
  // Set day of week for quiz theme
  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  
  // Find today's question (or use first question if none match)
  const matchingDayQuestions = quizQuestions.filter(q => 
    q.day === dayOfWeek as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  );
  
  const questions = matchingDayQuestions.length > 0 ? matchingDayQuestions : filteredQuestions;
  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return null;
  }
  
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
      // Give the user a moment to see their final result
      setTimeout(() => onComplete(), 2000);
    }
  };
  
  const getOptionClass = (index: number) => {
    if (!isAnswered) {
      return 'border-gray-200 hover:border-gray-300';
    }
    
    if (index === currentQuestion.correctAnswer) {
      return 'border-finance-green bg-green-50';
    }
    
    if (index === selectedOption && selectedOption !== currentQuestion.correctAnswer) {
      return 'border-finance-red bg-red-50';
    }
    
    return 'border-gray-200 opacity-70';
  };
  
  if (isCompleted) {
    // Completion screen
    const earnedBadge = correctAnswers === questions.length ? badges.find(b => b.id === 'perfect_score') : null;
    
    return (
      <div className="card-finance p-5 text-center animate-fade-in">
        <h3 className="text-lg font-medium mb-2">Quiz Completed!</h3>
        <p className="text-sm mb-4">
          You got <span className="font-semibold">{correctAnswers}</span> out of <span className="font-semibold">{questions.length}</span> correct
        </p>
        
        {earnedBadge && (
          <div className="mt-2 mb-4">
            <div className="text-xl mb-2">{earnedBadge.icon}</div>
            <Badge text={earnedBadge.name} variant="success" icon="🎉" />
            <p className="text-xs text-gray-600 mt-2">{earnedBadge.description}</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="mb-8 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-finance-navy">
          Memory Check: {currentQuestion.theme}
        </h2>
        <span className="badge-finance bg-finance-lightBlue bg-opacity-10 text-finance-lightBlue">
          Fråga {currentQuestionIndex + 1}/{questions.length}
        </span>
      </div>
      
      <div className="card-finance p-4 mb-4">
        <div className="text-sm text-finance-gray mb-2">{currentQuestion.context}</div>
        <h3 className="text-base font-medium mb-4">{currentQuestion.question}</h3>
        
        <div className="space-y-2 mb-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`w-full text-left p-3 border rounded-md transition-colors ${getOptionClass(index)}`}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnswered}
            >
              <div className="text-sm">{option}</div>
            </button>
          ))}
        </div>
        
        {isAnswered && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className={`text-sm ${selectedOption === currentQuestion.correctAnswer ? 'text-finance-green' : 'text-finance-red'} mb-3`}>
              {selectedOption === currentQuestion.correctAnswer ? 'Korrekt! 🎯' : 'Fel svar 🧐'}
            </div>
            <p className="text-xs text-finance-gray mb-4">{currentQuestion.explanation}</p>
            <button 
              onClick={handleNextQuestion}
              className="w-full py-2 px-4 bg-finance-lightBlue text-white rounded-md hover:bg-finance-blue transition-colors"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Nästa fråga' : 'Avsluta quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryCheck;
