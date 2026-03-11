'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Pencil, Trash2, Save, Upload, Plus, X, ListTodo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Template, Attachment, TemplateSection } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import dynamic from 'next/dynamic';
import AttachmentList from './attachments';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

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
    defaultAttachments: [],
    customSections: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      defaultAttachments: [],
      customSections: [],
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
      setCurrentTemplate(prev => ({
        ...prev,
        defaultAttachments: [...(prev.defaultAttachments || []), newAttachment]
      }));
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (name: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      defaultAttachments: (prev.defaultAttachments || []).filter(att => att.name !== name)
    }));
  };

  const handleAddCustomSection = () => {
    const newSection: TemplateSection = {
      id: `sec-${Date.now()}`,
      name: '',
      isMandatory: false,
      defaultValue: '',
    };
    setCurrentTemplate(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), newSection]
    }));
  };

  const handleUpdateCustomSection = (id: string, updates: Partial<TemplateSection>) => {
    setCurrentTemplate(prev => ({
      ...prev,
      customSections: (prev.customSections || []).map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const handleRemoveCustomSection = (id: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      customSections: (prev.customSections || []).filter(s => s.id !== id)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Management</h1>
          <p className="text-muted-foreground">Define default boilerplate and custom structured sections for standard definitions.</p>
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
                <div className="border-b pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Standard Section Defaults</h3>
                    <p className="text-sm text-muted-foreground">Pre-populate the standard definition fields with boilerplate text.</p>
                  </div>
                </div>

                <div className="space-y-6">
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

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between py-3 bg-muted/30">
                      <CardTitle className="text-base">Default Attachments</CardTitle>
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
                    <CardContent className="pt-4">
                      <AttachmentList 
                        attachments={currentTemplate.defaultAttachments || []} 
                        onRemove={handleRemoveAttachment} 
                        isEditing 
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Custom Dynamic Sections</h3>
                    <p className="text-sm text-muted-foreground">Add specific building blocks that will be part of every definition using this template.</p>
                  </div>
                  <Button variant="outline" onClick={handleAddCustomSection}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Section
                  </Button>
                </div>

                <div className="space-y-4">
                  {(currentTemplate.customSections || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                      <ListTodo className="h-12 w-12 mb-4 opacity-20" />
                      <p>No custom sections defined. Create a "Custom Template" by adding sections here.</p>
                    </div>
                  ) : (
                    currentTemplate.customSections?.map((section, idx) => (
                      <Card key={section.id} className="border-l-4 border-l-primary">
                        <CardHeader className="py-3 bg-primary/5 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <Input 
                              value={section.name} 
                              onChange={e => handleUpdateCustomSection(section.id, { name: e.target.value })}
                              placeholder="Section Name (e.g., Clinical Business Rules)"
                              className="max-w-md h-8"
                            />
                            <div className="flex items-center space-x-2 ml-4">
                              <Checkbox 
                                id={`mand-${section.id}`} 
                                checked={section.isMandatory} 
                                onCheckedChange={v => handleUpdateCustomSection(section.id, { isMandatory: !!v })}
                              />
                              <Label htmlFor={`mand-${section.id}`} className="text-xs font-medium cursor-pointer">Required Section</Label>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveCustomSection(section.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <Label className="text-xs text-muted-foreground mb-2 block">Default Section Boilerplate</Label>
                          <WysiwygEditor 
                            value={section.defaultValue || ''} 
                            onChange={val => handleUpdateCustomSection(section.id, { defaultValue: val })}
                            placeholder="Boilerplate text for this section..."
                          />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
