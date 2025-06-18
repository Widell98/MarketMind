
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Award, UserPlus, Target, TrendingUp, Zap } from "lucide-react";
import { Link } from 'react-router-dom';
import { DAILY_QUIZ_QUESTIONS } from '@/utils/quizUtils';

interface QuizDialogsProps {
  showLearningModule: boolean;
  setShowLearningModule: (show: boolean) => void;
  showRegistrationPrompt: boolean;
  setShowRegistrationPrompt: (show: boolean) => void;
  currentQuestion: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  correctAnswers: number;
  onComplete: () => void;
}

const QuizDialogs: React.FC<QuizDialogsProps> = ({
  showLearningModule,
  setShowLearningModule,
  showRegistrationPrompt,
  setShowRegistrationPrompt,
  currentQuestion,
  activeTab,
  setActiveTab,
  correctAnswers,
  onComplete
}) => {
  return (
    <>
      {/* Registration Prompt Dialog for Non-logged users */}
      <AlertDialog open={showRegistrationPrompt} onOpenChange={setShowRegistrationPrompt}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-finance-navy dark:text-gray-200">
              <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
              Create Account for Full Experience
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Great job! You answered <span className="font-semibold text-finance-navy dark:text-gray-200">{correctAnswers} out of {DAILY_QUIZ_QUESTIONS}</span> questions correctly.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">With an account you get:</h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                  <li className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Personalized questions based on your level
                  </li>
                  <li className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Track your progress and statistics
                  </li>
                  <li className="flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Daily streaks and rewards
                  </li>
                  <li className="flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Earn badges and levels
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => {
              setShowRegistrationPrompt(false);
              onComplete();
            }}>
              Continue without account
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link 
                to="/auth" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create free account
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Learning Module Dialog */}
      <Dialog open={showLearningModule} onOpenChange={setShowLearningModule}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-finance-navy dark:text-gray-200">
              {currentQuestion?.learningModule?.title}
            </DialogTitle>
            <DialogDescription>
              Micro-Learning Module
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="pt-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {currentQuestion?.learningModule?.content}
              </p>
              
              {currentQuestion?.learningModule?.videoUrl && (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 mt-4">
                  <span>Video content would load here</span>
                </div>
              )}
              
              {currentQuestion?.relatedSymbols && currentQuestion.relatedSymbols.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Related Symbols:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.relatedSymbols.map((symbol: string) => (
                      <Badge key={symbol} variant="outline" className="dark:border-gray-600">
                        {symbol}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resources" className="pt-4">
              {currentQuestion?.learningModule?.resources && currentQuestion.learningModule.resources.length > 0 ? (
                <div className="space-y-3">
                  {currentQuestion.learningModule.resources.map((resource: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-3 border rounded-md flex items-center justify-between dark:border-gray-700"
                    >
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                        </Badge>
                        <p className="text-sm font-medium dark:text-gray-200">{resource.title}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No additional resources available for this topic.</p>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Award className="h-3 w-3 mr-1" />
                <span>+1 towards Knowledge Seeker badge</span>
              </div>
              <Button 
                onClick={() => setShowLearningModule(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuizDialogs;
