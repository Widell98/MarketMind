
import React from 'react';
import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-lg font-bold text-finance-navy dark:text-gray-200 flex items-center">
            <span className="mr-2">📈</span>
            Market Mentor
          </Link>
          
          <div className="flex items-center">
            <ProfileMenu />
          </div>
        </div>
      </header>
      
      <main className="max-w-screen-xl mx-auto py-6 px-4">
        {children}
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 text-center text-sm text-finance-gray dark:text-gray-400">
          © {new Date().getFullYear()} Market Mentor. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
