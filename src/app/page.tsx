"use client";
import React, { useState, useMemo } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import DefinitionTree from '@/components/wiki/definition-tree';
import DefinitionView from '@/components/wiki/definition-view';
import DefinitionEdit from '@/components/wiki/definition-edit';
import { initialDefinitions, findDefinition } from '@/lib/data';
import type { Definition } from '@/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { Menu, Search } from 'lucide-react';
import { Logo } from '@/components/icons';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [definitions, setDefinitions] = useState<Definition[]>(initialDefinitions);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>('1.1.1');
  const [isEditing, setIsEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [searchQuery, setSearchQuery] = useState("");


  const selectedDefinition = useMemo(() => {
    if (!selectedDefinitionId) return null;
    return findDefinition(definitions, selectedDefinitionId);
  }, [definitions, selectedDefinitionId]);

  const handleSelectDefinition = (id: string, sectionId?: string) => {
    setIsEditing(false);
    setSelectedDefinitionId(id);
    if (sectionId) {
      const tabValue = sectionId.replace('section-', '');
      setActiveTab(tabValue);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
        setActiveTab('description');
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

  const filteredDefinitions = useMemo(() => {
    const filterItems = (items: Definition[], query: string): Definition[] => {
        if (!query) {
            return items;
        }

        const lowerCaseQuery = query.toLowerCase();

        return items.reduce((acc: Definition[], item) => {
            const children = item.children ? filterItems(item.children, query) : [];

            const nameMatch = item.name.toLowerCase().includes(lowerCaseQuery);
            const keywordsMatch = item.keywords.some(k => k.toLowerCase().includes(lowerCaseQuery));
            const descriptionMatch = item.description.toLowerCase().includes(lowerCaseQuery);
            const technicalDetailsMatch = item.technicalDetails.toLowerCase().includes(lowerCaseQuery);
            const examplesMatch = item.examples.toLowerCase().includes(lowerCaseQuery);
            const usageMatch = item.usage.toLowerCase().includes(lowerCaseQuery);

            if (nameMatch || keywordsMatch || descriptionMatch || technicalDetailsMatch || examplesMatch || usageMatch || children.length > 0) {
                acc.push({ ...item, children });
            }

            return acc;
        }, []);
    };

    return filterItems(definitions, searchQuery);
  }, [definitions, searchQuery]);

  const visibleDefinitions = useMemo(() => {
    const itemsToFilter = searchQuery ? filteredDefinitions : definitions;
    
    const filterArchived = (items: Definition[]) => {
      return items.filter(item => !item.isArchived || showArchived).map(item => ({
        ...item,
        children: item.children ? filterArchived(item.children) : []
      }))
    }

    if (showArchived) {
      return itemsToFilter;
    }

    return filterArchived(itemsToFilter);
  }, [definitions, filteredDefinitions, showArchived, searchQuery]);


  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar showArchived={showArchived} setShowArchived={setShowArchived} />
      </Sidebar>
      <SidebarInset>
        <AppHeader>
             <SidebarTrigger className="sm:hidden">
                <Menu />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden sm:flex h-7 w-7">
                  <Menu />
                </SidebarTrigger>
                <h1 className="text-xl font-bold tracking-tight">MPM Data Definitions</h1>
              </div>
        </AppHeader>
        <main className="flex-1 flex overflow-hidden">
          <div className="group-data-[state=collapsed]:-ml-64 sm:group-data-[state=collapsed]:-ml-0 w-1/4 xl:w-1/5 border-r shrink-0 transition-all duration-200 flex flex-col">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search definitions..." 
                      className="w-full rounded-lg bg-secondary pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
                <DefinitionTree
                definitions={visibleDefinitions}
                selectedId={selectedDefinitionId}
                onSelect={handleSelectDefinition}
                />
            </div>
          </div>
          <div className="w-full lg:w-3/4 xl:w-4/5 overflow-y-auto p-6" id="definition-content">
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
                activeTab={activeTab}
                onTabChange={setActiveTab}
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
