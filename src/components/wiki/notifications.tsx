
"use client";

import React from 'react';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

type NotificationsProps = {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onDefinitionClick: (id: string) => void;
};

export default function Notifications({ notifications, setNotifications, onDefinitionClick }: NotificationsProps) {
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const handleDeleteAll = () => {
      setNotifications([]);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
      <Card className="border-0 shadow-none">
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CardTitle className="text-base">Notifications</CardTitle>
              {unreadCount > 0 && <Badge>{unreadCount} New</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                Mark All as Read
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No notifications yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Bookmark definitions for updates.</p>
            </div>
          ) : (
            <div className="space-y-2 p-4 pt-0">
              {notifications.map(notification => (
                <div key={notification.id} className={`flex items-start gap-3 p-3 border rounded-lg ${!notification.read ? 'bg-primary/5' : 'bg-background'}`}>
                  <div className="flex-1">
                    <p 
                        className="font-medium hover:underline cursor-pointer text-sm"
                        onClick={() => onDefinitionClick(notification.definitionId)}
                    >
                        {notification.definitionName}
                    </p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notification.date).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                            Mark Read
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(notification.id)}>
                        <Trash2 className="h-4 w-4" />
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

    