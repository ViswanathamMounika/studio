'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Pencil, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChangeRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: { content: string; priority?: 'Low' | 'Medium' | 'High' }) => void;
  definitionName: string;
  title?: string;
  description?: string;
  showPriority?: boolean;
  buttonText?: string;
  isRejection?: boolean;
};

export default function ChangeRequestModal({ 
  open, 
  onOpenChange, 
  onSend, 
  definitionName,
  title = "Request Changes",
  description = "Describe what needs to be updated. The definition owner will be notified.",
  showPriority = true,
  buttonText = "Send Request",
  isRejection = false
}: ChangeRequestModalProps) {
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  useEffect(() => {
    if (open) {
      setContent('');
      setPriority('Medium');
    }
  }, [open]);

  const handleSend = () => {
    if (!content.trim()) return;
    onSend({ 
      content, 
      priority: showPriority ? priority : undefined 
    });
    onOpenChange(false);
  };

  const priorities = [
    { label: 'Low', value: 'Low' as const, color: 'bg-emerald-400' },
    { label: 'Medium', value: 'Medium' as const, color: 'bg-amber-400' },
    { label: 'High', value: 'High' as const, color: 'bg-red-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-0 overflow-hidden border-none rounded-[24px]">
        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-4">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              isRejection ? "bg-red-50" : "bg-amber-50"
            )}>
              {isRejection ? (
                <XCircle className="h-6 w-6 text-red-500" fill="currentColor" fillOpacity={0.2} />
              ) : (
                <Pencil className="h-6 w-6 text-orange-400" fill="currentColor" fillOpacity={0.2} />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold font-serif tracking-tight text-slate-900">{title}</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm mt-1">
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="feedback" className="text-[13px] font-bold text-slate-600">
                {isRejection ? "Reason for Rejection" : "What needs to change?"} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="feedback"
                placeholder={isRejection ? "e.g. This definition overlaps significantly with existing Provider Master documentation..." : "e.g. The technical details section is missing the mapping table..."}
                className="min-h-[140px] bg-slate-50/50 border-slate-200 rounded-xl resize-none placeholder:text-slate-400 text-sm focus-visible:ring-primary/20"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {showPriority && (
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-600">Priority</Label>
                <div className="grid grid-cols-3 gap-3">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all",
                        priority === p.value 
                          ? "bg-white border-primary ring-1 ring-primary text-slate-900 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", p.color)} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/30 border-t flex items-center justify-end gap-3 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-6 border-slate-200 text-slate-600 hover:bg-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!content.trim()} 
            className={cn(
              "rounded-xl px-6 gap-2",
              isRejection ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            <Send className="h-4 w-4" />
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
