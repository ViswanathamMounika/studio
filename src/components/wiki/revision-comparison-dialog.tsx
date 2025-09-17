"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type Revision } from "@/lib/types";
import diff_match_patch, { type Diff } from 'diff-match-patch';
import { Badge } from "../ui/badge";

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
                html += `<del class="bg-red-200/50">${text}</del>`;
                break;
            case 1: // Insertion
                html += `<ins class="bg-green-200/50 no-underline">${text}</ins>`;
                break;
        }
    }
    return html;
}


function DiffView({ title, text1, text2 }: { title: string; text1: string; text2: string }) {
    const diff = dmp.diff_main(text1, text2);
    dmp.diff_cleanupSemantic(diff);
    const html = createHtml(diff);
  
    return (
      <div>
        <h4 className="font-semibold text-lg mb-2">{title}</h4>
        <div 
          className="prose prose-sm max-w-none border rounded-md p-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
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
      <DialogContent className="max-w-6xl w-full h-[90vh]">
        <DialogHeader>
          <DialogTitle>Compare Revisions for: {currentDefinitionName}</DialogTitle>
          <DialogDescription>
            Showing differences between {revA.ticketId} ({revA.date}) and {revB.ticketId} ({revB.date}).
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full w-full">
            <div className="grid grid-cols-2 gap-x-6 p-1">
                {/* Headers */}
                <div className="sticky top-0 bg-background pb-2">
                    <h3 className="font-bold text-xl">
                        Revision: {revA.ticketId}
                    </h3>
                    <p className="text-sm text-muted-foreground">{revA.date} by {revA.developer}</p>
                </div>
                <div className="sticky top-0 bg-background pb-2">
                    <h3 className="font-bold text-xl">
                        Revision: {revB.ticketId}
                    </h3>
                    <p className="text-sm text-muted-foreground">{revB.date} by {revB.developer}</p>
                </div>

                {/* Name */}
                <div><h4 className="font-semibold text-lg mb-2">Name</h4><p>{snapshotA.name}</p></div>
                <div><h4 className="font-semibold text-lg mb-2">Name</h4><p>{snapshotB.name}</p></div>
                <div className="col-span-2"><Separator className="my-4" /></div>

                {/* Keywords */}
                <div>
                    <h4 className="font-semibold text-lg mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                        {snapshotA.keywords.map(k => <Badge key={k} variant="secondary">{k}</Badge>)}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-lg mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                        {snapshotB.keywords.map(k => {
                            const isNew = !snapshotA.keywords.includes(k);
                            return <Badge key={k} variant={isNew ? "success" : "secondary"}>{k}</Badge>
                        })}
                    </div>
                </div>

                 <div className="col-span-2"><Separator className="my-4" /></div>

                {/* Diffs */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Description</h4>
                    <div className="prose prose-sm max-w-none border rounded-md p-4" dangerouslySetInnerHTML={{ __html: snapshotA.description }} />
                    <h4 className="font-semibold text-lg">Technical Details</h4>
                    <div className="prose prose-sm max-w-none border rounded-md p-4" dangerouslySetInnerHTML={{ __html: snapshotA.technicalDetails }} />
                    <h4 className="font-semibold text-lg">Examples</h4>
                    <div className="prose prose-sm max-w-none border rounded-md p-4" dangerouslySetInnerHTML={{ __html: snapshotA.examples }} />
                    <h4 className="font-semibold text-lg">Usage</h4>
                    <div className="prose prose-sm max-w-none border rounded-md p-4" dangerouslySetInnerHTML={{ __html: snapshotA.usage }} />
                </div>
                <div className="space-y-4">
                    <DiffView title="Description" text1={snapshotA.description} text2={snapshotB.description} />
                    <DiffView title="Technical Details" text1={snapshotA.technicalDetails} text2={snapshotB.technicalDetails} />
                    <DiffView title="Examples" text1={snapshotA.examples} text2={snapshotB.examples} />
                    <DiffView title="Usage" text1={snapshotA.usage} text2={snapshotB.usage} />
                </div>

            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
