"use client";

import React from 'react';
import type { Definition } from '@/lib/types';
import DefinitionTreeNode from './definition-tree-node';

type DefinitionTreeProps = {
  definitions: Definition[];
  selectedId: string | null;
  onSelect: (id: string, sectionId?: string) => void;
};

export default function DefinitionTree({ definitions, selectedId, onSelect }: DefinitionTreeProps) {
  return (
    <div className="space-y-1">
      {definitions.map(node => (
        <DefinitionTreeNode
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          level={0}
        />
      ))}
    </div>
  );
}
