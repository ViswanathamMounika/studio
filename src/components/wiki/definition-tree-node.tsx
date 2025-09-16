"use client";

import React from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type DefinitionTreeNodeProps = {
  node: Definition;
  selectedId: string | null;
  onSelect: (id: string) => void;
  level: number;
};

export default function DefinitionTreeNode({ node, selectedId, onSelect, level }: DefinitionTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;

  if (hasChildren) {
    return (
      <Collapsible defaultOpen={level < 2}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center w-full">
            <Button
              variant="ghost"
              size="sm"
              className={cn("w-full justify-start text-left", isSelected && "bg-accent text-accent-foreground")}
              style={{ paddingLeft: `${level * 1}rem` }}
              onClick={() => onSelect(node.id)}
            >
              <ChevronRight className="h-4 w-4 mr-2 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              {level > 0 && <Folder className="h-4 w-4 mr-2 text-primary" />}
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("w-full justify-start text-left", isSelected && "bg-accent text-accent-foreground")}
      style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
      onClick={() => onSelect(node.id)}
    >
      <File className="h-4 w-4 mr-2 text-muted-foreground" />
      <span className="truncate">{node.name}</span>
    </Button>
  );
}
