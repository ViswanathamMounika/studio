'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Save, Upload, Plus, X, ListTodo, Layout, LayoutTemplate, Type, FileType, List, AlignLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Template, Attachment, TemplateSection, TemplateType } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import AttachmentList from './attachments';

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
    type: 'Custom',
    defaultShortDescription: '',
    defaultDescription: '',
    defaultTechnicalDetails: '',
    defaultUsageExamples: '',
    defaultAttachments: [],
    customSections: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showErrors, setShowErrors] = useState(false); // Track if validation should be shown
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => a.name.localeCompare(b.name));
  }, [templates]);

  const handleCreateNew = (type: TemplateType) => {
    setIsEditing(false);
    setShowErrors(false); // Reset errors on new
    setCurrentTemplate({
      id: `t-${Date.now()}`,
      name: '',
      type: type,
      description: '',
      status: 'Active',
      defaultShortDescription: '',
      defaultDescription: '',
      defaultTechnicalDetails: '',
      defaultUsageExamples: '',
      defaultAttachments: [],
      customSections: [{
        id: `sec-${Date.now()}`,
        name: '',
        description: '',
        isMandatory: false,
        defaultValue: '',
        contentType: 'rich',
      }],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (template: Template) => {
    setIsEditing(true);
    setShowErrors(false); // Reset errors on edit
    setCurrentTemplate({ ...template });
    setIsModalOpen(true);
  };

  const handleDeactivate = (id: string) => {
    const updated = templates.map(t => t.id === id ? { ...t, status: 'Inactive' as const } : t);
    onSaveTemplates(updated);
    toast({ title: 'Template Deactivated', description: 'The template is now inactive.' });
  };

  const handleSaveTemplate = () => {
    // Validate Template Name
    if (!currentTemplate.name?.trim()) {
      setShowErrors(true);
      toast({ variant: 'destructive', title: 'Error', description: 'Template Name is required.' });
      return;
    }

    // Mandatory Section Name Validation
    const hasEmptySectionName = currentTemplate.customSections?.some(s => !s.name?.trim());
    if (hasEmptySectionName) {
      setShowErrors(true); // Trigger visibility of red borders
      toast({ 
        variant: 'destructive', 
        title: 'Validation Error', 
        description: 'All sections must have a name before saving the template.' 
      });
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
    setShowErrors(false);
  };

  const handleAddCustomSection = () => {
    const newSection: TemplateSection = {
      id: `sec-${Date.now()}`,
      name: '',
      description: '',
      isMandatory: false,
      defaultValue: '',
      contentType: 'rich',
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Management</h1>
          <p className="text-muted-foreground font-medium">Create standardized content blocks and structured elements to streamline definition creation.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleCreateNew('Custom')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 dark:bg-slate-900">
                <TableHead className="py-4">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
                    Template Name
                  </div>
                </TableHead>
                <TableHead>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
                    Status
                  </div>
                </TableHead>
                <TableHead>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
                    Description
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
                    Actions
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium py-4 text-slate-700 dark:text-slate-300">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant={template.status === 'Active' ? 'success' : 'secondary'}>
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-slate-600 dark:text-slate-400 font-medium">
                    {template.description || <span className="italic opacity-50 font-normal">No description provided</span>}
                  </TableCell>
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
              {sortedTemplates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No templates found. Click "Create Template" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b bg-background sticky top-0 z-50 flex justify-between items-center shadow-sm">
            <DialogHeader className="p-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {isEditing ? 'Edit' : 'Create'} Template
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    A standardized framework designed to ensure consistent and structured documentation.
                  </p>
                </div>
              </div>
            </DialogHeader>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveTemplate} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                  <CardTitle className="text-lg font-bold">Template Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="t-name" className="text-sm font-bold text-slate-700">Template Name <span className="text-destructive">*</span></Label>
                      <Input 
                        id="t-name" 
                        value={currentTemplate.name} 
                        onChange={e => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Clinical Guideline Template"
                        className={cn(
                          "rounded-xl border-slate-200 focus-visible:ring-primary/20",
                          showErrors && !currentTemplate.name?.trim() && "border-red-300 bg-red-50/30"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="t-status" className="text-sm font-bold text-slate-700">Status</Label>
                      <Select 
                        value={currentTemplate.status} 
                        onValueChange={v => setCurrentTemplate(prev => ({ ...prev, status: v as any }))}
                      >
                        <SelectTrigger id="t-status" className="rounded-xl border-slate-200">
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
                    <Label htmlFor="t-desc" className="text-sm font-bold text-slate-700">Template Description</Label>
                    <Textarea 
                      id="t-desc" 
                      value={currentTemplate.description} 
                      onChange={e => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Briefly describe what this structure is intended for..."
                      className="rounded-xl border-slate-200 focus-visible:ring-primary/20 min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Template Sections</h3>
                    <p className="text-sm text-slate-500">Configure standardized sections that will be automatically included in every definition created from this template.</p>
                  </div>
                  <Button variant="outline" onClick={handleAddCustomSection} className="rounded-xl border-slate-200 hover:bg-slate-50">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Section
                  </Button>
                </div>

                <div className="space-y-4">
                  {(currentTemplate.customSections || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl text-slate-400 bg-slate-50/50">
                      <ListTodo className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-medium">No custom sections defined.</p>
                      <p className="text-sm opacity-70">Add sections to create a structured blueprint.</p>
                    </div>
                  ) : (
                    currentTemplate.customSections?.map((section, idx) => (
                      <Card key={section.id} className="rounded-2xl border-slate-200 shadow-sm border-l-4 border-l-primary overflow-hidden">
                        <CardHeader className="py-3 bg-slate-50 border-b flex flex-row items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <div className="flex flex-col flex-1 max-w-sm gap-1.5">
                              <Label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Section Name <span className="text-destructive">*</span></Label>
                              <Input 
                                value={section.name} 
                                onChange={e => handleUpdateCustomSection(section.id, { name: e.target.value })}
                                placeholder="e.g., Clinical Business Rules"
                                className={cn(
                                  "h-9 rounded-lg border-slate-200 focus-visible:ring-primary/20 font-medium",
                                  showErrors && !section.name?.trim() && "border-red-300 bg-red-50/30"
                                )}
                              />
                            </div>

                            <div className="flex flex-col flex-1 max-w-sm gap-1.5 ml-4">
                              <Label className="text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                                <AlignLeft className="h-3 w-3" /> Section Description
                              </Label>
                              <Input 
                                value={section.description || ''} 
                                onChange={e => handleUpdateCustomSection(section.id, { description: e.target.value })}
                                placeholder="Instructions for users..."
                                className="h-9 rounded-lg border-slate-200 focus-visible:ring-primary/20"
                              />
                            </div>
                            
                            <div className="flex items-center gap-6 ml-6">
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Editor Type</Label>
                                <Select 
                                  value={section.contentType} 
                                  onValueChange={v => handleUpdateCustomSection(section.id, { contentType: v as any })}
                                >
                                  <SelectTrigger className="h-9 w-36 rounded-lg border-slate-200 text-xs font-semibold">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="rich" className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <FileType className="h-3.5 w-3.5 text-indigo-500" />
                                        Rich Text
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="plain" className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <Type className="h-3.5 w-3.5 text-slate-500" />
                                        Plain Text
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="dropdown" className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <List className="h-3.5 w-3.5 text-emerald-500" />
                                        Dropdown
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center gap-2 mt-4">
                                <Checkbox 
                                  id={`mand-${section.id}`}
                                  checked={section.isMandatory}
                                  onCheckedChange={checked => handleUpdateCustomSection(section.id, { isMandatory: !!checked })}
                                  className="rounded border-slate-300"
                                />
                                <Label htmlFor={`mand-${section.id}`} className="text-xs font-bold text-slate-600 cursor-pointer">Mandatory</Label>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleRemoveCustomSection(section.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        {section.contentType === 'dropdown' && (
                          <CardContent className="p-4 bg-white">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Dropdown Options (Comma separated)</Label>
                              <Input 
                                value={section.dropdownOptions || ''} 
                                onChange={e => handleUpdateCustomSection(section.id, { dropdownOptions: e.target.value })}
                                placeholder="Option 1, Option 2, Option 3..."
                                className="h-9 rounded-lg border-slate-200"
                              />
                            </div>
                          </CardContent>
                        )}
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
