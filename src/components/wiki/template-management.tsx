'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Pencil, Trash2, Save, X, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Template, TemplateSection } from '@/lib/types';
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
    sections: [],
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
      sections: [],
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
    if (!currentTemplate.sections || currentTemplate.sections.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'At least one section is required.' });
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

  const handleAddSection = () => {
    const newSection: TemplateSection = {
      id: `s-${Date.now()}`,
      name: '',
      order: (currentTemplate.sections?.length || 0) + 1,
      isMandatory: false,
      contentType: 'Rich Text',
      defaultContent: '',
    };
    setCurrentTemplate(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
  };

  const handleRemoveSection = (id: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      sections: prev.sections?.filter(s => s.id !== id),
    }));
  };

  const handleSectionChange = (id: string, field: keyof TemplateSection, value: any) => {
    setCurrentTemplate(prev => ({
      ...prev,
      sections: prev.sections?.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Management</h1>
          <p className="text-muted-foreground">Define reusable definition structures with default content.</p>
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
                <TableHead>Sections</TableHead>
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
                  <TableCell>{template.sections.length} Fields</TableCell>
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
                {isEditing ? 'Edit Template Structure' : 'Create New Template Structure'}
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
                      <Label htmlFor="t-name">Template Name (DEF_TEMPLATE_NAME)</Label>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    Defined Sections
                    <Badge variant="outline" className="text-[10px] uppercase">{currentTemplate.sections?.length || 0} Sections</Badge>
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleAddSection}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                </div>

                <div className="space-y-6">
                  {currentTemplate.sections?.map((section, idx) => (
                    <Card key={section.id} className="border-primary/10 shadow-sm relative overflow-visible">
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 cursor-grab text-muted-foreground hover:text-primary transition-colors">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <CardHeader className="flex flex-row items-center justify-between py-3 bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="h-6 w-6 rounded-full flex items-center justify-center p-0 font-bold">
                            {section.order}
                          </Badge>
                          <Input 
                            value={section.name} 
                            onChange={e => handleSectionChange(section.id, 'name', e.target.value)}
                            placeholder="Section Title (e.g., Clinical Overview)"
                            className="h-8 font-bold border-none bg-transparent shadow-none focus-visible:ring-0 p-0 text-base min-w-[300px]"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id={`s-mand-${section.id}`} 
                              checked={section.isMandatory} 
                              onCheckedChange={v => handleSectionChange(section.id, 'isMandatory', !!v)}
                            />
                            <Label htmlFor={`s-mand-${section.id}`} className="text-xs cursor-pointer">Mandatory</Label>
                          </div>
                          <Select 
                            value={section.contentType} 
                            onValueChange={v => handleSectionChange(section.id, 'contentType', v as any)}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Rich Text">Rich Text</SelectItem>
                              <SelectItem value="Plain Text">Plain Text</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveSection(section.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">Default Content (Pre-populated for new definitions)</Label>
                        {section.contentType === 'Rich Text' ? (
                          <WysiwygEditor 
                            value={section.defaultContent || ''} 
                            onChange={(content) => handleSectionChange(section.id, 'defaultContent', content)} 
                            placeholder="Add boilerplate content that will appear by default when using this template..."
                          />
                        ) : (
                          <Textarea 
                            value={section.defaultContent || ''} 
                            onChange={(e) => handleSectionChange(section.id, 'defaultContent', e.target.value)}
                            placeholder="Add boilerplate text..."
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(!currentTemplate.sections || currentTemplate.sections.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                      <PlusCircle className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground font-medium">No sections defined yet.</p>
                      <Button variant="link" onClick={handleAddSection}>Click here to add the first section</Button>
                    </div>
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
