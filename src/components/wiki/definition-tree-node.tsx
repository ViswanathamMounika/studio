
"use client";

import React, { useState, useEffect } from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, File, Folder, Book, Code, Lightbulb, Pilcrow, History } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        if (child.children && isParent(child, selectedId)) {
            return true;
        }
    }
    return false;
}

export default function DefinitionTreeNode({ node, selectedId, onSelect, level }: { node: Definition, selectedId: string | null, onSelect: (id: string, sectionId?: string) => void, level: number }) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId !== null && node.id === selectedId;
  const isParentOfSelected = selectedId !== null && isParent(node, selectedId);
  const showSections = isSelected && !hasChildren;

  const [isNodeExpanded, setIsNodeExpanded] = useState(false);

  useEffect(() => {
    if (isParentOfSelected) {
      setIsNodeExpanded(true);
    }
  }, [isParentOfSelected]);
  
  const handleNodeSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
    if (hasChildren) {
      setIsNodeExpanded(prev => !prev);
    } else {
       setIsNodeExpanded(true); // Always expand leaf nodes on select
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNodeExpanded(prev => !prev);
  };
  
  const Icon = hasChildren ? Folder : File;

  const isExpandable = hasChildren || !hasChildren;

  return (
    <Collapsible open={isNodeExpanded} onOpenChange={setIsNodeExpanded}>
        <div 
            className={cn(
                "flex items-center w-full group/item rounded-md",
                isSelected && "bg-accent/30"
            )}
            style={{ paddingLeft: `${level * 1.5}rem` }}
        >
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-accent/50" onClick={handleTriggerClick}>
                    <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isNodeExpanded && "rotate-90", !isExpandable && "invisible")} />
                </Button>
            </CollapsibleTrigger>
            
            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-8 hover:bg-accent/50 p-0"
                onClick={handleNodeSelect}
            >
                <Icon className={cn("h-4 w-4 mr-2", hasChildren ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{node.name}</span>
            </Button>
        </div>
        
        <CollapsibleContent>
            {hasChildren && (
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
            )}
            {showSections && (
                <div className="space-y-1 py-1" style={{ paddingLeft: `${(level + 2) * 1.5}rem` }}>
                    {sectionItems.map(item => {
                        const SectionIcon = item.icon;
                        return (
                            <Button
                                key={item.key}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-left h-8 hover:bg-accent/50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(node.id, `section-${item.key}`);
                                }}
                            >
                                <SectionIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="truncate">{item.label}</span>
                            </Button>
                        )
                    })}
                </div>
            )}
        </CollapsibleContent>
    </Collapsible>
  );
}
