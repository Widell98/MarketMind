import React, { useState } from 'react';
import { quizQuestions } from '../mockData/quizData';
import { Button } from "@/components/ui/button";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DynamicMemoryCheck from './DynamicMemoryCheck';
import QuizProgress from './QuizProgress';
import QuizQuestionCard from './QuizQuestionCard';
import QuizCompletionCard from './QuizCompletionCard';
import QuizDialogs from './QuizDialogs';
import { useQuizSession } from '@/hooks/useQuizSession';
import { getTodayQuestions } from '@/utils/quizUtils';

interface MemoryCheckProps {
  onComplete: () => void;
  difficulty?: 'novice' | 'analyst' | 'pro';
}

const MemoryCheck: React.FC<MemoryCheckProps> = ({ 
  onComplete, 
  difficulty = 'novice' 
}) => {
  const { user } = useAuth();
  const [isDynamicMode, setIsDynamicMode] = useState(true);
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("content");
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  
  const {
    currentQuestionIndex,
    selectedOption,
    isAnswered,
    correctAnswers,
    isCompleted,
    userProgress,
    streakGained,
    earnedBadge,
    dailyQuizCompleted,
    completedQuestions,
    todayCompletedCount,
    handleOptionSelect,
    handleNextQuestion,
    setEarnedBadge,
    setStreakGained
  } = useQuizSession();

  // If dynamic mode is enabled and user is logged in, show the dynamic component
  if (isDynamicMode && user) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-finance-navy dark:text-gray-200">
            AI-Powered Quiz
          </h2>
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
        </div>
        <DynamicMemoryCheck 
          onComplete={onComplete} 
          difficulty={difficulty}
          userProgress={userProgress}
        />
      </div>
    );
  }

  // Get today's 3 questions - always the same for everyone each day
  const questions = getTodayQuestions(difficulty, quizQuestions, []);
  const currentQuestion = questions[currentQuestionIndex];
  
  // Show completion card if quiz is completed or daily quiz is already done
  if (isCompleted || dailyQuizCompleted) {
    return (
      <QuizCompletionCard
        isCompleted={isCompleted}
        dailyQuizCompleted={dailyQuizCompleted}
        correctAnswers={correctAnswers}
        earnedBadge={earnedBadge}
        onComplete={onComplete}
      />
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="card-finance p-5 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2 dark:text-white">No Questions Available</h3>
        <p className="text-sm mb-4 dark:text-gray-300">
          You've completed all available questions for your difficulty level. Great job!
        </p>
        <Button onClick={onComplete} className="bg-finance-lightBlue text-white">
          Continue Learning
        </Button>
      </div>
    );
  }
  
  const trackLearningModuleView = async () => {
    if (!currentQuestion || !currentQuestion.learningModule || !user) return;
    
    const moduleId = `${currentQuestion.category}_${currentQuestion.id}`;
    
    try {
      await supabase
        .from('user_learning_modules')
        .upsert({
          user_id: user.id,
          module_id: moduleId
        });
    } catch (error) {
      console.error('Error tracking learning module view:', error);
    }
  };
  
  const openLearningModule = () => {
    if (currentQuestion.learningModule) {
      setShowLearningModule(true);
      if (user) {
        trackLearningModuleView();
      }
      setActiveTab("content");
    }
  };

  const handleOptionSelectWrapper = (optionIndex: number) => {
    handleOptionSelect(optionIndex, currentQuestion, questions);
  };

  const handleNextQuestionWrapper = () => {
    handleNextQuestion(questions, onComplete, () => setShowRegistrationPrompt(true));
  };
  
  return (
    <div className="mb-8 animate-slide-up">
      <QuizProgress
        currentQuestionIndex={currentQuestionIndex}
        questionTheme={currentQuestion.theme}
        isDynamicMode={isDynamicMode}
        setIsDynamicMode={setIsDynamicMode}
        user={user}
        todayCompletedCount={todayCompletedCount}
      />
      
      <QuizQuestionCard
        question={currentQuestion}
        selectedOption={selectedOption}
        isAnswered={isAnswered}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        correctAnswer={currentQuestion.correctAnswer}
        streakGained={streakGained}
        user={user}
        onOptionSelect={handleOptionSelectWrapper}
        onNextQuestion={handleNextQuestionWrapper}
        onLearnMore={openLearningModule}
      />
      
      <QuizDialogs
        showLearningModule={showLearningModule}
        setShowLearningModule={setShowLearningModule}
        showRegistrationPrompt={showRegistrationPrompt}
        setShowRegistrationPrompt={setShowRegistrationPrompt}
        currentQuestion={currentQuestion}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        correctAnswers={correctAnswers}
        onComplete={onComplete}
      />
    </div>
  );
};

export default MemoryCheck;
