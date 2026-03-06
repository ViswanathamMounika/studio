
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Revision } from "@/lib/types";
import diff_match_patch, { type Diff } from 'diff-match-patch';
import { Separator } from "../ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type RevisionComparisonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision1: Revision;
  revision2: Revision;
  currentDefinitionName: string;
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
  currentDefinitionName
}: RevisionComparisonDialogProps) {
    const [revA, revB] = [revision1, revision2].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
            // Timeout to prevent infinite feedback loops between the two listeners
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Compare Revisions: {currentDefinitionName}</DialogTitle>
            <div className="flex items-center gap-4 bg-muted/50 px-4 py-2 rounded-lg border">
                <span className="text-sm font-medium">Scroll Mode:</span>
                <RadioGroup 
                    value={scrollMode} 
                    onValueChange={(val) => setScrollMode(val as 'sync' | 'independent')}
                    className="flex items-center gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sync" id="sync" />
                        <Label htmlFor="sync" className="cursor-pointer">Simultaneous</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="independent" id="independent" />
                        <Label htmlFor="independent" className="cursor-pointer">Independent</Label>
                    </div>
                </RadioGroup>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-x-6">
            {/* Left Panel - Revision A */}
            <div className="flex flex-col border rounded-lg bg-background overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-bold text-lg">Revision: {revA.ticketId}</h3>
                    <p className="text-xs text-muted-foreground">{revA.date} by {revA.developer}</p>
                </div>
                <div 
                    ref={leftScrollRef}
                    onScroll={() => handleScroll('left')}
                    className="flex-1 overflow-y-auto p-6 space-y-8"
                >
                    <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Description</h4>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.description, 'deletion') || 'No content' }} />
                    </section>
                    <Separator />
                    <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Technical Details</h4>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.technical, 'deletion') || 'No content' }} />
                    </section>
                    <Separator />
                    <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Usage Examples</h4>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.usage, 'deletion') || 'No content' }} />
                    </section>
                </div>
            </div>

            {/* Right Panel - Revision B */}
            <div className="flex flex-col border rounded-lg bg-background overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-bold text-lg">Revision: {revB.ticketId}</h3>
                    <p className="text-xs text-muted-foreground">{revB.date} by {revB.developer}</p>
                </div>
                <div 
                    ref={rightScrollRef}
                    onScroll={() => handleScroll('right')}
                    className="flex-1 overflow-y-auto p-6 space-y-8"
                >
                    <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Description</h4>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.description, 'insertion') || 'No content' }} />
                    </section>
                    <Separator />
                    <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Technical Details</h4>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.technical, 'insertion') || 'No content' }} />
                    </section>
                    <Separator />
                    <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Usage Examples</h4>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: createDiffHtml(diffs.usage, 'insertion') || 'No content' }} />
                    </section>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
