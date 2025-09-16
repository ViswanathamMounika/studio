"use client";

import React from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, File, Folder, Book, Code, Lightbulb, Pilcrow, History } from 'lucide-react';
import { cn } from '@/lib/utils';

type DefinitionTreeNodeProps = {
  node: Definition;
  selectedId: string | null;
  onSelect: (id: string, sectionId?: string) => void;
  level: number;
};

const sectionItems = [
    { key: 'description', label: 'Description', icon: Book },
    { key: 'technical-details', label: 'Technical Details', icon: Code },
    { key: 'examples', label: 'Examples', icon: Lightbulb },
    { key: 'usage', label: 'Usage', icon: Pilcrow },
    { key: 'revisions', label: 'Version History', icon: History },
];

export default function DefinitionTreeNode({ node, selectedId, onSelect, level }: DefinitionTreeNodeProps) {
  const isSelected = node.id === selectedId;

  return (
    <Collapsible defaultOpen={level < 2}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center w-full group/item">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full justify-start text-left", isSelected && "bg-accent text-accent-foreground")}
            style={{ paddingLeft: `${level * 1}rem` }}
            onClick={() => onSelect(node.id)}
          >
            {node.children && node.children.length > 0 ? (
                 <ChevronRight className="h-4 w-4 mr-2 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            ) : <span className="w-4 h-4 mr-2 shrink-0"></span> }
            {node.children && node.children.length > 0 ? (
                <Folder className="h-4 w-4 mr-2 text-primary" />
            ) : (
                <File className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <span className="truncate">{node.name}</span>
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1">
          {node.children?.map(child => (
            <DefinitionTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
          {(!node.children || node.children.length === 0) && (
           <div className="space-y-1" style={{ paddingLeft: `${(level + 1) * 1}rem` }}>
              {sectionItems.map(item => {
                const Icon = item.icon;
                return (
                    <Button
                        key={item.key}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => {
                            onSelect(node.id, `section-${item.key}`);
                        }}
                    >
                       <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                       <span className="truncate">{item.label}</span>
                    </Button>
                )
              })}
           </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
