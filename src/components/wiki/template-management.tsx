'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Pencil, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import dynamic from 'next/dynamic';

const WysiwygEditor = dynamic(() => import('./wysiwyg-editor'), { ssr: false });

type TemplateManagementProps = {
  templates: Template[];
  onSaveTemplates: (templates: Template[]) => void;
};

export default function TemplateManagement({ templates, onSaveTemplates }: TemplateManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    status: 'Active',
    defaultShortDescription: '',
    defaultDescription: '',
    defaultTechnicalDetails: '',
    defaultUsageExamples: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => a.name.localeCompare(b.name));
  }, [templates]);

  const handleCreateNew = () => {
    setIsEditing(false);
    setCurrentTemplate({
      id: `t-${Date.now()}`,
      name: '',
      description: '',
      status: 'Active',
      defaultShortDescription: '',
      defaultDescription: '',
      defaultTechnicalDetails: '',
      defaultUsageExamples: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (template: Template) => {
    setIsEditing(true);
    setCurrentTemplate({ ...template });
    setIsModalOpen(true);
  };

  const handleDeactivate = (id: string) => {
    const updated = templates.map(t => t.id === id ? { ...t, status: 'Inactive' as const } : t);
    onSaveTemplates(updated);
    toast({ title: 'Template Deactivated', description: 'The template is now inactive.' });
  };

  const handleSaveTemplate = () => {
    if (!currentTemplate.name?.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Template Name is required.' });
      return;
    }

    const templateToSave = currentTemplate as Template;
    let updatedTemplates: Template[];

    if (isEditing) {
      updatedTemplates = templates.map(t => t.id === templateToSave.id ? templateToSave : t);
      toast({ title: 'Template Updated', description: 'Changes saved successfully.' });
    } else {
      updatedTemplates = [...templates, templateToSave];
      toast({ title: 'Template Created', description: 'New template has been added.' });
    }

    onSaveTemplates(updatedTemplates);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Management</h1>
          <p className="text-muted-foreground">Define default boilerplate content for standard definition sections.</p>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant={template.status === 'Active' ? 'success' : 'secondary'}>
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{template.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeactivate(template.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b bg-background sticky top-0 z-50 flex justify-between items-center shadow-sm">
            <DialogHeader className="p-0">
              <DialogTitle className="text-2xl font-bold">
                {isEditing ? 'Edit Template Blueprint' : 'Create New Template Blueprint'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveTemplate}>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Template Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="t-name">Template Name <span className="text-destructive">*</span></Label>
                      <Input 
                        id="t-name" 
                        value={currentTemplate.name} 
                        onChange={e => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Clinical Guideline Template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="t-status">Status</Label>
                      <Select 
                        value={currentTemplate.status} 
                        onValueChange={v => setCurrentTemplate(prev => ({ ...prev, status: v as any }))}
                      >
                        <SelectTrigger id="t-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-desc">Template Description</Label>
                    <Textarea 
                      id="t-desc" 
                      value={currentTemplate.description} 
                      onChange={e => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Briefly describe what this structure is intended for..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold">Standard Section Defaults</h3>
                  <p className="text-sm text-muted-foreground">Pre-populate the standard definition fields with boilerplate text.</p>
                </div>

                <div className="space-y-6">
                  {/* Short Description Default */}
                  <Card>
                    <CardHeader className="py-3 bg-muted/30">
                      <CardTitle className="text-base">Short Description Default</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Textarea 
                        value={currentTemplate.defaultShortDescription} 
                        onChange={e => setCurrentTemplate(prev => ({ ...prev, defaultShortDescription: e.target.value }))}
                        placeholder="Enter boilerplate for Short Description..."
                      />
                    </CardContent>
                  </Card>

                  {/* Long Description Default */}
                  <Card>
                    <CardHeader className="py-3 bg-muted/30">
                      <CardTitle className="text-base">Long Description Default</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <WysiwygEditor 
                        value={currentTemplate.defaultDescription || ''} 
                        onChange={(content) => setCurrentTemplate(prev => ({ ...prev, defaultDescription: content }))} 
                        placeholder="Enter boilerplate for the main Description..."
                      />
                    </CardContent>
                  </Card>

                  {/* Technical Details Default */}
                  <Card>
                    <CardHeader className="py-3 bg-muted/30">
                      <CardTitle className="text-base">Technical Details Default</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <WysiwygEditor 
                        value={currentTemplate.defaultTechnicalDetails || ''} 
                        onChange={(content) => setCurrentTemplate(prev => ({ ...prev, defaultTechnicalDetails: content }))} 
                        placeholder="Enter boilerplate for Technical Details..."
                      />
                    </CardContent>
                  </Card>

                  {/* Usage Examples Default */}
                  <Card>
                    <CardHeader className="py-3 bg-muted/30">
                      <CardTitle className="text-base">Usage Examples / SQL View Default</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <WysiwygEditor 
                        value={currentTemplate.defaultUsageExamples || ''} 
                        onChange={(content) => setCurrentTemplate(prev => ({ ...prev, defaultUsageExamples: content }))} 
                        placeholder="Enter boilerplate for Usage Examples..."
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
