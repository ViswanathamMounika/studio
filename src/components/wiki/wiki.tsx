
"use client";
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { initialDefinitions, initialTemplates, findDefinition } from '@/lib/data';
import type { Definition, Notification as NotificationType, Template } from '@/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { Filter, Search, X, CheckSquare, Download, Archive, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { Checkbox } from '@/components/ui/checkbox';
import { trackSearch, trackView } from '@/lib/analytics';
import { useDebounce } from '@/hooks/use-debounce';
import useLocalStorage from '@/hooks/use-local-storage';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Dynamic imports
const DefinitionTree = dynamic(() => import('@/components/wiki/definition-tree'), { 
  ssr: false,
  loading: () => <div className="space-y-2 p-4"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-full"/></div>
});
const DefinitionView = dynamic(() => import('@/components/wiki/definition-view'), { 
  ssr: false,
  loading: () => <div className="space-y-4 p-6"><Skeleton className="h-12 w-1/2"/><Skeleton className="h-[400px] w-full"/></div>
});
const DefinitionEdit = dynamic(() => import('@/components/wiki/definition-edit'), { ssr: false });
const ActivityLogs = dynamic(() => import('@/components/wiki/activity-logs'), { ssr: false });
const AnalyticsModal = dynamic(() => import('@/components/wiki/analytics-modal'), { ssr: false });
const NewDefinitionModal = dynamic(() => import('@/components/wiki/new-definition-modal'), { ssr: false });
const TemplatesModal = dynamic(() => import('@/components/wiki/templates-modal'), { ssr: false });
const TemplateManagement = dynamic(() => import('@/components/wiki/template-management'), { ssr: false });

type View = 'definitions' | 'activity-logs' | 'template-management';

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
  const [templates, setTemplates] = useLocalStorage<Template[]>('managed_templates', initialTemplates);
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
    if ((view === 'activity-logs' || view === 'template-management') && !isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Access restricted to administrators.' });
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

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      if (selectedDefinitionId) updateUrl(selectedDefinitionId, tab);
  };

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

  const handleSave = (updatedDefinition: Definition) => {
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can edit definitions.' });
        return;
    }
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
        const newNotification: NotificationType = {
            id: Date.now().toString(),
            definitionId: updatedDefinition.id,
            definitionName: updatedDefinition.name,
            message: `Definition "${updatedDefinition.name}" was updated.`,
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

  const visibleDefinitionIds = useMemo(() => getAllDefinitionIds(visibleDefinitions), [visibleDefinitions, getAllDefinitionIds]);

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

  const handleExport = async (formatType: 'json' | 'pdf' | 'excel' | 'html') => {
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

    switch (formatType) {
      case 'json':
        handleJsonExport(definitionsToExport);
        break;
      case 'pdf':
        await handlePdfExport(definitionsToExport);
        break;
      case 'excel':
        await handleExcelExport(definitionsToExport);
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

  const handlePdfExport = async (data: Definition[]) => {
    const { default: jsPDF } = await import('jspdf');
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

  const handleExcelExport = async (data: Definition[]) => {
    const XLSX = await import('xlsx');
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

  const handleCancelSelection = () => {
    setIsSelectMode(false);
    setSelectedForExport([]);
  }

  const renderContent = () => {
    switch (activeView) {
        case 'activity-logs': return <ActivityLogs />;
        case 'template-management': return <TemplateManagement templates={templates} onSaveTemplates={setTemplates} />;
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

  if (!isMounted) return null;

  const handleNewDefinitionClick = (type: 'template' | 'blank') => {
    if (type === 'template') setIsTemplatesModalOpen(true);
    else {
      setDraftedDefinitionData({ name: 'New Blank Definition', module: 'Core', keywords: [], description: '' });
      setIsNewDefinitionModalOpen(true);
    }
  };
  
  const handleUseTemplate = (templateData: Partial<Definition>, templateId?: string) => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const dynamicSections = template.sections.map(s => ({
          sectionId: s.id,
          name: s.name,
          content: '',
          contentType: s.contentType,
          isMandatory: s.isMandatory,
          order: s.order
        }));
        setDraftedDefinitionData({ 
          ...templateData, 
          templateId: template.id,
          dynamicSections 
        });
      } else {
        setDraftedDefinitionData(templateData);
      }
      setIsNewDefinitionModalOpen(true);
      setIsTemplatesModalOpen(false);
  };

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
                  <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                      <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">MPM Definitions</h2>
                      {!isSelectMode && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsSelectMode(true)}
                          className="h-7 px-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                        >
                          <CheckSquare className="h-3.5 w-3.5 mr-1" />
                          Select
                        </Button>
                      )}
                  </div>

                  <div className="p-3 border-b bg-background sticky top-0 z-20 h-[60px] flex items-center shadow-sm">
                    {isSelectMode ? (
                      <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={handleCancelSelection}>
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold leading-none">{selectedForExport.length}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Selected</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {selectedForExport.length > 0 && (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="default" size="sm" className="h-8 px-2 text-xs shadow-md">
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Export
                                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF Document</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExport('json')}>JSON Data</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExport('excel')}>Excel Spreadsheet</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExport('html')}>HTML Page</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button variant="outline" size="sm" className="h-8 px-2 text-xs border-dashed" onClick={() => handleBulkArchive(true)}>
                                <Archive className="h-3.5 w-3.5 mr-1" />
                                Archive
                              </Button>
                            </>
                          )}
                          <div className="flex items-center gap-1.5 ml-1 border-l pl-2">
                             <Checkbox 
                                id="sidebar-select-all"
                                checked={visibleDefinitionIds.length > 0 && selectedForExport.length === visibleDefinitionIds.length}
                                onCheckedChange={(checked) => setSelectedForExport(checked ? visibleDefinitionIds : [])}
                                className="h-4 w-4 border-primary/50"
                             />
                             <Label htmlFor="sidebar-select-all" className="text-[10px] font-bold uppercase cursor-pointer">All</Label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full animate-in fade-in">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search definitions..."
                                className="w-full h-9 rounded-lg bg-muted/50 pl-8 focus-visible:bg-background border-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:bg-muted">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
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
                        <div className="text-center text-muted-foreground py-12 px-4 flex flex-col items-center">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                              <Search className="h-5 w-5 opacity-20" />
                            </div>
                            <p className="text-xs font-medium">No results found for "{searchQuery}"</p>
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
          templates={templates}
      />
      <TemplatesModal
          open={isTemplatesModalOpen}
          onOpenChange={setIsTemplatesModalOpen}
          onUseTemplate={handleUseTemplate}
          managedTemplates={templates}
      />
    </SidebarProvider>
  );
}
