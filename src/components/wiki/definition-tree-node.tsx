
"use client";

import React, { useState } from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, File, Folder, Book, Code, Lightbulb, Pilcrow, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initialDefinitions, findDefinition } from '@/lib/data';


const sectionItems = [
    { key: 'description', label: 'Description', icon: Book },
    { key: 'technical-details', label: 'Technical Details', icon: Code },
    { key: 'examples', label: 'Examples', icon: Lightbulb },
    { key: 'usage', label: 'Usage', icon: Pilcrow },
    { key: 'revisions', label: 'Version History', icon: History },
];

function isParent(node: Definition, selectedId: string): boolean {
    if (!node.children) {
        return false;
    }
    for (const child of node.children) {
        if (child.id === selectedId) {
            return true;
        }
        if (isParent(child, selectedId)) {
            return true;
        }
    }
    return false;
}


export default function DefinitionTreeNode({ node, selectedId, onSelect, level }: { node: Definition, selectedId: string | null, onSelect: (id: string, sectionId?: string) => void, level: number }) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;
  const isParentOfSelected = selectedId ? isParent(node, selectedId) : false;

  const [isExpanded, setIsExpanded] = useState(level < 1 || isParentOfSelected);

  const handleNodeSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
    if (!hasChildren) {
      setIsExpanded(prev => !prev);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-md">
        <div className="flex items-center w-full group/item">
            <Button
                variant="ghost"
                size="sm"
                className={cn("w-full justify-start text-left", isSelected && "bg-accent/30 hover:bg-accent/40")}
                style={{ paddingLeft: `${level * 1}rem` }}
                onClick={handleNodeSelect}
            >
                <CollapsibleTrigger asChild onClick={handleTriggerClick}>
                    <span className='h-full px-2 -ml-2'>
                        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isExpanded && "rotate-90")} />
                    </span>
                </CollapsibleTrigger>
                
                {hasChildren ? (
                    <Folder className="h-4 w-4 mr-2 text-primary" />
                ): (
                    <File className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                
                <span className="truncate">{node.name}</span>
            </Button>
        </div>
        
        {!hasChildren && (
            <CollapsibleContent>
                <div className="space-y-1 py-1" style={{ paddingLeft: `${(level + 1.5) * 1}rem` }}>
                    {sectionItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <Button
                            key={item.key}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left h-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(node.id, `section-${item.key}`);
                            }}
                        >
                            <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="truncate">{item.label}</span>
                        </Button>
                    )
                    })}
                </div>
            </CollapsibleContent>
        )}
      </div>

      {hasChildren && (
        <CollapsibleContent>
            <div className="space-y-1 mt-1">
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
      )}
    </Collapsible>
  );
}
