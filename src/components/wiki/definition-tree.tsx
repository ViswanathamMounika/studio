
"use client";

import React from 'react';
import type { Definition } from '@/lib/types';
import DefinitionTreeNode from './definition-tree-node';

type DefinitionTreeProps = {
  definitions: Definition[];
  selectedId: string | null;
  onSelect: (id: string, sectionId?: string) => void;
  onToggleSelection: (id: string, checked: boolean) => void;
  selectedForExport: string[];
  isSelectMode: boolean;
  activeSection: string;
  searchQuery: string;
  editLockId: string | null;
  treeId: string;
};

export default function DefinitionTree({ definitions, selectedId, onSelect, onToggleSelection, selectedForExport, isSelectMode, activeSection, searchQuery, editLockId, treeId }: DefinitionTreeProps) {
  return (
    <div className="space-y-1">
      {definitions.map(node => (
        <DefinitionTreeNode
          key={`${treeId}-${node.id}`}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          level={0}
          onToggleSelection={onToggleSelection}
          isSelectedForExport={selectedForExport.includes(node.id)}
          isSelectMode={isSelectMode}
          selectedForExport={selectedForExport}
          activeSection={activeSection}
          searchQuery={searchQuery}
          editLockId={editLockId}
        />
      ))}
    </div>
  );
}
