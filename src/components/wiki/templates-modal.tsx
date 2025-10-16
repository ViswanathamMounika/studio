
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
import { FileText, Code, Plus } from 'lucide-react';
import NewDefinitionModal from './new-definition-modal';

type Template = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  data: {
    name: string;
    module: string;
    keywords: string[];
    description: string;
    technicalDetails: string;
    examples: string;
    usage: string;
  };
};

const templates: Template[] = [
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
      technicalDetails: '',
      examples: '',
      usage: '',
    },
  },
  {
    id: 'standard',
    title: 'Standard Definition',
    description: 'A basic template with sections for description, technical details, and examples.',
    icon: FileText,
    data: {
        name: 'New Standard Definition',
        module: 'Core',
        keywords: ['standard'],
        description: '<h3>Overview</h3><p>A clear and concise summary of what this term means.</p>',
        technicalDetails: '<h3>Data Model</h3><p>Relevant tables, columns, and data sources.</p>',
        examples: '<h3>Scenario 1</h3><p>Describe a real-world example.</p>',
        usage: '<h3>Reporting</h3><p>How is this definition used in reports?</p>'
    }
  },
  {
    id: 'technical-spec',
    title: 'Technical Specification',
    description: 'A detailed template for technical terms, including SQL queries and data lineage.',
    icon: Code,
    data: {
        name: 'New Technical Specification',
        module: 'Core',
        keywords: ['technical', 'sql'],
        description: '<h3>Purpose</h3><p>What is the goal of this technical component?</p>',
        technicalDetails: '<h3>SQL Query</h3><pre><code>SELECT * FROM ...</code></pre><h3>Data Lineage</h3><p>Source -> Staging -> Final</p>',
        examples: '<h3>Example Usage</h3><p>How to query or use this component.</p>',
        usage: '<h3>Dependencies</h3><p>What other definitions or systems depend on this?</p>'
    }
  },
];

type TemplatesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (templateData: Template['data']) => void;
  onSelectTemplate: (template: Template) => void; // Keeping this for potential future use
};

export default function TemplatesModal({ open, onOpenChange, onUseTemplate }: TemplatesModalProps) {
    const [isNewDefinitionModalOpen, setIsNewDefinitionModalOpen] = React.useState(false);
    const [selectedTemplateData, setSelectedTemplateData] = React.useState<Template['data'] | null>(null);

  const handleUseTemplate = (template: Template) => {
    onUseTemplate(template.data);
    onOpenChange(false);
  };

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
              {templates.map((template) => (
                <Card key={template.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <template.icon className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end">
                    <Button 
                      className="w-full mt-auto"
                      onClick={() => handleUseTemplate(template)}
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
