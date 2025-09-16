"use client";

import React, { useState, useEffect } from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, File, Folder, FileText, Code2, Lightbulb, Pilcrow, History } from 'lucide-react';
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

const SectionLink = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="w-full text-left p-1 px-2 rounded-md hover:bg-accent/50 text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        <span>{label}</span>
    </button>
);


export default function DefinitionTreeNode({ node, selectedId, onSelect, level }: { node: Definition, selectedId: string | null, onSelect: (id: string, sectionId?: string) => void, level: number }) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId !== null && node.id === selectedId;
  const isParentOfSelected = selectedId !== null && (isParent(node, selectedId) || node.id === selectedId);
  
  const [isNodeExpanded, setIsNodeExpanded] = useState(isParentOfSelected);

  useEffect(() => {
    if (isParentOfSelected) {
        setIsNodeExpanded(true);
    }
  }, [isParentOfSelected, selectedId]);

  
  const handleNodeSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
    if (!hasChildren) {
        setIsNodeExpanded(prev => !prev);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNodeExpanded(prev => !prev);
  };
  
  const Icon = hasChildren ? Folder : File;
  const showSubItemChevron = !hasChildren || isSelected;

  return (
    <Collapsible open={isNodeExpanded} onOpenChange={setIsNodeExpanded}>
        <div 
            className={cn(
                "flex items-center w-full group/item rounded-md",
                isSelected && "bg-accent/50"
            )}
            style={{ paddingLeft: `${level * 1}rem` }}
        >
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-accent/50" onClick={handleTriggerClick}>
                      <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isNodeExpanded && "rotate-90")} />
                  </Button>
              </CollapsibleTrigger>
            ) : (
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-accent/50" onClick={handleTriggerClick} disabled={!isSelected}>
                        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isSelected && isNodeExpanded ? "rotate-90" : "opacity-0")} />
                    </Button>
                </CollapsibleTrigger>
            )}
            
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "w-full justify-start text-left h-8 hover:bg-transparent pl-0",
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
          {isSelected && (
            <div className="space-y-1 mt-1" style={{ paddingLeft: `${(level + 2)}rem` }}>
                <SectionLink icon={<FileText className="h-4 w-4" />} label="Description" onClick={() => onSelect(node.id, 'section-description')} />
                <SectionLink icon={<Code2 className="h-4 w-4" />} label="Technical Details" onClick={() => onSelect(node.id, 'section-technical-details')} />
                <SectionLink icon={<Lightbulb className="h-4 w-4" />} label="Examples" onClick={() => onSelect(node.id, 'section-examples')} />
                <SectionLink icon={<Pilcrow className="h-4 w-4" />} label="Usage" onClick={() => onSelect(node.id, 'section-usage')} />
                <SectionLink icon={<History className="h-4 w-4" />} label="Version History" onClick={() => onSelect(node.id, 'section-revisions')} />
            </div>
          )}
      </CollapsibleContent>
    </Collapsible>
  );
}