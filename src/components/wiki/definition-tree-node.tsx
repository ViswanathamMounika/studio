"use client";

import React, { useState, useEffect } from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, File, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';


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
  
  const [isNodeExpanded, setIsNodeExpanded] = useState(isParentOfSelected && !isSelected);

  useEffect(() => {
    setIsNodeExpanded(isParentOfSelected || (isSelected && hasChildren));
  }, [isParentOfSelected, isSelected, hasChildren]);

  
  const handleNodeSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
    if (hasChildren) {
      setIsNodeExpanded(prev => !prev);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNodeExpanded(prev => !prev);
  };
  
  const Icon = hasChildren ? Folder : File;

  const isExpandable = hasChildren || (isSelected && !hasChildren);

  return (
    <Collapsible open={isNodeExpanded} onOpenChange={setIsNodeExpanded}>
      <div 
          className={cn(
              "flex items-center w-full group/item rounded-md",
              isSelected && "bg-accent/50"
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
              className={cn(
                  "w-full justify-start text-left h-8 p-0 hover:bg-transparent", // remove hover effect from button since parent has it
                  isSelected && "bg-transparent"
              )}
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
          {isSelected && !hasChildren && (
            <div className="space-y-1 mt-1 pl-4" style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                <button onClick={() => onSelect(node.id, 'section-description')} className="w-full text-left p-1 px-2 rounded-md hover:bg-accent/50 text-sm text-muted-foreground">Description</button>
                <button onClick={() => onSelect(node.id, 'section-technical-details')} className="w-full text-left p-1 px-2 rounded-md hover:bg-accent/50 text-sm text-muted-foreground">Technical Details</button>
                <button onClick={() => onSelect(node.id, 'section-examples')} className="w-full text-left p-1 px-2 rounded-md hover:bg-accent/50 text-sm text-muted-foreground">Examples</button>
                <button onClick={() => onSelect(node.id, 'section-usage')} className="w-full text-left p-1 px-2 rounded-md hover:bg-accent/50 text-sm text-muted-foreground">Usage</button>
                <button onClick={() => onSelect(node.id, 'section-revisions')} className="w-full text-left p-1 px-2 rounded-md hover:bg-accent/50 text-sm text-muted-foreground">Version History</button>
            </div>
          )}
      </CollapsibleContent>
    </Collapsible>
  );
}
