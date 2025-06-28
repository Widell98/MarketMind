
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, Building, Globe, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface FinancialEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  category: 'earnings' | 'economic' | 'dividend' | 'other';
  company?: string;
  date?: string;
  dayOfWeek?: string;
}

const FinancialCalendar = () => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('fetch-news-data', {
        body: { type: 'calendar' }
      });

      if (error) {
        console.error('Error fetching calendar data:', error);
        setError('Kunne inte ladda kalendern');
        return;
      }

      if (data && Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Fel vid hämtning av kalenderdata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

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

  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => 
      event.date === today || 
      (!event.date && event.dayOfWeek === format(new Date(), 'EEEE', { locale: sv }))
    );
  };

  const getEventsByDay = () => {
    const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
    const eventsByDay: Record<string, FinancialEvent[]> = {};
    
    days.forEach(day => {
      eventsByDay[day] = events.filter(event => 
        event.dayOfWeek === day || 
        (event.date && format(new Date(event.date), 'EEEE', { locale: sv }) === day)
      );
    });
    
    return eventsByDay;
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Finansiell Kalender
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Laddar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Finansiell Kalender
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
            <Button size="sm" onClick={fetchCalendarData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCalendarData}
              className="text-xs px-2 py-1"
            >
              <RefreshCw className="w-3 h-3" />
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
            {getTodayEvents().length > 0 ? (
              getTodayEvents().map((event) => (
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
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p className="text-xs">Inga händelser idag</p>
              </div>
            )}
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
            
            {Object.entries(getEventsByDay()).map(([day, dayEvents]) => (
              <div key={day} className="space-y-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">
                  {day}
                </div>
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg ml-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-12">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        {getCategoryIcon(event.category)}
                        <span className="text-xs text-gray-900 dark:text-gray-100 flex-1">
                          {event.title}
                        </span>
                        <Badge className={`text-xs px-1.5 py-0.5 ${getImportanceColor(event.importance)}`}>
                          {event.importance}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 py-2">
                    Inga händelser
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialCalendar;
