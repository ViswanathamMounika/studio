
"use client";

import React from 'react';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, User2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

type NotificationsProps = {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onDefinitionClick: (id: string) => void;
};

export default function Notifications({ notifications, setNotifications, onDefinitionClick }: NotificationsProps) {
  
  const handleMarkAsRead = (id: string) => {
    // Soft delete: remove from list when marked as read
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllAsRead = () => {
    // Clear all if "Mark All as Read" is clicked
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
      <Card className="border-0 shadow-none">
        <CardHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-bold">Notifications</CardTitle>
              {unreadCount > 0 && <Badge variant="destructive" className="h-5 px-1.5 min-w-[20px] justify-center">{unreadCount}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/10" onClick={handleMarkAllAsRead} disabled={notifications.length === 0}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-6">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">All caught up!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Bookmark definitions to receive updates when they are modified.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all border border-transparent hover:border-slate-100 ${!notification.read ? 'bg-primary/5' : 'bg-background'}`}
                >
                  <div className="h-8 w-8 rounded-full bg-white border shadow-sm flex items-center justify-center shrink-0">
                    <User2 className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                        className="font-bold text-[13px] hover:text-primary cursor-pointer transition-colors truncate"
                        onClick={() => onDefinitionClick(notification.definitionId)}
                    >
                        {notification.definitionName}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notification.message}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">{new Date(notification.date).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as Read"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </ScrollArea>
        </CardContent>
      </Card>
  );
}
