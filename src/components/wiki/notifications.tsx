
"use client";

import React from 'react';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, User2, History } from 'lucide-react';
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
      <Card className="border-0 shadow-none bg-white">
        <CardHeader className="p-4 border-b bg-slate-50/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-black">
                    {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[11px] font-black uppercase tracking-wider text-primary hover:bg-primary/5 h-8 px-2" 
                onClick={handleMarkAllAsRead} 
                disabled={notifications.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-6">
              <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <History className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Nothing new here</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
                Bookmark definitions to get live updates when team members make improvements.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`flex items-start gap-3 p-3.5 rounded-xl transition-all border border-transparent hover:border-slate-100 group ${!notification.read ? 'bg-primary/5' : 'bg-background'}`}
                >
                  <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                    <User2 className="h-4.5 w-4.5 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button 
                        className="font-bold text-[13px] text-slate-900 hover:text-primary transition-colors text-left truncate w-full"
                        onClick={() => onDefinitionClick(notification.definitionId)}
                    >
                        {notification.definitionName}
                    </button>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                        {notification.message}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2.5">
                        {new Date(notification.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 rounded-lg text-primary border-primary/20 hover:bg-primary hover:text-white text-[10px] font-black uppercase transition-all"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                        Mark as read
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
