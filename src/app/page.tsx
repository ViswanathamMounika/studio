"use client";
import React, { useState, useMemo } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import DefinitionTree from '@/components/wiki/definition-tree';
import DefinitionView from '@/components/wiki/definition-view';
import DefinitionEdit from '@/components/wiki/definition-edit';
import { initialDefinitions, findDefinition } from '@/lib/data';
import type { Definition } from '@/lib/types';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  const [definitions, setDefinitions] = useState<Definition[]>(initialDefinitions);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>('1.1.1');
  const [isEditing, setIsEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const selectedDefinition = useMemo(() => {
    if (!selectedDefinitionId) return null;
    return findDefinition(definitions, selectedDefinitionId);
  }, [definitions, selectedDefinitionId]);

  const handleSelectDefinition = (id: string, sectionId?: string) => {
    setIsEditing(false);
    setSelectedDefinitionId(id);
    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }
  };

  const handleSave = (updatedDefinition: Definition) => {
    const update = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (def.id === updatedDefinition.id) {
          return updatedDefinition;
        }
        if (def.children) {
          return { ...def, children: update(def.children) };
        }
        return def;
      });
    };
    setDefinitions(update(definitions));
    setIsEditing(false);
  };

  const handleSetIsEditing = (editing: boolean) => {
    setIsEditing(editing);
  }

  const handleDuplicate = (id: string) => {
    const definitionToDuplicate = findDefinition(definitions, id);
    if (!definitionToDuplicate) return;

    const newId = Date.now().toString();
    const newDefinition: Definition = {
      ...definitionToDuplicate,
      id: newId,
      name: `${definitionToDuplicate.name} (Copy)`,
      children: [],
    };
    
    // This is a simplified insertion logic. A real app would be more complex.
    setDefinitions(prev => [...prev, newDefinition]);
    setSelectedDefinitionId(newId);
  };

  const handleArchive = (id: string, archive: boolean) => {
     const updateArchiveStatus = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (def.id === id) {
          return { ...def, isArchived: archive };
        }
        if (def.children) {
          return { ...def, children: updateArchiveStatus(def.children) };
        }
        return def;
      });
    };
    setDefinitions(updateArchiveStatus(definitions));
    if (selectedDefinitionId === id) {
        setSelectedDefinitionId(null);
    }
  };

  const visibleDefinitions = useMemo(() => {
    const filterArchived = (items: Definition[]): Definition[] => {
      return items.reduce((acc, def) => {
        if (def.isArchived === showArchived) {
          const children = def.children ? filterArchived(def.children) : [];
          acc.push({ ...def, children });
        } else if (def.children) {
          const children = filterArchived(def.children);
          if (children.length > 0) {
            acc.push({ ...def, children });
          }
        }
        return acc;
      }, [] as Definition[]);
    };

    return filterArchived(definitions);
  }, [definitions, showArchived]);


  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar showArchived={showArchived} setShowArchived={setShowArchived} />
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 flex overflow-hidden">
          <div className="w-1/4 border-r overflow-y-auto p-4">
            <DefinitionTree
              definitions={visibleDefinitions}
              selectedId={selectedDefinitionId}
              onSelect={handleSelectDefinition}
            />
          </div>
          <div className="w-3/4 overflow-y-auto p-6" id="definition-content">
            {isEditing && selectedDefinition ? (
              <DefinitionEdit
                definition={selectedDefinition}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : selectedDefinition ? (
              <DefinitionView
                definition={selectedDefinition}
                onEdit={() => setIsEditing(true)}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Select a definition to view its details.
                </p>
              </div>
            )}
          </div>
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
