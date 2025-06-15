
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, TrendingUp, Heart, MessageSquare } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'performance';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  stockCaseId?: string;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'performance',
      title: 'Stock Alert',
      message: 'AAPL in your watchlist is up 5.2% today',
      timestamp: '2 hours ago',
      read: false,
      stockCaseId: '1',
    },
    {
      id: '2',
      type: 'like',
      title: 'New Like',
      message: 'Someone liked your comment on Tesla case',
      timestamp: '4 hours ago',
      read: false,
    },
    {
      id: '3',
      type: 'follow',
      title: 'New Follower',
      message: 'John Doe started following your profile',
      timestamp: '1 day ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'follow':
        return <Bell className="w-4 h-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-10 w-10 rounded-full hover:bg-accent focus:bg-accent transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="h-8 px-2 text-xs hover:bg-accent"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-accent rounded-full flex-shrink-0 ml-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
