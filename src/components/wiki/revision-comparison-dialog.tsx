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
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

type RevisionComparisonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision1: Revision;
  revision2: Revision;
  currentDefinitionName: string;
};

const dmp = new diff_match_patch();

function createHtml(diffs: Diff[]) {
    let html = '';
    for (const [op, text] of diffs) {
        switch (op) {
            case 0: // No change
                html += text;
                break;
            case -1: // Deletion
                html += `<del class="bg-red-200/50 text-red-900">${text}</del>`;
                break;
            case 1: // Insertion
                html += `<ins class="bg-green-200/50 text-green-900 no-underline">${text}</ins>`;
                break;
        }
    }
    return html;
}

function DiffView({ title, text1, text2 }: { title: string; text1: string; text2: string }) {
    const diffs1_2 = dmp.diff_main(text1, text2);
    dmp.diff_cleanupSemantic(diffs1_2);

    const diffs2_1 = dmp.diff_main(text2, text1);
    dmp.diff_cleanupSemantic(diffs2_1);
  
    // For revA (left side), we show deletions from revB's perspective
    const html1 = createHtml(diffs2_1.map(d => [d[0] === 1 ? -1 : (d[0] === -1 ? 1 : 0), d[1]] as Diff));
    
    // For revB (right side), we show insertions from revA's perspective
    const html2 = createHtml(diffs1_2);
  
    if (text1 === text2) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-lg">{title}</h4>
        <div className="grid grid-cols-2 gap-4">
            <div 
              className="prose prose-sm max-w-none border rounded-md p-4"
              dangerouslySetInnerHTML={{ __html: html1 || '<p class="text-muted-foreground">No content</p>' }}
            />
            <div 
              className="prose prose-sm max-w-none border rounded-md p-4"
              dangerouslySetInnerHTML={{ __html: html2 || '<p class="text-muted-foreground">No content</p>' }}
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