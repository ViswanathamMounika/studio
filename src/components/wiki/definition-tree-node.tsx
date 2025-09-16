"use client";

import React, { useState } from 'react';
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
  const hasChildren = node.children && node.children.length > 0;
  const isParentOfSelected = hasChildren && node.children.some(child => child.id === selectedId);

  // A node is a "section parent" if it's a leaf in the main definition tree (no children definitions)
  const isSectionParent = !hasChildren;

  const [sectionsOpen, setSectionsOpen] = useState(isSelected);

  const handleNodeSelect = () => {
    onSelect(node.id);
    if(isSectionParent) {
      setSectionsOpen(prev => !prev);
    }
  }

  return (
    <Collapsible open={hasChildren ? undefined : sectionsOpen} onOpenChange={isSectionParent ? setSectionsOpen: undefined} defaultOpen={level < 1 || isParentOfSelected || (isSelected && isSectionParent)}>
        <div className={cn("rounded-md", isSelected ? "bg-accent/20" : "")}>
          <div className="flex items-center w-full group/item">
              <CollapsibleTrigger asChild>
                  <Button
                      variant="ghost"
                      size="sm"
                      className={cn("w-full justify-start text-left", isSelected && "bg-accent/30 hover:bg-accent/40")}
                      style={{ paddingLeft: `${level * 1}rem` }}
                      onClick={handleNodeSelect}
                  >
                      {hasChildren || isSectionParent ? (
                          <ChevronRight className="h-4 w-4 mr-2 shrink-0 transition-transform duration-200" />
                      ) : (
                          <span className="w-4 h-4 mr-2 shrink-0"></span>
                      )}

                      {hasChildren ? (
                           <Folder className="h-4 w-4 mr-2 text-primary" />
                      ): (
                           <File className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      
                      <span className="truncate">{node.name}</span>
                  </Button>
              </CollapsibleTrigger>
          </div>
        
        {isSectionParent && (
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
