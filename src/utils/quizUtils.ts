
export const DAILY_QUIZ_QUESTIONS = 3;

// Function to get today's 3 questions deterministically
export const getTodayQuestions = (difficulty: string, allQuestions: any[], completedQuestions: string[]) => {
  // Use today's date as seed for consistent daily questions
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  // Filter questions by difficulty and remove completed ones for logged-in users
  let availableQuestions = allQuestions.filter(q => q.difficulty === difficulty);
  
  // For logged-in users, filter out completed questions from today's selection
  if (completedQuestions.length > 0) {
    availableQuestions = availableQuestions.filter(q => !completedQuestions.includes(q.id));
  }
  
  // If we don't have enough questions, include all questions for the difficulty
  if (availableQuestions.length < DAILY_QUIZ_QUESTIONS) {
    availableQuestions = allQuestions.filter(q => q.difficulty === difficulty);
  }
  
  // Use seeded random to select the same 3 questions each day
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  const selectedQuestions = [];
  const questionsCopy = [...availableQuestions];
  
  for (let i = 0; i < Math.min(DAILY_QUIZ_QUESTIONS, questionsCopy.length); i++) {
    const randomIndex = Math.floor(seededRandom(seed + i) * questionsCopy.length);
    selectedQuestions.push(questionsCopy[randomIndex]);
    questionsCopy.splice(randomIndex, 1);
  }
  
  return selectedQuestions;
};

export const getOptionClass = (index: number, isAnswered: boolean, selectedOption: number | null, correctAnswer: number) => {
  if (!isAnswered) {
    return 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600';
  }
  
  if (index === correctAnswer) {
    return 'border-finance-green bg-green-50 dark:bg-green-900 dark:bg-opacity-20 dark:border-green-700';
  }
  
  if (index === selectedOption && selectedOption !== correctAnswer) {
    return 'border-finance-red bg-red-50 dark:bg-red-900 dark:bg-opacity-20 dark:border-red-700';
  }
  
  return 'border-gray-200 opacity-70 dark:border-gray-700 dark:opacity-50';
};
