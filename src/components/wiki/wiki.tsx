"use client";
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import DefinitionTree from '@/components/wiki/definition-tree';
import DefinitionView from '@/components/wiki/definition-view';
import DefinitionEdit from '@/components/wiki/definition-edit';
import { initialDefinitions, findDefinition } from '@/lib/data';
import type { Definition, Notification as NotificationType, ActivityLog } from '@/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { Filter, Search, X, Download, FileText, FileJson, Archive, File, DatabaseZap, CheckSquare, ListTodo } from 'lucide-react';
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
import DataTables from '@/components/wiki/data-tables';
import ActivityLogs from '@/components/wiki/activity-logs';
import { diff_match_patch } from 'diff-match-patch';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

type View = 'definitions' | 'supporting-tables' | 'activity-logs';

const initialNotifications: NotificationType[] = [
  {
    id: '1',
    definitionId: '1.1.1',
    definitionName: 'Auth Decision Date',
    message: 'The description of "Auth Decision Date" was updated.',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: '2',
    definitionId: '2.1.1',
    definitionName: 'Contracted Rates',
    message: 'A new note was added to "Contracted Rates".',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: '3',
    definitionId: '3.1.1',
    definitionName: 'Provider Demographics',
    message: 'The attachments for "Provider Demographics" were updated.',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
];

export default function Wiki() {
  const [definitions, setDefinitions] = useLocalStorage<Definition[]>('definitions', initialDefinitions);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [searchQuery, setSearchQuery] = useState("");
  const { isMounted, bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isNewDefinitionModalOpen, setIsNewDefinitionModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeView, setActiveView] = useState<View>('definitions');
  const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('notifications', initialNotifications);
  const [draftedDefinitionData, setDraftedDefinitionData] = useState<Partial<Definition> | null>(null);
  const { toast } = useToast();
  const [isSelectMode, setIsSelectMode] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const handlePopState = useCallback(() => {
    if (isMounted) {
        const urlParams = new URLSearchParams(window.location.search);
        const definitionIdFromUrl = urlParams.get('definitionId');
        const sectionFromUrl = urlParams.get('section');
        const viewFromUrl = urlParams.get('view') as View;

        if (viewFromUrl) {
            handleNavigate(viewFromUrl, false);
        } else if (definitionIdFromUrl) {
            handleSelectDefinition(definitionIdFromUrl, sectionFromUrl || undefined, false);
        } else {
            setActiveView('definitions');
            handleSelectDefinition('1.1.1', undefined, false);
        }
    }
  }, [isMounted]);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    handlePopState();
    return () => {
        window.removeEventListener('popstate', handlePopState);
    };
  }, [isMounted, handlePopState]);

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
    window.history.pushState({}, '', url.toString());
  };

  const handleNavigate = (view: View, shouldUpdateUrl = true) => {
    if (view === 'activity-logs' && !isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can view activity logs.' });
        return;
    }
    setActiveView(view);
    if (view === 'definitions') {
        handleSelectDefinition('1.1.1', undefined, shouldUpdateUrl);
    } else {
        setSelectedDefinitionId(null);
        if(shouldUpdateUrl) {
            updateUrl('', '', view);
        }
    }
  };
  
  const getAllDefinitionIds = useCallback((items: Definition[]): string[] => {
    let ids: string[] = [];
    for (const item of items) {
        ids.push(item.id);
        if (item.children) {
            ids = [...ids, ...getAllDefinitionIds(item.children)];
        }
    }
    return ids;
  }, []);

  const allDefinitionIds = useMemo(() => getAllDefinitionIds(definitions), [definitions, getAllDefinitionIds]);

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

  const handleExport = (format: 'json' | 'pdf' | 'excel' | 'html') => {
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can export definitions.' });
        return;
    }
    const flatten = (items: Definition[]): Definition[] => {
        let flat: Definition[] = [];
        items.forEach(item => {
            flat.push(item);
            if (item.children) flat = [...flat, ...flatten(item.children)];
        });
        return flat;
    };
    
    const allFlat = flatten(definitions);
    const definitionsToExport = allFlat.filter(d => selectedForExport.includes(d.id));
    
    if (definitionsToExport.length === 0) return;

    switch (format) {
      case 'json':
        handleJsonExport(definitionsToExport);
        break;
      case 'pdf':
        handlePdfExport(definitionsToExport);
        break;
      case 'excel':
        handleExcelExport(definitionsToExport);
        break;
      case 'html':
        handleHtmlExport(definitionsToExport);
        break;
    }

    setSelectedForExport([]);
    setIsSelectMode(false);
  };

  const handleJsonExport = (data: Definition[]) => {
    const exportData = {
        disclaimer: `This is a copy of definitions as of ${new Date().toLocaleDateString()}. Please go to ${window.location.origin} to view the updated definitions.`,
        data: data
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "definitions-export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  const handlePdfExport = (data: Definition[]) => {
    const doc = new jsPDF();
    let y = 20;
    data.forEach((def, index) => {
      if (index > 0) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(def.name, 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = def.description;
      const text = doc.splitTextToSize(tempDiv.innerText, 170);
      doc.text(text, 20, y);
      y += text.length * 5 + 10;
    });
    doc.save(`definitions-export.pdf`);
  };

  const handleExcelExport = (data: Definition[]) => {
    const sheetData = data.map(def => ({
      ID: def.id,
      Name: def.name,
      Module: def.module,
      Keywords: def.keywords.join(', '),
      Description: def.description.replace(/<[^>]+>/g, ''),
      Archived: def.isArchived,
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Definitions');
    XLSX.writeFile(workbook, `definitions-export.xlsx`);
  };

  const handleHtmlExport = (data: Definition[]) => {
     const htmlContent = `
      <html>
        <head>
          <title>Definitions Export</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; padding: 2rem; }
            h1, h2 { color: #333; }
            .definition { border-bottom: 1px solid #ccc; padding-bottom: 1rem; margin-bottom: 1rem; }
            .keywords { font-style: italic; color: #777; }
          </style>
        </head>
        <body>
          <h1>Definitions Export</h1>
          <p>Exported on: ${new Date().toLocaleDateString()}</p>
          <hr/>
          ${data.map(def => `
            <div class="definition">
              <h2>${def.name}</h2>
              <p><strong>Module:</strong> ${def.module}</p>
              <div class="keywords"><strong>Keywords:</strong> ${def.keywords.join(', ')}</div>
              <div>${def.description}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `definitions-export.html`);
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

  const handleSelectDefinition = useCallback((id: string, sectionId?: string, shouldUpdateUrl = true) => {
    const isSameDefinition = id === selectedDefinitionId;
    setActiveView('definitions');
    setIsEditing(false);
    setSelectedDefinitionId(id);
    if (!isSameDefinition) {
        const def = findDefinition(definitions, id);
        if (def) trackView(id, def.name, def.module);
    }
    const targetSection = sectionId || 'description';
    setActiveTab(targetSection);
    if (shouldUpdateUrl) updateUrl(id, targetSection);
  }, [definitions, selectedDefinitionId]);

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      if (selectedDefinitionId) updateUrl(selectedDefinitionId, tab);
  };

  const handleSave = (updatedDefinition: Definition) => {
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can edit definitions.' });
        return;
    }
    const originalDefinition = findDefinition(definitions, updatedDefinition.id);
    const update = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (def.id === updatedDefinition.id) return updatedDefinition;
        if (def.children) return { ...def, children: update(def.children) };
        return def;
      });
    };
    setDefinitions(update(definitions));
    setIsEditing(false);

    if (isBookmarked(updatedDefinition.id)) {
        let notifMessage = `Definition "${updatedDefinition.name}" was updated.`;
        if (originalDefinition) {
            const dmp = new diff_match_patch();
            const descriptionDiff = dmp.diff_main(originalDefinition.description || '', updatedDefinition.description);
            const hasDescriptionChanges = descriptionDiff.some(d => d[0] !== 0);
            if (hasDescriptionChanges) notifMessage = `The description of "${updatedDefinition.name}" was updated.`;
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
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can create definitions.' });
        return;
    }
    const newDefinition: Definition = {
        ...newDefinitionData,
        id: Date.now().toString(),
        revisions: [],
        isArchived: false,
        children: newDefinitionData.children || [],
        notes: [],
        relatedDefinitions: [],
    };
    const addDefinitionToModule = (items: Definition[], moduleName: string, def: Definition): Definition[] => {
        return items.map(item => {
            if (item.name === moduleName && item.children) return { ...item, children: [def, ...item.children] };
            if (item.children) return { ...item, children: addDefinitionToModule(item.children, moduleName, def) };
            return item;
        });
    };
    setDefinitions(prev => {
        const parentModule = findDefinition(prev, newDefinitionData.module);
        if (parentModule) return addDefinitionToModule(prev, parentModule.name, newDefinition);
        const moduleExists = prev.some(m => m.name === newDefinition.module);
        if (moduleExists) return addDefinitionToModule(prev, newDefinition.module, newDefinition);
        const newModule: Definition = {
            id: `mod-${Date.now()}`, name: newDefinition.module, module: newDefinition.module,
            keywords: [], description: '', revisions: [], isArchived: false, supportingTables: [], attachments: [], notes: [],
            children: [newDefinition]
        };
        return [...prev, newModule];
    });
    setIsNewDefinitionModalOpen(false);
    setIsTemplatesModalOpen(false);
    setSelectedDefinitionId(newDefinition.id);
    setActiveView('definitions');
  };

  const handleDuplicate = (id: string) => {
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can duplicate definitions.' });
        return;
    }
    const definitionToDuplicate = findDefinition(definitions, id);
    if (!definitionToDuplicate) return;
    const newId = Date.now().toString();
    const findParentModule = (items: Definition[], childId: string): Definition | null => {
        for (const item of items) {
            if (item.children?.some(c => c.id === childId)) return item;
            if (item.children) {
                const found = findParentModule(item.children, childId);
                if (found) return found;
            }
        }
        return null;
    };
    const parentModule = findParentModule(definitions, id);
    const newDefinition: Omit<Definition, 'id' | 'revisions' | 'isArchived'> = {
      ...definitionToDuplicate, id: newId, name: `${definitionToDuplicate.name} (Copy)`, children: [],
      module: parentModule ? parentModule.name : definitionToDuplicate.module,
    };
    handleCreateDefinition(newDefinition);
    setSelectedDefinitionId(newId);
  };

  const handleArchive = (id: string, archive: boolean) => {
     if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can archive definitions.' });
        return;
    }
     const updateArchiveStatus = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (def.id === id) return { ...def, isArchived: archive };
        if (def.children) return { ...def, children: updateArchiveStatus(def.children) };
        return def;
      });
    };
    setDefinitions(updateArchiveStatus(definitions));
    if (selectedDefinitionId === id) setSelectedDefinitionId(null);
  };

  const handleBulkArchive = (archive: boolean) => {
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can bulk archive definitions.' });
        return;
    }
    if (selectedForExport.length === 0) return;
    const updateArchiveStatusRecursive = (items: Definition[]): Definition[] => {
      return items.map(def => {
        const newDef = { ...def };
        if (selectedForExport.includes(def.id)) newDef.isArchived = archive;
        if (newDef.children) newDef.children = updateArchiveStatusRecursive(newDef.children);
        return newDef;
      });
    };
    setDefinitions(updateArchiveStatusRecursive(definitions));
    toast({ title: 'Bulk Action Complete', description: `${selectedForExport.length} definitions updated.` });
    setSelectedForExport([]);
    setIsSelectMode(false);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can delete definitions.' });
        return;
    }
    const remove = (items: Definition[], idToDelete: string): Definition[] => {
      return items.filter(def => def.id !== idToDelete).map(def => {
          if (def.children) def.children = remove(def.children, idToDelete);
          return def;
        });
    };
    setDefinitions(prev => remove(prev, id));
    if (selectedDefinitionId === id) setSelectedDefinitionId(null);
  };

  const filteredDefinitions = useMemo(() => {
    const filterItems = (items: Definition[], query: string): Definition[] => {
        if (!query) return items;
        const lowerCaseQuery = query.toLowerCase();
        return items.reduce((acc: Definition[], item) => {
            const children = item.children ? filterItems(item.children, query) : [];
            const nameMatch = item.name.toLowerCase().includes(lowerCaseQuery);
            const keywordsMatch = item.keywords.some(k => k.toLowerCase().includes(lowerCaseQuery));
            if (nameMatch || keywordsMatch || children.length > 0) acc.push({ ...item, children });
            return acc;
        }, []);
    };
    return filterItems(definitions, searchQuery);
  }, [definitions, searchQuery]);

  const visibleDefinitions = useMemo(() => {
    let itemsToFilter = searchQuery ? filteredDefinitions : definitions;
    const mapBookmarkStatus = (items: Definition[]): Definition[] => {
        return items.map(item => ({
            ...item, isBookmarked: isBookmarked(item.id),
            children: item.children ? mapBookmarkStatus(item.children) : [],
        }));
    };
    const filterArchived = (items: Definition[]): Definition[] => {
      return items.filter(item => !item.isArchived || showArchived).map(item => {
        const children = item.children ? filterArchived(item.children) : [];
        return {...item, children};
      }).filter(item => item.children?.length > 0 || !item.isArchived || showArchived)
    }
    if (!showArchived) itemsToFilter = filterArchived(itemsToFilter);
    const filterBookmarked = (items: Definition[]): Definition[] => {
        return items.reduce((acc: Definition[], item) => {
            const children = item.children ? filterBookmarked(item.children) : [];
            if (item.isBookmarked || children.length > 0) acc.push({ ...item, children });
            return acc;
        }, []);
    };
    const itemsWithBookmarks = mapBookmarkStatus(itemsToFilter);
    if (showBookmarked) return filterBookmarked(itemsWithBookmarks);
    return itemsWithBookmarks;
  }, [definitions, filteredDefinitions, showArchived, showBookmarked, searchQuery, isBookmarked]);

  if (!isMounted) return null;

  const handleNewDefinitionClick = (type: 'template' | 'blank') => {
    if (type === 'template') setIsTemplatesModalOpen(true);
    else {
      setDraftedDefinitionData({ name: 'New Blank Definition', module: 'Core', keywords: [], description: '' });
      setIsNewDefinitionModalOpen(true);
    }
  };
  
  const handleUseTemplate = (templateData: Partial<Definition>) => {
      setDraftedDefinitionData(templateData);
      setIsNewDefinitionModalOpen(true);
      setIsTemplatesModalOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
        case 'supporting-tables': return <DataTables />;
        case 'activity-logs': return <ActivityLogs />;
        default: return (
                isEditing && selectedDefinition ? (
                    <DefinitionEdit definition={selectedDefinition} onSave={handleSave} onCancel={() => setIsEditing(false)} />
                ) : selectedDefinition ? (
                    <DefinitionView definition={selectedDefinition} onEdit={() => setIsEditing(true)} onDuplicate={handleDuplicate} onArchive={handleArchive} onDelete={handleDelete} onToggleBookmark={toggleBookmark} activeTab={activeTab} onTabChange={handleTabChange} onSave={handleSave} isAdmin={isAdmin} />
                ) : (
                    <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Select a definition to view its details.</p></div>
                )
            );
    }
  }

  const handleCancelSelection = () => {
    setIsSelectMode(false);
    setSelectedForExport([]);
  }

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onNavigate={handleNavigate} isAdmin={isAdmin} />
      <SidebarInset>
        <div className="flex flex-col h-screen bg-background">
          <AppHeader
              onAnalyticsClick={() => setIsAnalyticsModalOpen(true)}
              onNewDefinitionClick={handleNewDefinitionClick}
              isAdmin={isAdmin}
              notifications={notifications}
              setNotifications={setNotifications}
              onDefinitionClick={handleSelectDefinition}
              activeView={activeView}
          />
          <main className="flex-1 flex overflow-hidden">
             {activeView === 'definitions' && (
              <div className="w-1/4 xl:w-1/5 border-r shrink-0 flex flex-col bg-card relative">
                  <div className="p-4 border-b flex items-center justify-between">
                      <h2 className="font-bold text-lg">MPM Definitions</h2>
                      {!isSelectMode && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsSelectMode(true)}
                          className="h-8 px-2"
                        >
                          Select
                        </Button>
                      )}
                  </div>

                  <div className="p-3 border-b bg-card/95 backdrop-blur-sm sticky top-0 z-20 h-[60px] flex items-center">
                    {isSelectMode ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelSelection}>
                            <X className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium whitespace-nowrap">{selectedForExport.length} items</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {selectedForExport.length > 0 && (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8">Export</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExport('json')}>JSON</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExport('html')}>HTML</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button variant="outline" size="sm" className="h-8" onClick={() => handleBulkArchive(true)}>Archive</Button>
                            </>
                          )}
                          <div className="flex items-center gap-1.5 ml-1 border-l pl-2">
                             <Checkbox 
                                id="sidebar-select-all"
                                checked={selectedForExport.length === allDefinitionIds.length && allDefinitionIds.length > 0}
                                onCheckedChange={(checked) => setSelectedForExport(checked ? allDefinitionIds : [])}
                             />
                             <Label htmlFor="sidebar-select-all" className="text-xs font-normal">All</Label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search definitions..."
                                className="w-full h-9 rounded-lg bg-secondary pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 hover:bg-primary/10">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filters</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Checkbox
                                        id="show-archived"
                                        className="mr-2"
                                        checked={showArchived}
                                        onCheckedChange={() => setShowArchived(prev => !prev)}
                                    />
                                    <Label htmlFor="show-archived" className="font-normal cursor-pointer">Show Archived</Label>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Checkbox
                                        id="show-bookmarked"
                                        className="mr-2"
                                        checked={showBookmarked}
                                        onCheckedChange={() => setShowBookmarked(prev => !prev)}
                                    />
                                    <Label htmlFor="show-bookmarked" className="font-normal cursor-pointer">Show Bookmarked</Label>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1 p-2">
                      {visibleDefinitions.length > 0 ? (
                        <DefinitionTree
                            definitions={visibleDefinitions}
                            selectedId={selectedDefinitionId}
                            onSelect={handleSelectDefinition}
                            onToggleSelection={toggleSelectionForExport}
                            selectedForExport={selectedForExport}
                            isSelectMode={isSelectMode}
                            activeSection={activeTab}
                            searchQuery={searchQuery}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground py-12 px-4">
                            <p className="text-sm">No results found.</p>
                        </div>
                      )}
                  </div>
              </div>
             )}
              <div className="flex-1 w-full overflow-y-auto p-6" id="definition-content">
                  {renderContent()}
              </div>
          </main>
        </div>
      </SidebarInset>
      <Toaster />
      <AnalyticsModal open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen} onDefinitionClick={handleSelectDefinition} />
      <NewDefinitionModal
          open={isNewDefinitionModalOpen}
          onOpenChange={setIsNewDefinitionModalOpen}
          onSave={handleCreateDefinition}
          initialData={draftedDefinitionData}
      />
      <TemplatesModal
          open={isTemplatesModalOpen}
          onOpenChange={setIsTemplatesModalOpen}
          onUseTemplate={handleUseTemplate}
      />
    </SidebarProvider>
  );
}
