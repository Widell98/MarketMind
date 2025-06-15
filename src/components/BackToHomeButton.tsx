
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BackToHomeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show the button if we're already on the homepage
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => navigate('/')}
      className="fixed bottom-4 right-4 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <Home className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">Back to Homepage</span>
      <span className="sm:hidden">Home</span>
    </Button>
  );
};

export default BackToHomeButton;
