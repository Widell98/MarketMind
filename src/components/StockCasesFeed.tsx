
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const StockCasesFeed = () => {
  // Mock data för demonstration
  const cases = [
    {
      id: 1,
      type: 'INITIAL REPORT',
      title: 'Eniro Group: Omformad och uppladdad',
      company: 'Eniro Group',
      status: 'active',
      performance: null,
      entryPrice: '12.50',
      targetPrice: '18.00',
      currentPrice: '14.20',
      timeAgo: '2 timmar sedan',
      views: 234,
      likes: 12,
      comments: 5,
      category: 'Tech',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop&crop=center'
    },
    {
      id: 2,
      type: 'INITIAL REPORT', 
      title: 'Isofol Medical: En comeback story på gång',
      company: 'Isofol Medical',
      status: 'active',
      performance: null,
      entryPrice: '8.32',
      targetPrice: '15.00',
      currentPrice: '9.45',
      timeAgo: '4 timmar sedan',
      views: 189,
      likes: 8,
      comments: 3,
      category: 'Biotech',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center'
    },
    {
      id: 3,
      type: 'THEME REPORT',
      title: 'Quality Microcap Q1 2025: Konsumenten slår tillbaka',
      company: 'Portfolio Theme',
      status: 'winner',
      performance: 13.4,
      entryPrice: '—',
      targetPrice: '—',
      currentPrice: '—',
      timeAgo: '1 dag sedan',
      views: 456,
      likes: 23,
      comments: 11,
      category: 'Theme',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&crop=center'
    },
    {
      id: 4,
      type: 'INITIAL REPORT',
      title: 'Evolution Gaming: Marknadsledarskap fortsätter',
      company: 'Evolution Gaming',
      status: 'winner',
      performance: 8.7,
      entryPrice: '1250.00',
      targetPrice: '1500.00',
      currentPrice: '1359.00',
      timeAgo: '2 dagar sedan',
      views: 678,
      likes: 34,
      comments: 18,
      category: 'Gaming',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center'
    },
    {
      id: 5,
      type: 'INITIAL REPORT',
      title: 'Embracer Group: Restructuring framsteg',
      company: 'Embracer Group',
      status: 'active',
      performance: null,
      entryPrice: '15.40',
      targetPrice: '25.00',
      currentPrice: '16.80',
      timeAgo: '3 dagar sedan',
      views: 345,
      likes: 19,
      comments: 12,
      category: 'Gaming',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop&crop=center'
    },
    {
      id: 6,
      type: 'INITIAL REPORT',
      title: 'Nibe Industrier: Hållbar tillväxtstrategi',
      company: 'Nibe Industrier',
      status: 'active',
      performance: null,
      entryPrice: '42.50',
      targetPrice: '55.00',
      currentPrice: '44.20',
      timeAgo: '4 dagar sedan',
      views: 298,
      likes: 15,
      comments: 8,
      category: 'Industrial',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=200&fit=crop&crop=center'
    }
  ];

  const getStatusBadge = (status: string, performance: number | null) => {
    if (status === 'winner') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          Winner +{performance}%
        </Badge>
      );
    }
    if (status === 'loser') {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
          <TrendingDown className="w-3 h-3 mr-1" />
          Loser {performance}%
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        Active
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Tech': 'bg-purple-500',
      'Biotech': 'bg-green-500',
      'Theme': 'bg-orange-500',
      'Gaming': 'bg-red-500',
      'Industrial': 'bg-blue-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cases.map((case_) => (
        <Card key={case_.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden">
          {/* Image */}
          <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <img 
              src={case_.image} 
              alt={case_.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="outline" className="text-xs font-medium text-white bg-black/50 border-white/20 backdrop-blur-sm">
                {case_.type}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              {getStatusBadge(case_.status, case_.performance)}
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getCategoryColor(case_.category)}`}></div>
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">{case_.category}</span>
            </div>
          </div>

          <CardHeader className="pb-3">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {case_.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {case_.company}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{case_.timeAgo}</span>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Price Information */}
            {case_.entryPrice !== '—' && (
              <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entry</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{case_.entryPrice} kr</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">{case_.currentPrice} kr</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{case_.targetPrice} kr</p>
                </div>
              </div>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{case_.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{case_.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{case_.comments}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Läs mer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StockCasesFeed;
