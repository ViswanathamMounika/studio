"use client";

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
        if (op === 0) { // No change
            html += text;
        } else if (op === 1 && type === 'insertion') { // Insertion
            html += `<ins class="bg-green-200/50 text-green-900 no-underline">${text}</ins>`;
        } else if (op === -1 && type === 'deletion') { // Deletion
            html += `<del class="bg-red-200/50 text-red-900">${text}</del>`;
        } else if (op === 1 && type === 'deletion') {
            // Treat insertions as neutral on the deletion side
             html += text;
        } else if (op === -1 && type === 'insertion') {
            // Treat deletions as neutral on the insertion side
            html += text;
        }
    }
    return html.replace(/<ins><\/ins>/g, '').replace(/<del><\/del>/g, '');
}


function DiffView({ title, text1, text2 }: { title: string; text1: string; text2: string }) {
    if (text1 === text2) return null;
    
    const diffs = dmp.diff_main(text1, text2);
    dmp.diff_cleanupSemantic(diffs);

    const deletionHtml = createDiffHtml(diffs, 'deletion');
    const insertionHtml = createDiffHtml(diffs, 'insertion');

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-lg">{title}</h4>
        <div className="grid grid-cols-2 gap-4">
            <div 
              className="prose prose-sm max-w-none border rounded-md p-4"
              dangerouslySetInnerHTML={{ __html: deletionHtml || '<p class="text-muted-foreground">No content</p>' }}
            />
            <div 
              className="prose prose-sm max-w-none border rounded-md p-4"
              dangerouslySetInnerHTML={{ __html: insertionHtml || '<p class="text-muted-foreground">No content</p>' }}
            />
        </div>
      </div>
    );
}

export default function RevisionComparisonDialog({
  open,
  onOpenChange,
  revision1,
  revision2,
  currentDefinitionName
}: RevisionComparisonDialogProps) {
    const [revA, revB] = [revision1, revision2].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const snapshotA = revA.snapshot;
    const snapshotB = revB.snapshot;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compare Revisions for: {currentDefinitionName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6">
            <div className="space-y-4">
              {/* Headers */}
              <div className="grid grid-cols-2 gap-x-6 p-1">
                  <div>
                      <h3 className="font-bold text-xl">
                          Revision: {revA.ticketId}
                      </h3>
                      <p className="text-sm text-muted-foreground">{revA.date} by {revA.developer}</p>
                  </div>
                  <div>
                      <h3 className="font-bold text-xl">
                          Revision: {revB.ticketId}
                      </h3>
                      <p className="text-sm text-muted-foreground">{revB.date} by {revB.developer}</p>
                  </div>
              </div>
              <Separator />
              <DiffView title="Description" text1={snapshotA.description} text2={snapshotB.description} />
              <DiffView title="Technical Details" text1={snapshotA.technicalDetails} text2={snapshotB.technicalDetails} />
              <DiffView title="Examples" text1={snapshotA.examples} text2={snapshotB.examples} />
              <DiffView title="Usage" text1={snapshotA.usage} text2={snapshotB.usage} />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
