
import React, { useState, useEffect } from 'react';
import { quizQuestions, badges, UserProgress, defaultUserProgress } from '../mockData/quizData';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [streakGained, setStreakGained] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<typeof badges[0] | null>(null);
  
  // Load user progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('marketMentor_progress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    }
  }, []);
  
  // Set day of week for quiz theme
  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  
  // Find today's questions (or use difficulty filtered questions if none match)
  const matchingDayQuestions = quizQuestions.filter(q => 
    q.day === dayOfWeek as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  );
  
  // Filter by difficulty if no day-specific questions or if we want to ensure difficulty level
  const filteredQuestions = matchingDayQuestions.length > 0 
    ? matchingDayQuestions.filter(q => q.difficulty === difficulty)
    : quizQuestions.filter(q => q.difficulty === difficulty);
  
  // Use day-specific questions if available, otherwise fall back to difficulty-filtered
  const questions = filteredQuestions.length > 0 ? filteredQuestions : matchingDayQuestions;
  const currentQuestion = questions[currentQuestionIndex];
  
  // Check for streak and update progress
  const updateUserProgress = (isCorrect: boolean) => {
    const newProgress = { ...userProgress };
    
    // Update last quiz date and check streak
    const today = new Date().toISOString().split('T')[0];
    const lastQuizDate = newProgress.lastQuizDate;
    
    if (lastQuizDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastQuizDate === yesterdayStr) {
        newProgress.streakDays += 1;
        setStreakGained(true);
        
        // Check for streak badges
        if (newProgress.streakDays === 3 && !newProgress.badges.includes('streak_3')) {
          newProgress.badges.push('streak_3');
          setEarnedBadge(badges.find(b => b.id === 'streak_3') || null);
        } else if (newProgress.streakDays === 7 && !newProgress.badges.includes('streak_7')) {
          newProgress.badges.push('streak_7');
          setEarnedBadge(badges.find(b => b.id === 'streak_7') || null);
        }
      } else if (lastQuizDate !== today) {
        // Reset streak if not yesterday and not today
        newProgress.streakDays = 1;
      }
    } else {
      // First quiz ever
      newProgress.streakDays = 1;
      newProgress.badges.push('first_quiz');
      setEarnedBadge(badges.find(b => b.id === 'first_quiz') || null);
    }
    
    newProgress.lastQuizDate = today;
    
    // Add points and update category stats if correct
    if (isCorrect && currentQuestion) {
      newProgress.points += 10;
      
      const category = currentQuestion.category;
      newProgress.correctByCategory[category] = (newProgress.correctByCategory[category] || 0) + 1;
      
      // Check for category mastery badges
      const categoryBadgeMap = {
        'macro': 'macro_master',
        'stocks': 'tech_titan',
        'commodities': 'wildcard_wizard',
        'historical': 'history_buff',
        'concept': 'fundamental_fanatic'
      };
      
      const badgeId = categoryBadgeMap[category as keyof typeof categoryBadgeMap];
      if (badgeId && newProgress.correctByCategory[category] >= 10 && !newProgress.badges.includes(badgeId)) {
        newProgress.badges.push(badgeId);
        setEarnedBadge(badges.find(b => b.id === badgeId) || null);
      }
    }
    
    // Add to completed quizzes
    if (currentQuestion && !newProgress.completedQuizzes.includes(currentQuestion.id)) {
      newProgress.completedQuizzes.push(currentQuestion.id);
    }
    
    // Update level based on points
    for (let i = userLevels.length - 1; i >= 0; i--) {
      if (newProgress.points >= userLevels[i].requiredPoints) {
        newProgress.level = userLevels[i].id;
        break;
      }
    }
    
    // Save progress and update state
    localStorage.setItem('marketMentor_progress', JSON.stringify(newProgress));
    setUserProgress(newProgress);
  };
  
  if (!currentQuestion) {
    return null;
  }
  
  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    }
    
    updateUserProgress(isCorrect);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setEarnedBadge(null);
      setStreakGained(false);
    } else {
      setIsCompleted(true);
      
      // Check for perfect score badge
      if (correctAnswers + 1 === questions.length) {
        const newProgress = { ...userProgress };
        if (!newProgress.badges.includes('perfect_score')) {
          newProgress.badges.push('perfect_score');
          setEarnedBadge(badges.find(b => b.id === 'perfect_score') || null);
          localStorage.setItem('marketMentor_progress', JSON.stringify(newProgress));
          setUserProgress(newProgress);
        }
      }
      
      // Give the user a moment to see their final result
      setTimeout(() => onComplete(), 3000);
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
  
  const openLearningModule = () => {
    if (currentQuestion.learningModule) {
      setShowLearningModule(true);
    }
  };
  
  if (isCompleted) {
    // Show earned badge if any, otherwise show completion message
    return (
      <div className="card-finance p-5 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2 dark:text-white">Quiz Completed!</h3>
        <p className="text-sm mb-4 dark:text-gray-300">
          You got <span className="font-semibold">{correctAnswers}</span> out of <span className="font-semibold">{questions.length}</span> correct
        </p>
        
        {earnedBadge && (
          <div className="mt-2 mb-4">
            <div className="text-xl mb-2">{earnedBadge.icon}</div>
            <Badge className="bg-green-500 text-white" variant="secondary">{earnedBadge.name}</Badge>
            <p className="text-xs text-gray-600 mt-2 dark:text-gray-400">{earnedBadge.description}</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="mb-8 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-finance-navy dark:text-gray-200">
          Memory Check: {currentQuestion.theme}
        </h2>
        <div className="flex items-center space-x-2">
          {userProgress.streakDays > 1 && (
            <span className="badge-finance bg-amber-100 text-amber-800 dark:bg-amber-900 dark:bg-opacity-30 dark:text-amber-300">
              🔥 {userProgress.streakDays} day streak
            </span>
          )}
          <span className="badge-finance bg-finance-lightBlue bg-opacity-10 text-finance-lightBlue dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
            Question {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </div>
      
      <div className="card-finance p-4 mb-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-finance-gray dark:text-gray-400">{currentQuestion.context}</span>
          {currentQuestion.category && (
            <Badge variant="outline" className="text-xs dark:text-gray-300">
              {currentQuestion.category.charAt(0).toUpperCase() + currentQuestion.category.slice(1)}
            </Badge>
          )}
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
            
            <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
              {currentQuestion.learningModule && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={openLearningModule}
                  className="text-finance-blue dark:text-blue-400 dark:border-blue-900"
                >
                  Learn More
                </Button>
              )}
              
              <Button 
                onClick={handleNextQuestion}
                className="w-full sm:w-auto bg-finance-lightBlue text-white hover:bg-finance-blue dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
              </Button>
            </div>
            
            {streakGained && (
              <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
                🔥 Streak increased to {userProgress.streakDays} days!
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Learning Module Dialog */}
      <Dialog open={showLearningModule} onOpenChange={setShowLearningModule}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-finance-navy dark:text-gray-200">
              {currentQuestion.learningModule?.title}
            </DialogTitle>
            <DialogDescription>
              Micro-Learning Module
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {currentQuestion.learningModule?.content}
            </p>
            
            {currentQuestion.learningModule?.videoUrl && (
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 mt-4">
                <span>Video content would load here</span>
              </div>
            )}
            
            {currentQuestion.relatedSymbols && currentQuestion.relatedSymbols.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Related Symbols:</h4>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.relatedSymbols.map(symbol => (
                    <Badge key={symbol} variant="outline" className="dark:border-gray-600">
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemoryCheck;
