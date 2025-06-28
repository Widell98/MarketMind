
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Brain,
  BookOpen,
  Eye,
  Home,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const MainNavigation = () => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="font-bold text-xl text-gray-900">StockFlow</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/stock-cases"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Aktiefall
              </Link>
              <Link
                to="/portfolio-implementation"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <Brain className="w-4 h-4 mr-2" />
                Portfolio AI
              </Link>
              <Link
                to="/learning"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Lärande
              </Link>
              <Link
                to="/watchlist"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <Eye className="w-4 h-4 mr-2" />
                Watchlist
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <div className="hidden sm:ml-6 sm:flex space-x-4">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="text-gray-500 hover:text-gray-700 inline-flex items-center text-sm font-medium"
                  >
                    Din profil
                  </Link>
                  <Button variant="outline" size="sm" onClick={signOut}>
                    Logga ut
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="text-gray-500 hover:text-gray-700 inline-flex items-center text-sm font-medium"
                  >
                    Logga in
                  </Link>
                  <Link
                    to="/auth"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                  >
                    Registrera dig
                  </Link>
                </>
              )}
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                    <span className="sr-only">Open main menu</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <SheetHeader>
                    <SheetTitle>Meny</SheetTitle>
                    <SheetDescription>
                      Navigera genom StockFlow.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col space-y-4 mt-4">
                    <SheetClose asChild>
                      <Link
                        to="/"
                        className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        <Home className="w-4 h-4 mr-2 inline-block" />
                        Hem
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/stock-cases"
                        className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        <BarChart3 className="w-4 h-4 mr-2 inline-block" />
                        Aktiefall
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/portfolio-implementation"
                        className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        <Brain className="w-4 h-4 mr-2 inline-block" />
                        Portfolio AI
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/learning"
                        className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        <BookOpen className="w-4 h-4 mr-2 inline-block" />
                        Lärande
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/watchlist"
                        className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 mr-2 inline-block" />
                        Watchlist
                      </Link>
                    </SheetClose>
                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Link
                            to="/profile"
                            className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Din profil
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button variant="outline" size="sm" onClick={signOut} className="w-full justify-start">
                            Logga ut
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Link
                            to="/auth"
                            className="text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Logga in
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to="/auth"
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium block"
                          >
                            Registrera dig
                          </Link>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
