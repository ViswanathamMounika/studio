
"use client";

import React, { useState, useEffect } from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, File, Folder, FileText, Code2, BookText, History, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

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
    <button onClick={onClick} className="w-full text-left p-1 px-2 rounded-md hover:bg-primary/10 text-sm flex items-center gap-2">
        {icon}
        <span className="text-foreground">{label}</span>
    </button>
);


export default function DefinitionTreeNode({ node, selectedId, onSelect, level, onToggleSelection, isSelectedForExport, isExportMode }: { node: Definition, selectedId: string | null, onSelect: (id: string, sectionId?: string) => void, level: number, onToggleSelection: (id: string, checked: boolean) => void, isSelectedForExport: boolean, isExportMode: boolean }) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId !== null && node.id === selectedId;
  const isParentOfSelected = selectedId !== null && isParent(node, selectedId);
  
  const [isNodeExpanded, setIsNodeExpanded] = useState(false);

  useEffect(() => {
    // Only auto-expand if it's a parent of the selected node, not the node itself
    setIsNodeExpanded(isParentOfSelected);
  }, [isParentOfSelected]);
  
  const handleNodeSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNodeExpanded(prev => !prev);
  };
  
  const Icon = hasChildren ? Folder : FileText;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Collapsible open={isNodeExpanded} onOpenChange={setIsNodeExpanded}>
        <div 
            className={cn(
                "flex items-center w-full group/item rounded-md",
                !isExportMode && "hover:bg-primary/10",
                isSelected && !isExportMode && "bg-primary/10"
            )}
            style={{ paddingLeft: `${level * 1}rem` }}
        >
            {isExportMode && (
                <div onClick={handleCheckboxClick} className="p-2">
                    <Checkbox
                        id={`select-${node.id}`}
                        checked={isSelectedForExport}
                        onCheckedChange={(checked) => onToggleSelection(node.id, !!checked)}
                        className="mr-2"
                    />
                </div>
            )}
            {hasChildren ? (
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-transparent" onClick={handleTriggerClick}>
                        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isNodeExpanded && "rotate-90")} />
                    </Button>
                </CollapsibleTrigger>
            ) : (
                // Add a collapsible trigger for leaf nodes to show/hide section links
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-transparent" onClick={handleTriggerClick}>
                        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isNodeExpanded && "rotate-90")} />
                    </Button>
                </CollapsibleTrigger>
            )}
            
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "w-full justify-start text-left h-8 hover:bg-transparent pl-0",
                    isSelected && !isExportMode && "bg-transparent"
                )}
                onClick={handleNodeSelect}
            >
                <Icon className={cn("h-4 w-4 mr-2", hasChildren ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate flex-1">{node.name}</span>
                {node.isBookmarked && (
                  <Bookmark className="h-4 w-4 shrink-0 fill-primary text-primary ml-auto" />
                )}
            </Button>
        </div>
      
      <CollapsibleContent>
          {hasChildren && isNodeExpanded ? (
              <div className="space-y-1 mt-1">
                  {node.children?.map(child => (
                  <DefinitionTreeNode
                      key={child.id}
                      node={child}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      level={level + 1}
                      onToggleSelection={onToggleSelection}
                      isSelectedForExport={selectedForExport.includes(child.id)}
                      isExportMode={isExportMode}
                  />
                  ))}
              </div>
          ) : isSelected && isNodeExpanded && !hasChildren ? (
            <div className="space-y-1 mt-1" style={{ paddingLeft: `${(level + 4)}rem` }}>
                <SectionLink icon={<FileText className="h-4 w-4" />} label="Description" onClick={() => onSelect(node.id, 'description')} />
                <SectionLink icon={<Code2 className="h-4 w-4" />} label="Technical Details" onClick={() => onSelect(node.id, 'technical-details')} />
                <SectionLink icon={<BookText className="h-4 w-4" />} label="Examples & Usage" onClick={() => onSelect(node.id, 'examples-usage')} />
                <SectionLink icon={<History className="h-4 w-4" />} label="Version History" onClick={() => onSelect(node.id, 'revisions')} />
            </div>
          ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
