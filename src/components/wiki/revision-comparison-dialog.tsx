
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Info, X, History } from "lucide-react";
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
                    html += `<ins class="bg-green-200/50 text-green-900 no-underline font-bold">${text}</ins>`;
                }
                break;
            case -1: // Deletion
                if (type === 'deletion') {
                    html += `<del class="bg-red-200/50 text-red-900 no-underline">${text}</del>`;
                }
                break;
        }
    }
    return html;
}

export default function RevisionComparisonDialog({
  open,
  onOpenChange,
  revision1,
  revision2,
  definition
}: RevisionComparisonDialogProps) {
    const isConflictMode = revision1.ticketId === 'DRAFT' || revision2.ticketId === 'DRAFT';
    
    // Sort chronologically if not in conflict mode
    const [revA, revB] = isConflictMode 
        ? [revision2, revision1] // Show Live on Left, Draft on Right
        : [revision1, revision2].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const [scrollMode, setScrollMode] = useState<'sync' | 'independent'>('sync');
    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);
    const isSyncingRef = useRef(false);

    const handleScroll = (source: 'left' | 'right') => {
        if (scrollMode !== 'sync' || isSyncingRef.current) return;
        const sourceEl = source === 'left' ? leftScrollRef.current : rightScrollRef.current;
        const targetEl = source === 'left' ? rightScrollRef.current : leftScrollRef.current;
        if (sourceEl && targetEl) {
            isSyncingRef.current = true;
            targetEl.scrollTop = sourceEl.scrollTop;
            setTimeout(() => { isSyncingRef.current = false; }, 50);
        }
    };

    const diffs = {
        description: dmp.diff_main(revA.snapshot.description || '', revB.snapshot.description || ''),
        shortDesc: dmp.diff_main(revA.snapshot.shortDescription || '', revB.snapshot.shortDescription || ''),
        technical: dmp.diff_main(revA.snapshot.technicalDetails || '', revB.snapshot.technicalDetails || '')
    };

    Object.values(diffs).forEach(d => dmp.diff_cleanupSemantic(d));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 border-b bg-white sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {isConflictMode ? `Merge Review: ${definition.name}` : `Comparison: ${definition.name}`}
              <History className="h-4 w-4 text-muted-foreground" />
            </DialogTitle>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 bg-muted/30 px-3 py-1.5 rounded-lg border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sync Scrolling:</span>
                    <RadioGroup 
                        value={scrollMode} 
                        onValueChange={(val) => setScrollMode(val as 'sync' | 'independent')}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sync" id="sync" className="h-3.5 w-3.5" />
                            <Label htmlFor="sync" className="text-xs font-bold cursor-pointer">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="independent" id="independent" className="h-3.5 w-3.5" />
                            <Label htmlFor="independent" className="text-xs font-bold cursor-pointer">Off</Label>
                        </div>
                    </RadioGroup>
                </div>
                <DialogClose asChild><Button variant="ghost" size="icon" className="rounded-full"><X className="h-5 w-5" /></Button></DialogClose>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 grid grid-cols-2">
            {/* Left Panel */}
            <div className="flex flex-col border-r bg-slate-50/30 overflow-hidden">
                <div className="px-6 py-4 border-b bg-white shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">{revA.description}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">By {revA.developer} • {revA.date}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase font-black text-red-600 bg-red-50 border-red-100">Removals</Badge>
                </div>
                <div ref={leftScrollRef} onScroll={() => handleScroll('left')} className="flex-1 overflow-y-auto p-8 space-y-10">
                    <section>
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Description</h4>
                        <div className="prose prose-sm max-w-none bg-white p-6 rounded-2xl border shadow-sm text-slate-700" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.description, 'deletion') || '<p class="italic">Empty</p>' }} />
                    </section>
                    <section>
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Short Description</h4>
                        <div className="prose prose-sm max-w-none bg-white p-6 rounded-2xl border shadow-sm text-slate-700" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.shortDesc, 'deletion') || 'Empty' }} />
                    </section>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex flex-col bg-slate-50/30 overflow-hidden">
                <div className="px-6 py-4 border-b bg-white shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">{revB.description}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">By {revB.developer} • {revB.date}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase font-black text-emerald-600 bg-emerald-50 border-emerald-100">Additions</Badge>
                </div>
                <div ref={rightScrollRef} onScroll={() => handleScroll('right')} className="flex-1 overflow-y-auto p-8 space-y-10">
                    <section>
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Description</h4>
                        <div className="prose prose-sm max-w-none bg-white p-6 rounded-2xl border shadow-sm text-slate-700" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.description, 'insertion') || '<p class="italic">Empty</p>' }} />
                    </section>
                    <section>
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Short Description</h4>
                        <div className="prose prose-sm max-w-none bg-white p-6 rounded-2xl border shadow-sm text-slate-700" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.shortDesc, 'insertion') || 'Empty' }} />
                    </section>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
