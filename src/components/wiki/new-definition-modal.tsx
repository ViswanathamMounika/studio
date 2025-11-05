
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Definition, Attachment } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload } from 'lucide-react';
import WysiwygEditor from './wysiwyg-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AttachmentList from './attachments';
import { ScrollArea } from '../ui/scroll-area';
import { DraftedDefinition } from './draft-from-sql-modal';

type NewDefinitionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (definition: Omit<Definition, 'id' | 'revisions' | 'isArchived'>) => void;
  initialData?: Partial<Definition> | DraftedDefinition | null;
};

const modules = ['Authorizations', 'Claims', 'Provider', 'Member', 'Core', 'Member Management', 'Provider Network'];

const initialDefinitionState = {
  name: '',
  module: 'Core',
  keywords: [],
  description: '',
  attachments: [],
};

export default function NewDefinitionModal({ open, onOpenChange, onSave, initialData }: NewDefinitionModalProps) {
  const [name, setName] = useState(initialDefinitionState.name);
  const [module, setModule] = useState(initialDefinitionState.module);
  const [keywords, setKeywords] = useState<string[]>(initialDefinitionState.keywords);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [description, setDescription] = useState(initialDefinitionState.description);
  const [attachments, setAttachments] = useState<Attachment[]>(initialDefinitionState.attachments);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Reset form when modal opens, potentially with initial data from templates
      const data = initialData || initialDefinitionState;
      setName(data.name || initialDefinitionState.name);
      setModule(data.module || initialDefinitionState.module);
      setKeywords(data.keywords || initialDefinitionState.keywords);
      setCurrentKeyword('');
      setDescription(data.description || initialDefinitionState.description);
      setAttachments(data.attachments || initialDefinitionState.attachments);
    }
  }, [open, initialData]);

  const handleSave = () => {
    const newDefinitionData = {
      name,
      module,
      keywords,
      description,
      attachments,
      supportingTables: [], // Defaulting to empty for new definitions
    };
    onSave(newDefinitionData);
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentKeyword) {
      e.preventDefault();
      if (!keywords.includes(currentKeyword.trim())) {
        setKeywords([...keywords, currentKeyword.trim()]);
      }
      setCurrentKeyword('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };
  
  const handleAddAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const newAttachment: Attachment = {
        name: file.name,
        url: URL.createObjectURL(file),
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
      };
      setAttachments([...attachments, newAttachment]);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (name: string) => {
    setAttachments(attachments.filter(att => att.name !== name));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Definition</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6">
            <div className="space-y-6 py-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-def-name">Name</Label>
                      <Input id="new-def-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="new-def-module">Module</Label>
                      <Select value={module} onValueChange={setModule}>
                        <SelectTrigger id="new-def-module">
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((mod) => (
                            <SelectItem key={mod} value={mod}>
                              {mod}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new-def-keywords">Keywords</Label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[40px]">
                      {keywords.map(keyword => (
                        <Badge key={keyword} variant="secondary" className="gap-1">
                          {keyword}
                          <button onClick={() => removeKeyword(keyword)} className="rounded-full hover:bg-muted-foreground/20">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Input
                        id="new-def-keywords"
                        placeholder="Add a keyword and press Enter"
                        value={currentKeyword}
                        onChange={(e) => setCurrentKeyword(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        className="flex-1 border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                  <CardHeader>
                      <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WysiwygEditor value={description} onChange={setDescription} />
                  </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Attachments</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleAddAttachmentClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Add Attachment
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                  />
                </CardHeader>
                <CardContent>
                  <AttachmentList attachments={attachments} onRemove={handleRemoveAttachment} isEditing />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Definition</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
