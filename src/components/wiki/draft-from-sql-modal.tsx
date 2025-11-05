
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { draftDefinition, type DraftDefinitionOutput } from '@/ai/flows/draft-definition';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type DraftedDefinition = DraftDefinitionOutput;

type DraftFromSqlModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraft: (draftedData: DraftedDefinition) => void;
};

export default function DraftFromSqlModal({ open, onOpenChange, onDraft }: DraftFromSqlModalProps) {
  const [sqlQuery, setSqlQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDraft = async () => {
    if (!sqlQuery.trim()) {
      toast({
        variant: 'destructive',
        title: 'SQL Query is empty',
        description: 'Please paste a SQL query to draft a definition.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await draftDefinition({ query: sqlQuery });
      onDraft(result);
      setSqlQuery('');
    } catch (error) {
      console.error('Error drafting definition:', error);
      toast({
        variant: 'destructive',
        title: 'Error Drafting Definition',
        description: 'An unexpected error occurred while drafting the definition. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Draft Definition from SQL</DialogTitle>
          <DialogDescription>
            Paste a SQL query below. The AI will analyze it to auto-populate a new definition for you.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="sql-query-textarea">SQL Query</Label>
          <Textarea
            id="sql-query-textarea"
            className="mt-2 font-mono h-80"
            placeholder="SELECT * FROM vw_AuthDecisionDate WHERE ..."
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleDraft} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Drafting...' : 'Draft Definition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
