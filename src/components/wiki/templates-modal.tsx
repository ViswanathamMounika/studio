
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Code, Plus, DatabaseZap } from 'lucide-react';
import type { Definition, Template } from '@/lib/types';

type TemplateOption = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  data: Partial<Omit<Definition, 'id' | 'revisions' | 'isArchived'>>;
};

const defaultTemplates: TemplateOption[] = [
  {
    id: 'blank',
    title: 'Blank Definition',
    description: 'Start from a completely empty slate.',
    icon: Plus,
    data: {
      name: 'New Definition',
      module: 'Core',
      keywords: [],
      description: '',
    },
  },
];

type TemplatesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (templateData: Partial<Definition>, templateId: string) => void;
  managedTemplates?: Template[];
};

export default function TemplatesModal({ open, onOpenChange, onUseTemplate, managedTemplates = [] }: TemplatesModalProps) {

  const handleUseTemplate = (templateId: string, templateData: Partial<Definition>) => {
    onUseTemplate(templateData, templateId);
  };

  const activeManagedTemplates = managedTemplates.filter(t => t.status === 'Active');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create from a template</DialogTitle>
            <DialogDescription>
              Get started faster by using a pre-defined template for your new definition.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {defaultTemplates.map((template) => (
                <Card key={template.id} className="flex flex-col border-dashed">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <template.icon className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end">
                    <Button 
                      variant="outline"
                      className="w-full mt-auto"
                      onClick={() => handleUseTemplate(template.id, template.data)}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {activeManagedTemplates.map((template) => (
                <Card key={template.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end">
                    <Button 
                      className="w-full mt-auto"
                      onClick={() => handleUseTemplate(template.id, {
                        name: `New ${template.name}`,
                        module: 'Core',
                      })}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
