
"use client";
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import DefinitionTree from '@/components/wiki/definition-tree';
import DefinitionView from '@/components/wiki/definition-view';
import DefinitionEdit from '@/components/wiki/definition-edit';
import { initialDefinitions, findDefinition } from '@/lib/data';
import type { Definition, Notification as NotificationType } from '@/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { Filter, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { Checkbox } from '@/components/ui/checkbox';
import { trackSearch, trackView } from '@/lib/analytics';
import { useDebounce } from '@/hooks/use-debounce';
import AnalyticsModal from '@/components/wiki/analytics-modal';
import NewDefinitionModal from '@/components/wiki/new-definition-modal';
import TemplatesModal from '@/components/wiki/templates-modal';
import useLocalStorage from '@/hooks/use-local-storage';
import Notifications from '@/components/wiki/notifications';
import DataTables from '@/components/wiki/data-tables';
import { diff_match_patch } from 'diff-match-patch';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type View = 'definitions' | 'notifications' | 'data-tables';

export default function Home() {
  const [definitions, setDefinitions] = useLocalStorage<Definition[]>('definitions', initialDefinitions);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [searchQuery, setSearchQuery] = useState("");
  const { isMounted, bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);
  const [isExportMode, setIsExportMode] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isNewDefinitionModalOpen, setIsNewDefinitionModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeView, setActiveView] = useState<View>('definitions');
  const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('notifications', []);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (isMounted) {
      const urlParams = new URLSearchParams(window.location.search);
      const definitionId = urlParams.get('definitionId');
      const section = urlParams.get('section');
      const view = urlParams.get('view') as View;

      if (view && ['notifications', 'data-tables'].includes(view)) {
        setActiveView(view);
      } else if (definitionId) {
        handleSelectDefinition(definitionId, section || undefined);
      } else if (!selectedDefinitionId && activeView === 'definitions') {
        setSelectedDefinitionId('1.1.1');
      }
    }
  }, [isMounted, activeView]);

  const updateUrl = (definitionId: string, sectionId?: string, view?: View) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('definitionId');
    url.searchParams.delete('section');
    url.searchParams.delete('view');

    if (view) {
        url.searchParams.set('view', view);
    } else if (definitionId) {
        url.searchParams.set('definitionId', definitionId);
        if (sectionId) {
            url.searchParams.set('section', sectionId);
        }
    }
    window.history.pushState({}, '', url);
  };

  const handleNavigate = (view: View) => {
    setActiveView(view);
    setSelectedDefinitionId(null);
    updateUrl('', '', view);
  };
  
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
                results.push(item);
            } else if (item.children) {
                const selectedChildren = getSelectedDefinitions(item.children, selectedIds);
                if (selectedChildren.length > 0) {
                    results.push({ ...item, children: selectedChildren });
                }
            }
        });
        return results;
    };

    const definitionsToExport = getSelectedDefinitions(definitions, selectedForExport);
    
    const exportData = {
        disclaimer: `This is a copy of this definition as of ${new Date().toLocaleDateString()}. Please go to ${window.location.origin} to view the updated definition.`,
        data: definitionsToExport
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "definitions-export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setIsExportMode(false);
    setSelectedForExport([]);
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

  const handleSelectDefinition = useCallback((id: string, sectionId?: string) => {
    setActiveView('definitions');
    setIsEditing(false);
    setSelectedDefinitionId(id);
    
    const def = findDefinition(definitions, id);
    if (def) {
      trackView(id, def.name, def.module);
    }
    
    const targetSection = sectionId || 'description';
    setActiveTab(targetSection);
    updateUrl(id, targetSection);

    setTimeout(() => {
      const element = document.getElementById(`section-${targetSection}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [definitions]);

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      if (selectedDefinitionId) {
          updateUrl(selectedDefinitionId, tab);
      }
  };


  const handleSave = (updatedDefinition: Definition) => {
    const originalDefinition = findDefinition(definitions, updatedDefinition.id);
    
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

    // Create notification if bookmarked
    if (isBookmarked(updatedDefinition.id)) {
        let notifMessage = `Definition "${updatedDefinition.name}" was updated.`;
        
        const dmp = new diff_match_patch();
        const descriptionDiff = dmp.diff_main(originalDefinition?.description || '', updatedDefinition.description);
        const hasDescriptionChanges = descriptionDiff.some(d => d[0] !== 0);

        if (hasDescriptionChanges) {
             notifMessage = `The description of "${updatedDefinition.name}" was updated.`;
        }
        
        const oldNotesCount = originalDefinition?.notes?.length || 0;
        const newNotesCount = updatedDefinition.notes?.length || 0;
        if(newNotesCount > oldNotesCount) {
             notifMessage = `A new note was added to "${updatedDefinition.name}".`;
        }

        const newNotification: NotificationType = {
            id: Date.now().toString(),
            definitionId: updatedDefinition.id,
            definitionName: updatedDefinition.name,
            message: notifMessage,
            date: new Date().toISOString(),
            read: false,
        };
        setNotifications((prev: any) => [newNotification, ...prev]);
    }
  };
  
  const handleCreateDefinition = (newDefinitionData: Omit<Definition, 'id' | 'revisions' | 'isArchived'>) => {
    const newDefinition: Definition = {
        ...newDefinitionData,
        id: Date.now().toString(),
        revisions: [],
        isArchived: false,
        children: newDefinitionData.children || [],
        notes: [],
    };
  
    const addDefinitionToModule = (items: Definition[], moduleName: string, def: Definition): Definition[] => {
        return items.map(item => {
            if (item.name === moduleName && item.children) {
                return { ...item, children: [def, ...item.children] };
            }
            if (item.children) {
                return { ...item, children: addDefinitionToModule(item.children, moduleName, def) };
            }
            return item;
        });
    };

    setDefinitions(prev => {
        const parentModule = findDefinition(prev, newDefinitionData.module);
        
        if (parentModule) {
            return addDefinitionToModule(prev, parentModule.name, newDefinition);
        } else {
             const moduleExists = prev.some(m => m.name === newDefinition.module);
             if (moduleExists) {
                 return addDefinitionToModule(prev, newDefinition.module, newDefinition);
             } else {
                // If module doesn't exist, create it and add definition
                const newModule: Definition = {
                    id: `mod-${Date.now()}`,
                    name: newDefinition.module,
                    module: newDefinition.module, // self-reference for top level
                    keywords: [], description: '', revisions: [], isArchived: false, supportingTables: [], attachments: [], notes: [],
                    children: [newDefinition]
                };
                return [...prev, newModule];
             }
        }
    });

    setIsNewDefinitionModalOpen(false);
    setIsTemplatesModalOpen(false);
    setSelectedDefinitionId(newDefinition.id);
    setActiveView('definitions');
  };


  const handleSetIsEditing = (editing: boolean) => {
    setIsEditing(editing);
  }

  const handleDuplicate = (id: string) => {
    const definitionToDuplicate = findDefinition(definitions, id);
    if (!definitionToDuplicate) return;

    const newId = Date.now().toString();
    
    // Find parent module to place the duplicated item
    const findParentModule = (items: Definition[], childId: string): Definition | null => {
        for (const item of items) {
            if (item.children?.some(c => c.id === childId)) {
                return item;
            }
            if (item.children) {
                const found = findParentModule(item.children, childId);
                if (found) return found;
            }
        }
        return null;
    };
    
    const parentModule = findParentModule(definitions, id);

    const newDefinition: Omit<Definition, 'id' | 'revisions' | 'isArchived'> = {
      ...definitionToDuplicate,
      name: `${definitionToDuplicate.name} (Copy)`,
      children: [],
      // Use parent module or its own module if it's a top-level item
      module: parentModule ? parentModule.name : definitionToDuplicate.module,
    };
    
    handleCreateDefinition(newDefinition);
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
            
            if (nameMatch || keywordsMatch || children.length > 0) {
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
  }, [definitions, filteredDefinitions, showArchived, showBookmarked, searchQuery, isBookmarked]);

  const handleCancelExport = () => {
    setIsExportMode(false);
    setSelectedForExport([]);
  };

  if (!isMounted) {
    return null;
  }
  
  const renderContent = () => {
    switch (activeView) {
        case 'notifications':
            return <Notifications notifications={notifications} setNotifications={setNotifications} onDefinitionClick={(id) => handleSelectDefinition(id)} />;
        case 'data-tables':
            return <DataTables />;
        case 'definitions':
        default:
            return (
                isEditing && selectedDefinition ? (
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
                        onTabChange={handleTabChange}
                        onSave={handleSave}
                        isAdmin={isAdmin}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">
                            Select a definition to view its details.
                        </p>
                    </div>
                )
            );
    }
  }


  return (
    <div className='flex h-screen bg-background'>
      <SidebarProvider>
        <AppSidebar activeView={activeView} onNavigate={handleNavigate} />
        <SidebarInset>
          <div className="flex flex-col flex-1 h-screen">
              <AppHeader
                  isExportMode={isExportMode}
                  setIsExportMode={setIsExportMode}
                  handleExport={handleExport}
                  selectedCount={selectedForExport.length}
                  onAnalyticsClick={() => setIsAnalyticsModalOpen(true)}
                  onTemplatesClick={() => setIsTemplatesModalOpen(true)}
                  onNewDefinitionClick={() => setIsNewDefinitionModalOpen(true)}
                  isAdmin={isAdmin}
              />
              <main className="flex-1 flex overflow-hidden">
                  <div className="w-1/4 xl:w-1/5 border-r shrink-0 flex flex-col bg-card">
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
                                          onCheckedChange={() => setShowArchived(prev => !prev)}
                                      />
                                      <Label htmlFor="show-archived" className="font-normal">Show Archived</Label>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Checkbox
                                          id="show-bookmarked"
                                          className="mr-2"
                                          checked={showBookmarked}
                                          onCheckedChange={() => setShowBookmarked(prev => !prev)}
                                      />
                                      <Label htmlFor="show-bookmarked" className="font-normal">Show Bookmarked</Label>
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                      <div className="p-4 border-b">
                          <div className="flex items-center justify-between mb-2">
                              {isExportMode ? (
                                  <>
                                      <div className="flex items-center">
                                          <Checkbox
                                              id="select-all"
                                              checked={areAllSelected}
                                              onCheckedChange={handleSelectAllForExport}
                                              className="mr-2"
                                          />
                                          <Label htmlFor="select-all" className="font-semibold text-base">Select All</Label>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelExport}>
                                          <X className="h-4 w-4" />
                                      </Button>
                                  </>
                              ) : (
                                  <>
                                      <Label className="font-semibold text-lg">MPM Definitions</Label>
                                  </>
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
                              isExportMode={isExportMode}
                          />
                      </div>
                  </div>
                  <div className="w-full lg:w-3/4 xl:w-4/5 overflow-y-auto p-6" id="definition-content">
                      {renderContent()}
                  </div>
              </main>
          </div>
          </SidebarInset>
        </SidebarProvider>

          <Toaster />
          <AnalyticsModal open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen} onDefinitionClick={handleSelectDefinition} />
          <NewDefinitionModal
              open={isNewDefinitionModalOpen}
              onOpenChange={setIsNewDefinitionModalOpen}
              onSave={handleCreateDefinition}
          />
          <TemplatesModal
              open={isTemplatesModalOpen}
              onOpenChange={setIsTemplatesModalOpen}
              onUseTemplate={(templateData) => {
                  handleCreateDefinition(templateData as any);
              }}
          />
      </div>
  );
}

    