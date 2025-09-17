
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
import { Filter, Menu, Search, Download } from 'lucide-react';
import { Logo } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { Checkbox } from '@/components/ui/checkbox';

export default function Home() {
  const [definitions, setDefinitions] = useState<Definition[]>(initialDefinitions);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>('1.1.1');
  const [isEditing, setIsEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [searchQuery, setSearchQuery] = useState("");
  const { isMounted, bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);

  const getAllDefinitionIds = (items: Definition[]): string[] => {
    let ids: string[] = [];
    for (const item of items) {
        ids.push(item.id);
        if (item.children) {
            ids = [...ids, ...getAllDefinitionIds(item.children)];
        }
    }
    return ids;
  };

  const allDefinitionIds = useMemo(() => getAllDefinitionIds(definitions), [definitions]);
  const areAllSelected = selectedForExport.length > 0 && allDefinitionIds.every(id => selectedForExport.includes(id));
  const isAnySelected = selectedForExport.length > 0;

  const handleSelectAllForExport = (checked: boolean) => {
    if (checked) {
        setSelectedForExport(allDefinitionIds);
    } else {
        setSelectedForExport([]);
    }
  };

  const toggleSelectionForExport = (id: string, checked: boolean) => {
    const getChildrenIds = (item: Definition): string[] => {
        let ids = [item.id];
        if (item.children) {
            item.children.forEach(child => {
                ids = [...ids, ...getChildrenIds(child)];
            });
        }
        return ids;
    };
    const definition = findDefinition(definitions, id);
    if (!definition) return;
    
    const idsToToggle = getChildrenIds(definition);
    
    setSelectedForExport(prev => {
        if (checked) {
            return [...new Set([...prev, ...idsToToggle])];
        } else {
            return prev.filter(selectedId => !idsToToggle.includes(selectedId));
        }
    });
  };

  const handleExport = () => {
    const getSelectedDefinitions = (items: Definition[], selectedIds: string[]): Definition[] => {
        const results: Definition[] = [];
        items.forEach(item => {
            const isSelected = selectedIds.includes(item.id);
            if (isSelected) {
                // If parent is selected, we take the whole object
                results.push(item);
            } else if (item.children) {
                // If parent is not selected, check children
                const selectedChildren = getSelectedDefinitions(item.children, selectedIds);
                if (selectedChildren.length > 0) {
                    // If some children are selected, create a new parent that only contains them
                    results.push({ ...item, children: selectedChildren });
                }
            }
        });
        return results;
    };

    const definitionsToExport = getSelectedDefinitions(definitions, selectedForExport);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(definitionsToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "definitions-export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const selectedDefinition = useMemo(() => {
    if (!selectedDefinitionId) return null;
    const def = findDefinition(definitions, selectedDefinitionId);
    if (!def) return null;
    return {
      ...def,
      isBookmarked: isBookmarked(def.id)
    }
  }, [definitions, selectedDefinitionId, isBookmarked]);

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

  const handleDelete = (id: string) => {
    const remove = (items: Definition[], idToDelete: string): Definition[] => {
      return items
        .filter(def => def.id !== idToDelete)
        .map(def => {
          if (def.children) {
            def.children = remove(def.children, idToDelete);
          }
          return def;
        });
    };
    
    setDefinitions(prev => remove(prev, id));
    
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
    let itemsToFilter = searchQuery ? filteredDefinitions : definitions;

    const mapBookmarkStatus = (items: Definition[]): Definition[] => {
        return items.map(item => ({
            ...item,
            isBookmarked: isBookmarked(item.id),
            children: item.children ? mapBookmarkStatus(item.children) : [],
        }));
    };
    
    const filterArchived = (items: Definition[]): Definition[] => {
      return items.filter(item => !item.isArchived || showArchived).map(item => {
        const children = item.children ? filterArchived(item.children) : [];
        if(children.length > 0 || !item.isArchived || showArchived) {
          return {...item, children};
        }
        return item;
      }).filter(item => item.children && item.children.length > 0 || !item.isArchived || showArchived)
    }

    if (!showArchived) {
      itemsToFilter = filterArchived(itemsToFilter);
    }
    
    const filterBookmarked = (items: Definition[]): Definition[] => {
        return items.reduce((acc: Definition[], item) => {
            const children = item.children ? filterBookmarked(item.children) : [];
            if (item.isBookmarked || children.length > 0) {
                acc.push({ ...item, children });
            }
            return acc;
        }, []);
    };
    
    const itemsWithBookmarks = mapBookmarkStatus(itemsToFilter);

    if (showBookmarked) {
        return filterBookmarked(itemsWithBookmarks);
    }

    return itemsWithBookmarks;
  }, [definitions, filteredDefinitions, showArchived, showBookmarked, searchQuery, isBookmarked, bookmarks]);


  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
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
            <div className="p-4 border-b flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search definitions..." 
                      className="w-full rounded-lg bg-secondary pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 hover:bg-primary/10">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filters</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Checkbox
                        id="show-archived"
                        className="mr-2"
                        checked={showArchived}
                        onCheckedChange={setShowArchived}
                      />
                      <Label htmlFor="show-archived" className="font-normal">Show Archived</Label>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                       <Checkbox
                        id="show-bookmarked"
                        className="mr-2"
                        checked={showBookmarked}
                        onCheckedChange={setShowBookmarked}
                      />
                      <Label htmlFor="show-bookmarked" className="font-normal">Show Bookmarked</Label>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <Checkbox 
                          id="select-all" 
                          checked={areAllSelected} 
                          onCheckedChange={handleSelectAllForExport} 
                          className="mr-2"
                        />
                        <Label htmlFor="select-all" className="font-semibold text-lg">MPM Definitions</Label>
                    </div>
                    {isAnySelected && (
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export ({selectedForExport.length})
                        </Button>
                    )}
                </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
                <DefinitionTree
                definitions={visibleDefinitions}
                selectedId={selectedDefinitionId}
                onSelect={handleSelectDefinition}
                onToggleSelection={toggleSelectionForExport}
                selectedForExport={selectedForExport}
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
                onDelete={handleDelete}
                onToggleBookmark={toggleBookmark}
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
