
"use client";

import React, { useState, useEffect } from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, Folder, FileText, Bookmark, FileClock, Paperclip, MessageSquare, Link, Archive } from 'lucide-react';
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

const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) {
        return <span className="truncate">{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span className="truncate">
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-300/40 font-semibold rounded-sm">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const DefinitionSubItems = ({ definition, onSelect, activeSection, level }: { definition: Definition, onSelect: (id: string, sectionId?: string) => void, activeSection: string, level: number }) => {
    const subItems = [
        { id: 'description', label: 'Description', icon: FileText },
        { id: 'revisions', label: 'Version History', icon: FileClock },
        { id: 'attachments', label: 'Attachments', icon: Paperclip },
        { id: 'notes', label: 'Notes', icon: MessageSquare },
        { id: 'related-definitions', label: 'Related Definitions', icon: Link },
    ];

    return (
        <div className="space-y-0.5" style={{ paddingLeft: `${(level + 1) * 0.75}rem` }}>
            {subItems.map(item => (
                <div
                    key={item.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(definition.id, item.id)
                    }}
                    className={cn(
                        "flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-[13px] ml-6 transition-colors",
                        "hover:bg-primary/5 hover:text-primary",
                        activeSection === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                    )}
                >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
};


export default function DefinitionTreeNode({ node, selectedId, onSelect, level, onToggleSelection, isSelectedForExport, isSelectMode, selectedForExport, activeSection, searchQuery }: { node: Definition, selectedId: string | null, onSelect: (id: string, sectionId?: string) => void, level: number, onToggleSelection: (id: string, checked: boolean) => void, isSelectedForExport: boolean, isSelectMode: boolean, selectedForExport: string[], activeSection: string, searchQuery: string }) {
  const isModule = !node.description; // Modules usually don't have descriptions
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId !== null && node.id === selectedId;
  const isParentOfSelected = selectedId !== null && isParent(node, selectedId);
  
  const [isNodeExpanded, setIsNodeExpanded] = useState(false);

  useEffect(() => {
    if (searchQuery) {
        setIsNodeExpanded(true);
    } else {
        setIsNodeExpanded(isSelected || isParentOfSelected);
    }
  }, [isSelected, isParentOfSelected, searchQuery]);
  
  const handleNodeSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelectMode) {
        onToggleSelection(node.id, !isSelectedForExport);
    } else {
        onSelect(node.id);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(isSelected && !hasChildren){
       setIsNodeExpanded(prev => !prev);
    } else {
       if (!isSelectMode) onSelect(node.id);
       setIsNodeExpanded(prev => !prev);
    }
  };
  
  const Icon = hasChildren || isModule ? Folder : FileText;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Collapsible open={isNodeExpanded} onOpenChange={setIsNodeExpanded}>
        <div 
            className={cn(
                "flex items-center w-full group/item rounded-md transition-all h-9 px-1",
                (isSelected && !isSelectMode) && "bg-primary/10 text-primary font-medium",
                (isSelectMode && isSelectedForExport) ? "bg-primary/10" : "hover:bg-muted/50"
            )}
            style={{ paddingLeft: `${level * 0.75}rem` }}
        >
            {isSelectMode && (
                <div onClick={handleCheckboxClick} className="flex items-center justify-center w-7 h-7">
                    <Checkbox
                        id={`select-${node.id}`}
                        checked={isSelectedForExport}
                        onCheckedChange={(checked) => onToggleSelection(node.id, !!checked)}
                        className="h-4 w-4 border-primary/40 data-[state=checked]:border-primary"
                    />
                </div>
            )}
            
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-transparent" onClick={handleTriggerClick}>
                    { (hasChildren || !isModule) ? (
                        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground", isNodeExpanded && "rotate-90")} />
                    ) : ( <div className="w-3.5 h-3.5"></div>)
                    }
                </Button>
            </CollapsibleTrigger>
            
            <div
                className={cn(
                    "flex-1 flex items-center min-w-0 cursor-pointer h-full px-1"
                )}
                onClick={handleNodeSelect}
            >
                <Icon className={cn(
                    "h-4 w-4 mr-2 shrink-0 transition-colors", 
                    (hasChildren || isModule) ? "text-primary/70" : "text-muted-foreground/60",
                    isSelected && !isSelectMode && "text-primary"
                )} />
                <span className="truncate text-[13px]">
                    <HighlightedText text={node.name} highlight={searchQuery} />
                </span>
                <div className="ml-auto flex items-center gap-1.5 opacity-60 group-hover/item:opacity-100 transition-opacity pr-1">
                    {node.isArchived && (
                        <Archive className="h-3 w-3 text-destructive" />
                    )}
                    {node.isBookmarked && (
                      <Bookmark className="h-3 w-3 fill-primary text-primary" />
                    )}
                </div>
            </div>
        </div>
      
      <CollapsibleContent>
            {hasChildren && isNodeExpanded && (
                <div className="space-y-0.5 mt-0.5">
                    {node.children?.map(child => (
                    <DefinitionTreeNode
                        key={child.id}
                        node={child}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        level={level + 1}
                        onToggleSelection={onToggleSelection}
                        isSelectedForExport={selectedForExport.includes(child.id)}
                        isSelectMode={isSelectMode}
                        selectedForExport={selectedForExport}
                        activeSection={activeSection}
                        searchQuery={searchQuery}
                    />
                    ))}
                </div>
            )}
            {!isModule && isSelected && isNodeExpanded && !isSelectMode && (
                <DefinitionSubItems definition={node} onSelect={onSelect} activeSection={activeSection} level={level}/>
            )}
      </CollapsibleContent>
    </Collapsible>
  );
}
