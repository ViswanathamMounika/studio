
"use client";

import React, { useState, useEffect } from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, Folder, FileText, Bookmark, FileClock, Paperclip, MessageSquare, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import RelatedDefinitions from './related-definitions';
import { Skeleton } from '../ui/skeleton';

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

const DefinitionSubItems = ({ definitionId, onSelect, activeSection, level }: { definitionId: string, onSelect: (id: string, sectionId?: string) => void, activeSection: string, level: number }) => {
    const subItems = [
        { id: 'description', label: 'Description', icon: FileText },
        { id: 'revisions', label: 'Version History', icon: FileClock },
        { id: 'attachments', label: 'Attachments', icon: Paperclip },
        { id: 'notes', label: 'Notes', icon: MessageSquare }
    ];

    return (
        <div className="space-y-1" style={{ paddingLeft: `${(level) * 1}rem` }}>
            {subItems.map(item => (
                <div
                    key={item.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(definitionId, item.id)
                    }}
                    className={cn(
                        "flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm ml-8",
                        "hover:bg-primary/10",
                        activeSection === item.id && "bg-primary/10 text-primary"
                    )}
                >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
};


export default function DefinitionTreeNode({ node, selectedId, onSelect, level, onToggleSelection, isSelectedForExport, isExportMode, selectedForExport, activeSection }: { node: Definition, selectedId: string | null, onSelect: (id: string, sectionId?: string) => void, level: number, onToggleSelection: (id: string, checked: boolean) => void, isSelectedForExport: boolean, isExportMode: boolean, selectedForExport: string[], activeSection: string }) {
  const isModule = !node.description; // Modules usually don't have descriptions
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId !== null && node.id === selectedId;
  const isParentOfSelected = selectedId !== null && isParent(node, selectedId);
  
  const [isNodeExpanded, setIsNodeExpanded] = useState(false);
  const [showRelated, setShowRelated] = useState(false);

  useEffect(() => {
    setIsNodeExpanded(isSelected || isParentOfSelected);
  }, [isSelected, isParentOfSelected]);
  
  const handleNodeSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(isSelected && !hasChildren){
       setIsNodeExpanded(prev => !prev);
    } else {
       onSelect(node.id);
       setIsNodeExpanded(prev => !prev);
    }
  };
  
  const Icon = hasChildren || isModule ? Folder : FileText;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleRelatedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRelated(!showRelated);
  }

  const handleDefinitionClick = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('definitionId', id);
    url.searchParams.set('section', 'description');
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new PopStateEvent('popstate'));
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
            
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-transparent" onClick={handleTriggerClick}>
                    { (hasChildren || !isModule) ? (
                        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isNodeExpanded && "rotate-90")} />
                    ) : ( <div className="w-4 h-4"></div>)
                    }
                </Button>
            </CollapsibleTrigger>
            
            <div
                className={cn(
                    "w-full justify-start text-left h-8 pl-0 flex items-center cursor-pointer"
                )}
                onClick={handleNodeSelect}
            >
                <Icon className={cn("h-4 w-4 mr-2 shrink-0", hasChildren || isModule ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate flex-1">{node.name}</span>
                {node.isBookmarked && !isExportMode && (
                  <Bookmark className="h-4 w-4 shrink-0 fill-primary text-primary ml-auto mr-1" />
                )}
                 {!isModule && !isExportMode && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-auto mr-1 group-hover/item:opacity-100 opacity-0" onClick={handleRelatedClick}>
                    <Link className="h-4 w-4" />
                  </Button>
                )}
            </div>
        </div>
      
      <CollapsibleContent>
            {hasChildren && isNodeExpanded && (
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
                        selectedForExport={selectedForExport}
                        activeSection={activeSection}
                    />
                    ))}
                </div>
            )}
            {!isModule && isSelected && isNodeExpanded && (
                <DefinitionSubItems definitionId={node.id} onSelect={onSelect} activeSection={activeSection} level={level}/>
            )}
            {!isModule && showRelated && isNodeExpanded && (
              <div className="pl-12 pr-4 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Related Definitions</h4>
                <RelatedDefinitions currentDefinition={node} onDefinitionClick={handleDefinitionClick}/>
              </div>
            )}
      </CollapsibleContent>
    </Collapsible>
  );
}

    