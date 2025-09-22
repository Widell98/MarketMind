
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  Settings,
  Check,
  X,
  Clock,
  BarChart3
} from 'lucide-react';

interface NotificationSystemProps {
  userId?: string;
}

interface Notification {
  id: string;
  type: 'alert' | 'milestone' | 'market_change' | 'rebalance' | 'insight';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  actionRequired?: boolean;
  relatedAsset?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ userId }) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    enableAlerts: true,
    enableMarketUpdates: true,
    enableRebalanceReminders: true,
    enableMilestones: true,
    emailNotifications: false,
    pushNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });

  // Mock notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'alert',
        title: 'Portföljvarning',
        message: 'Din teknikallokering har ökat till 65% av portföljen. Överväg rebalansering.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        priority: 'high',
        isRead: false,
        actionRequired: true,
        relatedAsset: 'Tech Sector'
      },
      {
        id: '2',
        type: 'milestone',
        title: 'Mål uppnått!',
        message: 'Din portfölj har nått 1 miljon SEK i värde.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        priority: 'medium',
        isRead: false
      },
      {
        id: '3',
        type: 'market_change',
        title: 'Marknadsuppdatering',
        message: 'OMXS30 har fallit 3% idag. Dina innehav påverkas.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        priority: 'medium',
        isRead: true,
        relatedAsset: 'OMXS30'
      },
      {
        id: '4',
        type: 'rebalance',
        title: 'Rebalanseringspåminnelse',
        message: 'Det har gått 3 månader sedan senaste rebalansering.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        priority: 'low',
        isRead: true,
        actionRequired: true
      },
      {
        id: '5',
        type: 'insight',
        title: 'AI-insikt',
        message: 'Baserat på marknadsanalys rekommenderas en defensiv strategi.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        priority: 'medium',
        isRead: true
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'milestone':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'market_change':
        return <TrendingDown className="w-4 h-4 text-orange-500" />;
      case 'rebalance':
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'insight':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 dark:border-l-red-400 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'border-l-orange-500 dark:border-l-orange-400 bg-orange-50 dark:bg-orange-950/20';
      case 'low':
        return 'border-l-blue-500 dark:border-l-blue-400 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-l-gray-500 dark:border-l-gray-400 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min sedan`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} tim sedan`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} dagar sedan`;
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.isRead).length;

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            <span>Notifikationer</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-xs"
          >
            <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Markera alla
          </Button>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Håll koll på viktiga händelser och rekommendationer för din portfölj
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <Tabs defaultValue="notifications" className="w-full">
          <div className="w-full overflow-x-auto mb-3 sm:mb-4">
            <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-2 sm:w-full h-auto p-1">
              <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-24 sm:min-w-0">
                Meddelanden
                {actionRequiredCount > 0 && (
                  <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                    {actionRequiredCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-w-24 sm:min-w-0">Inställningar</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="mt-2 sm:mt-4 focus-visible:outline-none">
            <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <BellOff className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">Inga notifikationer</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.isRead ? 'border-2 border-primary/20' : ''
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xs sm:text-sm font-medium truncate">{notification.title}</h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                              )}
                              {notification.actionRequired && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  Åtgärd krävs
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 break-words">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                              {notification.relatedAsset && (
                                <>
                                  <span>•</span>
                                  <span>{notification.relatedAsset}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-2 sm:mt-4 focus-visible:outline-none">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Notifikationstyper
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs sm:text-sm font-medium">Portföljvarningar</label>
                      <p className="text-xs text-muted-foreground">Viktiga varningar om din portfölj</p>
                    </div>
                    <Switch 
                      checked={settings.enableAlerts}
                      onCheckedChange={(checked) => updateSetting('enableAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs sm:text-sm font-medium">Marknadsuppdateringar</label>
                      <p className="text-xs text-muted-foreground">Viktiga marknadsförändringar</p>
                    </div>
                    <Switch 
                      checked={settings.enableMarketUpdates}
                      onCheckedChange={(checked) => updateSetting('enableMarketUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs sm:text-sm font-medium">Rebalanseringspåminnelser</label>
                      <p className="text-xs text-muted-foreground">Påminnelser om portföljunderhåll</p>
                    </div>
                    <Switch 
                      checked={settings.enableRebalanceReminders}
                      onCheckedChange={(checked) => updateSetting('enableRebalanceReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs sm:text-sm font-medium">Milstolpar</label>
                      <p className="text-xs text-muted-foreground">Firande av uppnådda mål</p>
                    </div>
                    <Switch 
                      checked={settings.enableMilestones}
                      onCheckedChange={(checked) => updateSetting('enableMilestones', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 border-t pt-4">
                <h4 className="text-sm sm:text-base font-medium">Leveransinställningar</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs sm:text-sm font-medium">E-postnotifikationer</label>
                      <p className="text-xs text-muted-foreground">Få notifikationer via e-post</p>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs sm:text-sm font-medium">Push-notifikationer</label>
                      <p className="text-xs text-muted-foreground">Direktnotifikationer i webbläsaren</p>
                    </div>
                    <Switch 
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => {
                    toast({
                      title: "Inställningar sparade",
                      description: "Dina notifikationsinställningar har uppdaterats",
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  Spara inställningar
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationSystem;
