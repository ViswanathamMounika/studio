'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscussionMessage } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

type DiscussionsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discussions: DiscussionMessage[];
  definitionName: string;
  onAddReply: (content: string) => void;
};

export default function DiscussionsPanel({ open, onOpenChange, discussions, definitionName, onAddReply }: DiscussionsPanelProps) {
  const [reply, setReply] = useState('');

  const handleSendReply = () => {
    if (!reply.trim()) return;
    onAddReply(reply);
    setReply('');
  };

  const openThreadCount = discussions.filter(d => d.type === 'change-request').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-slate-50/50">
        <SheetHeader className="p-6 bg-white border-b shadow-sm">
          <SheetTitle className="text-xl font-bold">Change Requests</SheetTitle>
          <SheetDescription className="text-sm">
            {openThreadCount} open thread{openThreadCount !== 1 ? 's' : ''} · {definitionName}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-8">
            <div className="relative flex justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-slate-50 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</span>
            </div>

            {discussions.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={msg.avatar} alt={msg.author} />
                  <AvatarFallback>{msg.author.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">{msg.author}</span>
                    <span className="text-[11px] text-slate-400">{formatDistanceToNow(new Date(msg.date), { addSuffix: true })}</span>
                    {msg.round && (
                      <Badge variant="secondary" className="h-5 px-2 bg-pink-50 text-pink-600 border-pink-100 text-[10px] font-bold">
                        Round {msg.round}
                      </Badge>
                    )}
                  </div>

                  {msg.type === 'change-request' ? (
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3 shadow-sm">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-amber-200 rounded-lg text-[10px] font-bold text-amber-600 uppercase">
                        <RefreshCw className="h-3 w-3" />
                        Change Request
                      </div>
                      
                      {msg.priority && (
                        <p className="text-sm">
                          <span className="font-bold text-slate-800">Priority: </span>
                          <span className={cn(
                            "font-bold",
                            msg.priority === 'High' ? "text-red-600" : msg.priority === 'Medium' ? "text-amber-600" : "text-green-600"
                          )}>{msg.priority}</span>
                        </p>
                      )}
                      
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-6 bg-white border-t mt-auto shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
          <div className="relative bg-slate-50 border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Textarea
              placeholder="Reply or add a comment..."
              className="min-h-[80px] border-none shadow-none focus-visible:ring-0 bg-transparent resize-none text-sm placeholder:text-slate-400"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
            />
            <div className="flex justify-end pr-1 pb-1">
              <Button 
                size="icon" 
                className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90" 
                disabled={!reply.trim()}
                onClick={handleSendReply}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
