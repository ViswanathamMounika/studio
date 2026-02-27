
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Pencil, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Template, TemplateSection } from '@/lib/types';
import { Textarea } from '../ui/textarea';

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
    toast({ title: 'Template Deactivated', description: 'The template is now inactive and unavailable for new definitions.' });
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
          <p className="text-muted-foreground">Define and manage reusable definition templates.</p>
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
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{template.description}</TableCell>
                  <TableCell>
                    <Badge variant={template.status === 'Active' ? 'success' : 'secondary'}>
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{template.sections.length} Sections</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {template.status === 'Active' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeactivate(template.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedTemplates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No templates found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-name">Template Name</Label>
                <Input 
                  id="t-name" 
                  value={currentTemplate.name} 
                  onChange={e => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Standard Definition"
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
              <div className="col-span-2 space-y-2">
                <Label htmlFor="t-desc">Description (Optional)</Label>
                <Textarea 
                  id="t-desc" 
                  value={currentTemplate.description} 
                  onChange={e => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What is this template for?"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold">Template Sections</h3>
                <Button variant="outline" size="sm" onClick={handleAddSection}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>
              <div className="space-y-4">
                {currentTemplate.sections?.map((section, idx) => (
                  <Card key={section.id} className="relative">
                    <CardContent className="p-4 grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-1 text-center">
                        <Label className="text-[10px] uppercase text-muted-foreground">Order</Label>
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-lg">{section.order}</span>
                        </div>
                      </div>
                      <div className="col-span-4 space-y-1">
                        <Label htmlFor={`s-name-${section.id}`}>Section Name</Label>
                        <Input 
                          id={`s-name-${section.id}`} 
                          value={section.name} 
                          onChange={e => handleSectionChange(section.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label htmlFor={`s-type-${section.id}`}>Content Type</Label>
                        <Select 
                          value={section.contentType} 
                          onValueChange={v => handleSectionChange(section.id, 'contentType', v as any)}
                        >
                          <SelectTrigger id={`s-type-${section.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rich Text">Rich Text</SelectItem>
                            <SelectItem value="Plain Text">Plain Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 pb-2">
                        <Checkbox 
                          id={`s-mand-${section.id}`} 
                          checked={section.isMandatory} 
                          onCheckedChange={v => handleSectionChange(section.id, 'isMandatory', !!v)}
                        />
                        <Label htmlFor={`s-mand-${section.id}`} className="cursor-pointer">Mandatory</Label>
                      </div>
                      <div className="col-span-2 flex justify-end pb-1">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSection(section.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveTemplate}>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
