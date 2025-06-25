
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, Building, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';

interface FinancialEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  category: 'earnings' | 'economic' | 'dividend' | 'other';
  company?: string;
}

const FinancialCalendar = () => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock financial events data
  const todayEvents: FinancialEvent[] = [
    {
      id: '1',
      time: '08:30',
      title: 'Inflation Data (CPI)',
      description: 'Monthly consumer price index release',
      importance: 'high',
      category: 'economic'
    },
    {
      id: '2',
      time: '09:00',
      title: 'H&M Q4 Earnings',
      description: 'Quarterly earnings report',
      importance: 'medium',
      category: 'earnings',
      company: 'H&M'
    },
    {
      id: '3',
      time: '14:30',
      title: 'Fed Meeting Minutes',
      description: 'Federal Reserve meeting minutes',
      importance: 'high',
      category: 'economic'
    },
    {
      id: '4',
      time: '16:00',
      title: 'Volvo Cars Dividend',
      description: 'Ex-dividend date',
      importance: 'low',
      category: 'dividend',
      company: 'Volvo Cars'
    }
  ];

  const weekEvents = {
    'Monday': [
      { id: '1', time: '08:30', title: 'GDP Data', importance: 'high' as const, category: 'economic' as const },
      { id: '2', time: '09:00', title: 'Ericsson Earnings', importance: 'medium' as const, category: 'earnings' as const }
    ],
    'Tuesday': [
      { id: '3', time: '08:30', title: 'CPI Release', importance: 'high' as const, category: 'economic' as const },
      { id: '4', time: '14:00', title: 'FOMC Meeting', importance: 'high' as const, category: 'economic' as const }
    ],
    'Wednesday': [
      { id: '5', time: '07:00', title: 'Atlas Copco Q4', importance: 'medium' as const, category: 'earnings' as const },
      { id: '6', time: '16:00', title: 'SEB Dividend', importance: 'low' as const, category: 'dividend' as const }
    ],
    'Thursday': [
      { id: '7', time: '08:00', title: 'Unemployment Data', importance: 'medium' as const, category: 'economic' as const }
    ],
    'Friday': [
      { id: '8', time: '09:30', title: 'Market Close Early', importance: 'low' as const, category: 'other' as const }
    ]
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'earnings': return <Building className="w-3 h-3" />;
      case 'economic': return <Globe className="w-3 h-3" />;
      case 'dividend': return <TrendingUp className="w-3 h-3" />;
      default: return <Calendar className="w-3 h-3" />;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Finansiell Kalender
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="text-xs px-2 py-1"
            >
              Idag
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="text-xs px-2 py-1"
            >
              Vecka
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {viewMode === 'day' ? (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {format(new Date(), 'EEEE, d MMMM', { locale: sv })}
            </div>
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-12">
                  <Clock className="w-3 h-3" />
                  {event.time}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(event.category)}
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {event.title}
                    </span>
                    <Badge className={`text-xs px-1.5 py-0.5 ${getImportanceColor(event.importance)}`}>
                      {event.importance}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {event.description}
                  </p>
                  {event.company && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {event.company}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Vecka {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'w, yyyy', { locale: sv })}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {Object.entries(weekEvents).map(([day, events]) => (
              <div key={day} className="space-y-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">
                  {day}
                </div>
                {events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg ml-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-12">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      {getCategoryIcon(event.category)}
                      <span className="text-xs text-gray-900 dark:text-gray-100">
                        {event.title}
                      </span>
                      <Badge className={`text-xs px-1.5 py-0.5 ${getImportanceColor(event.importance)}`}>
                        {event.importance}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialCalendar;
