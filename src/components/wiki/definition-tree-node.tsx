
"use client";

import React, { useState, useEffect } from 'react';
import type { Definition } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, Folder, FileText, Bookmark, FileClock, Paperclip, MessageSquare, Link, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import RelatedDefinitions from './related-definitions';

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
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-300/50 rounded">
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

    const handleDefinitionClick = (id: string) => {
        onSelect(id, 'description');
    };

    return (
        <div className="space-y-1" style={{ paddingLeft: `${(level) * 1}rem` }}>
            {subItems.map(item => (
                <div
                    key={item.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(definition.id, item.id)
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

  return (
    <Collapsible open={isNodeExpanded} onOpenChange={setIsNodeExpanded}>
        <div 
            className={cn(
                "flex items-center w-full group/item rounded-md",
                !isSelectMode && "hover:bg-primary/10",
                isSelected && !isSelectMode && "bg-primary/10"
            )}
            style={{ paddingLeft: `${level * 1}rem` }}
        >
            <div onClick={handleCheckboxClick} className="p-2">
                <Checkbox
                    id={`select-${node.id}`}
                    checked={isSelectedForExport}
                    onCheckedChange={(checked) => onToggleSelection(node.id, !!checked)}
                    className={cn("mr-2", !isSelectMode && "opacity-0 group-hover/item:opacity-100 transition-opacity")}
                />
            </div>
            
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
                <span className="truncate flex-1"><HighlightedText text={node.name} highlight={searchQuery} /></span>
                {node.isArchived && !isSelectMode && (
                    <Archive className="h-4 w-4 shrink-0 text-muted-foreground ml-auto mr-1" />
                )}
                {node.isBookmarked && !isSelectMode && (
                  <Bookmark className="h-4 w-4 shrink-0 fill-primary text-primary ml-auto mr-1" />
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
                        isSelectMode={isSelectMode}
                        selectedForExport={selectedForExport}
                        activeSection={activeSection}
                        searchQuery={searchQuery}
                    />
                    ))}
                </div>
            )}
            {!isModule && isSelected && isNodeExpanded && (
                <DefinitionSubItems definition={node} onSelect={onSelect} activeSection={activeSection} level={level}/>
            )}
      </CollapsibleContent>
    </Collapsible>
  );
}
