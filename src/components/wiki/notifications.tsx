
"use client";

import React from 'react';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';

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
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CardTitle>Notifications</CardTitle>
              {unreadCount > 0 && <Badge>{unreadCount} New</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                Mark All as Read
              </Button>
               <Button variant="destructive" onClick={handleDeleteAll} disabled={notifications.length === 0}>
                Clear All
              </Button>
            </div>
          </div>
          <CardDescription>Updates on definitions you have bookmarked.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No notifications yet</h3>
              <p className="text-muted-foreground mt-1">Bookmark definitions to get updates here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div key={notification.id} className={`flex items-start gap-4 p-4 border rounded-lg ${!notification.read ? 'bg-primary/5' : 'bg-background'}`}>
                  <div className="flex-1">
                    <p 
                        className="font-medium hover:underline cursor-pointer"
                        onClick={() => onDefinitionClick(notification.definitionId)}
                    >
                        {notification.definitionName}
                    </p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notification.date).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                            Mark as Read
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(notification.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
