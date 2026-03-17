"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { type Revision, type Definition } from "@/lib/types";
import diff_match_patch, { type Diff } from 'diff-match-patch';
import { Separator } from "../ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Info, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/button";

type RevisionComparisonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision1: Revision;
  revision2: Revision;
  definition: Definition;
};

const dmp = new diff_match_patch();

function createDiffHtml(diffs: Diff[], type: 'insertion' | 'deletion'): string {
    let html = '';
    for (const [op, text] of diffs) {
        switch (op) {
            case 0: // No change
                html += text;
                break;
            case 1: // Insertion
                if (type === 'insertion') {
                    html += `<ins class="bg-green-200/50 text-green-900 no-underline">${text}</ins>`;
                }
                break;
            case -1: // Deletion
                if (type === 'deletion') {
                    html += `<del class="bg-red-200/50 text-red-900">${text}</del>`;
                }
                break;
        }
    }
    return html.replace(/<ins><\/ins>/g, '').replace(/<del><\/del>/g, '');
}

export default function RevisionComparisonDialog({
  open,
  onOpenChange,
  revision1,
  revision2,
  definition
}: RevisionComparisonDialogProps) {
    // Sort selected revisions chronologically
    const [revA, revB] = [revision1, revision2].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Find the revision ranks (indices in the full history)
    const sortedHistory = [...definition.revisions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const rankA = sortedHistory.findIndex(r => r.ticketId === revA.ticketId) + 1;
    const rankB = sortedHistory.findIndex(r => r.ticketId === revB.ticketId) + 1;

    const [scrollMode, setScrollMode] = useState<'sync' | 'independent'>('sync');
    
    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);
    const isSyncingRef = useRef(false);

    const snapshotA = revA.snapshot;
    const snapshotB = revB.snapshot;

    const handleScroll = (source: 'left' | 'right') => {
        if (scrollMode !== 'sync' || isSyncingRef.current) return;

        const sourceEl = source === 'left' ? leftScrollRef.current : rightScrollRef.current;
        const targetEl = source === 'left' ? rightScrollRef.current : leftScrollRef.current;

        if (sourceEl && targetEl) {
            isSyncingRef.current = true;
            targetEl.scrollTop = sourceEl.scrollTop;
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 50);
        }
    };

    const diffs = {
        description: dmp.diff_main(snapshotA.description, snapshotB.description),
        technical: dmp.diff_main(snapshotA.technicalDetails || '', snapshotB.technicalDetails || ''),
        usage: dmp.diff_main(snapshotA.usageExamples || '', snapshotB.usageExamples || '')
    };

    Object.values(diffs).forEach(d => dmp.diff_cleanupSemantic(d));

    const formatDateString = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "MM/dd/yyyy");
        } catch (e) {
            return dateStr;
        }
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-background sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Compare Revisions for : {definition.name}
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </DialogTitle>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 bg-muted/30 px-3 py-1.5 rounded-lg border">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scroll Mode:</span>
                    <RadioGroup 
                        value={scrollMode} 
                        onValueChange={(val) => setScrollMode(val as 'sync' | 'independent')}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sync" id="sync" className="h-3.5 w-3.5" />
                            <Label htmlFor="sync" className="cursor-pointer text-sm font-medium">Simultaneous</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="independent" id="independent" className="h-3.5 w-3.5" />
                            <Label htmlFor="independent" className="cursor-pointer text-sm font-medium">Independent</Label>
                        </div>
                    </RadioGroup>
                </div>
                
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close comparison</span>
                    </Button>
                </DialogClose>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 grid grid-cols-2">
            {/* Left Panel - Revision A */}
            <div className="flex flex-col border-r bg-slate-50/30 overflow-hidden">
                <div className="px-6 py-4 border-b bg-muted/40">
                    <h3 className="font-bold text-base leading-tight">Revision: MPM-{rankA}</h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                        {formatDateString(revA.date)} by {revA.developer}
                    </p>
                </div>
                <div 
                    ref={leftScrollRef}
                    onScroll={() => handleScroll('left')}
                    className="flex-1 overflow-y-auto p-6 space-y-8"
                >
                    <section>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Description</h4>
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded-md border shadow-sm" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.description, 'deletion') || '<p class="italic text-muted-foreground">No content</p>' }} />
                    </section>
                    <section>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Technical Details</h4>
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded-md border shadow-sm" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.technical, 'deletion') || '<p class="italic text-muted-foreground">No content</p>' }} />
                    </section>
                    <section>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Usage Examples</h4>
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded-md border shadow-sm" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.usage, 'deletion') || '<p class="italic text-muted-foreground">No content</p>' }} />
                    </section>
                </div>
            </div>

            {/* Right Panel - Revision B */}
            <div className="flex flex-col bg-slate-50/30 overflow-hidden">
                <div className="px-6 py-4 border-b bg-muted/40">
                    <h3 className="font-bold text-base leading-tight">Revision: MPM-{rankB}</h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                        {formatDateString(revB.date)} by {revB.developer}
                    </p>
                </div>
                <div 
                    ref={rightScrollRef}
                    onScroll={() => handleScroll('right')}
                    className="flex-1 overflow-y-auto p-6 space-y-8"
                >
                    <section>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Description</h4>
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded-md border shadow-sm" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.description, 'insertion') || '<p class="italic text-muted-foreground">No content</p>' }} />
                    </section>
                    <section>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Technical Details</h4>
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded-md border shadow-sm" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.technical, 'insertion') || '<p class="italic text-muted-foreground">No content</p>' }} />
                    </section>
                    <section>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Usage Examples</h4>
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded-md border shadow-sm" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.usage, 'insertion') || '<p class="italic text-muted-foreground">No content</p>' }} />
                    </section>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
