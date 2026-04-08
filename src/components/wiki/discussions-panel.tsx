'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, XCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscussionMessage } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

type DiscussionsPanelProps = {
  discussions: DiscussionMessage[];
  definitionName: string;
};

export default function DiscussionList({ discussions, definitionName }: DiscussionsPanelProps) {
  if (discussions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
          <MessageSquare className="h-6 w-6 text-slate-200" />
        </div>
        <p className="text-sm font-medium text-slate-400 italic">No previous review history for this definition.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {discussions.map((msg) => (
        <div key={msg.id} className="flex gap-4 group/msg">
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white">
            <AvatarImage src={msg.avatar} alt={msg.author} />
            <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">{msg.author.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{msg.author}</span>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-[11px] font-medium text-slate-400">{formatDistanceToNow(new Date(msg.date), { addSuffix: true })}</span>
            </div>

            {(msg.type === 'change-request' || msg.type === 'rejection') ? (
              <div className={cn(
                "p-4 border rounded-2xl space-y-3 shadow-sm transition-all",
                msg.type === 'rejection' ? "bg-red-50/30 border-red-100" : "bg-amber-50/30 border-amber-100"
              )}>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border rounded-lg text-[9px] font-black uppercase tracking-wider",
                  msg.type === 'rejection' ? "text-red-600 border-red-200" : "text-amber-600 border-amber-200"
                )}>
                  {msg.type === 'rejection' ? <XCircle className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                  {msg.type === 'rejection' ? 'Rejected Submission' : 'Change Request Issued'}
                </div>
                
                <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                  {msg.content}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group-hover/msg:border-slate-300 transition-colors">
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  {msg.content}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
