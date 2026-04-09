
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
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, LayoutTemplate, Box } from 'lucide-react';
import type { Definition, Template } from '@/lib/types';

type TemplatesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (templateData: Partial<Definition>, templateId: string) => void;
  managedTemplates?: Template[];
};

export default function TemplatesModal({ open, onOpenChange, onUseTemplate, managedTemplates = [] }: TemplatesModalProps) {

  const handleUseTemplateInternal = (templateId: string, templateName: string) => {
    onUseTemplate({
      name: `New ${templateName}`,
      module: 'Core',
    }, templateId);
  };

  const activeManagedTemplates = managedTemplates.filter(t => t.isActive);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-4xl p-0 overflow-hidden border-none rounded-[24px] shadow-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="p-6 border-b bg-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Select Documentation Blueprint</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Choose a pre-defined layout to ensure metadata consistency across the Wiki.
                </DialogDescription>
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-[70vh] bg-slate-50/30">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Dynamic Templates from Template Management */}
                {activeManagedTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="group relative flex flex-col border-slate-200 bg-white hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer rounded-2xl p-2" 
                    onClick={() => handleUseTemplateInternal(template.id, template.name)}
                  >
                    <CardHeader className="p-4">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                          <Box className="h-5 w-5 text-[#3F51B5]" />
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900 flex flex-col">
                        <span>{template.name}</span>
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest mt-0.5">{template.module}</span>
                      </CardTitle>
                      <CardDescription className="text-xs leading-relaxed text-slate-500 mt-1 line-clamp-2">
                        {template.description || "Pre-defined blueprint with specific data capturing sections."}
                      </CardDescription>
                    </CardHeader>
                    {template.isDefault && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">Default</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {activeManagedTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">No Custom Templates Found</p>
                    <p className="text-sm text-slate-500">Go to Template Management to define new blueprints.</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 bg-white border-t flex justify-end">
            <button 
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
