
"use client";
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { initialDefinitions, initialTemplates, findDefinition } from '@/lib/data';
import type { Definition, Notification as NotificationType, Template, DiscussionMessage } from '@/lib/types';
import { Search, X, Download, Archive, ChevronDown, Lock, Info, ListFilter, Check, FileJson, FileText, FileSpreadsheet, FileCode, Send, ShieldCheck, Clock, Settings2, FolderTree } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { Checkbox } from '@/components/ui/checkbox';
import { trackSearch, trackView } from '@/lib/analytics';
import { useDebounce } from '@/hooks/use-debounce';
import useLocalStorage from '@/hooks/use-local-storage';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';

// Dynamic imports for heavy components
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
const RecentViewsModal = dynamic(() => import('@/components/wiki/recent-views-modal'), { ssr: false });
const NewDefinitionModal = dynamic(() => import('@/components/wiki/new-definition-modal'), { ssr: false });
const TemplatesModal = dynamic(() => import('@/components/wiki/templates-modal'), { ssr: false });
const TemplateManagement = dynamic(() => import('@/components/wiki/template-management'), { ssr: false });

type View = 'definitions' | 'activity-logs' | 'template-management';
type SidebarTab = 'queue' | 'drafts';

const currentUser = {
    id: "user_123",
    name: "Dhilip Sagadevan",
    avatar: "https://picsum.photos/seed/dhilip/40/40"
};

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
];

export default function Wiki() {
  // Use v6 keys to ensure users see the latest module restructure and sample data
  const [definitions, setDefinitions] = useLocalStorage<Definition[]>('definitions_v6', initialDefinitions);
  const [templates, setTemplates] = useLocalStorage<Template[]>('managed_templates_v6', initialTemplates);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [searchQuery, setSearchQuery] = useState("");
  const { isMounted, bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const [isNewDefinitionModalOpen, setIsNewDefinitionModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useLocalStorage<boolean>('mpm_user_role_admin_v6', true);
  const [activeView, setActiveView] = useState<View>('definitions');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('queue');
  const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('notifications_v6', initialNotifications);
  const [draftedDefinitionData, setDraftedDefinitionData] = useState<Partial<Definition> | null>(null);
  const { toast } = useToast();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [editLockId, setEditLockId] = useLocalStorage<string | null>('mpm_edit_lock_v6', null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const getStatusText = useCallback((def: Definition) => {
    if (def.isArchived) return 'Archived';
    if (def.isPendingApproval) return 'Pending Approval';
    if (def.isDraft) return 'Draft';
    return 'Published';
  }, []);

  const updateUrl = useCallback((definitionId: string, sectionId?: string, view?: View) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('definitionId');
    url.searchParams.delete('section');
    url.searchParams.delete('view');

    if (view && view !== 'definitions') {
        url.searchParams.set('view', view);
    } else if (definitionId) {
        url.searchParams.set('definitionId', definitionId);
        if (sectionId) {
            url.searchParams.set('section', sectionId);
        }
    }
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (selectedDefinitionId) {
        updateUrl(selectedDefinitionId, tab);
    }
  }, [selectedDefinitionId, updateUrl]);

  const handleSelectDefinition = useCallback((id: string, sectionId?: string, shouldUpdateUrl = true) => {
    const isSameDefinition = id === selectedDefinitionId;
    setActiveView('definitions');
    
    if (id === editLockId) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
    
    setSelectedDefinitionId(id);
    if (!isSameDefinition) {
        const def = findDefinition(definitions, id);
        if (def) {
            const status = getStatusText(def);
            trackView(id, def.name, def.module, status);
        }
    }
    const targetSection = sectionId || 'description';
    setActiveTab(targetSection);
    if (shouldUpdateUrl) updateUrl(id, targetSection);
  }, [definitions, selectedDefinitionId, editLockId, updateUrl, getStatusText]);

  const handleNavigate = useCallback((view: View, shouldUpdateUrl = true) => {
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
  }, [isAdmin, toast, handleSelectDefinition, updateUrl]);

  const handlePopState = useCallback(() => {
    if (isMounted) {
        const urlParams = new URLSearchParams(window.location.search);
        const definitionIdFromUrl = urlParams.get('definitionId');
        const sectionFromUrl = urlParams.get('section');
        const viewFromUrl = urlParams.get('view') as View;

        if (viewFromUrl && viewFromUrl !== 'definitions') {
            handleNavigate(viewFromUrl, false);
        } else if (definitionIdFromUrl) {
            handleSelectDefinition(definitionIdFromUrl, sectionFromUrl || undefined, false);
        } else {
            setActiveView('definitions');
            handleSelectDefinition('1.1.1', undefined, false);
        }
    }
  }, [isMounted, handleNavigate, handleSelectDefinition]);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    handlePopState();
    return () => {
        window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState]);

  useEffect(() => {
    if (selectedDefinitionId && selectedDefinitionId === editLockId) {
      setIsEditing(true);
    }
  }, [selectedDefinitionId, editLockId]);

  const handleSave = (updatedDefinition: Definition) => {
    const updateItems = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (def.id === updatedDefinition.id) return updatedDefinition;
        if (def.children) return { ...def, children: updateItems(def.children) };
        return def;
      });
    };
    setDefinitions(updateItems(definitions));
    setIsEditing(false);
    setEditLockId(null);

    if (isBookmarked(updatedDefinition.id)) {
        const newNotification: NotificationType = {
            id: Date.now().toString(),
            definitionId: updatedDefinition.id,
            definitionName: updatedDefinition.name,
            message: `Definition "${updatedDefinition.name}" was updated by ${currentUser.name}.`,
            date: new Date().toISOString(),
            read: false,
        };
        setNotifications((prev: any) => [newNotification, ...prev]);
    }
  };
  
  const handleCreateDefinition = (newDefinitionData: Omit<Definition, 'id' | 'revisions' | 'isArchived'>) => {
    const newId = Date.now().toString();
    
    // If user clicked "Submit" (isDraft is false) and they aren't admin, it's pending
    const isPending = !newDefinitionData.isDraft && !isAdmin;
    
    const newDefinition: Definition = {
        ...newDefinitionData,
        id: newId,
        isPendingApproval: isPending,
        isDraft: newDefinitionData.isDraft || isPending, // Treat pending as a draft variant for now
        revisions: [],
        isArchived: false,
        children: [],
        notes: [],
        discussions: [],
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
        const moduleExists = prev.some(m => m.name === newDefinition.module);
        if (moduleExists) return addDefinitionToModule(prev, newDefinition.module, newDefinition);
        const newModule: Definition = {
            id: `mod-${Date.now()}`, name: newDefinition.module, module: newDefinition.module,
            keywords: [], description: '', revisions: [], isArchived: false, supportingTables: [], attachments: [], notes: [], discussions: [],
            children: [newDefinition]
        };
        return [...prev, newModule];
    });
    setIsNewDefinitionModalOpen(false);
    setIsTemplatesModalOpen(false);
    setSelectedDefinitionId(newId);
    setActiveView('definitions');
    
    if (isPending) {
      toast({ title: 'Submitted', description: 'Your new definition has been sent for approval.' });
    }
  };

  const handleDuplicate = (id: string) => {
    const definitionToDuplicate = findDefinition(definitions, id);
    if (!definitionToDuplicate) return;
    const newId = Date.now().toString();
    const newDefinition: Omit<Definition, 'id' | 'revisions' | 'isArchived'> = {
      ...definitionToDuplicate, id: newId, name: `${definitionToDuplicate.name} (Copy)`, children: [],
    };
    handleCreateDefinition(newDefinition);
  };

  const handleArchive = (id: string | string[], archive: boolean) => {
     const ids = Array.isArray(id) ? id : [id];
     const updateArchiveStatus = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (ids.includes(def.id)) {
          return { ...def, isArchived: archive };
        }
        if (def.children) return { ...def, children: updateArchiveStatus(def.children) };
        return def;
      });
    };
    setDefinitions(updateArchiveStatus(definitions));
    toast({ 
      title: archive ? 'Definition Archived' : 'Definition Unarchived', 
      description: archive ? 'The definition has been moved to Archive.' : 'The definition has been removed from Archive.' 
    });
  };

  const handleDelete = (id: string) => {
    const remove = (items: Definition[], idToDelete: string): Definition[] => {
      return items.filter(def => def.id !== idToDelete).map(def => {
          if (def.children) def.children = remove(def.children, idToDelete);
          return def;
        });
    };
    setDefinitions(prev => remove(prev, id));
    if (selectedDefinitionId === id) setSelectedDefinitionId(null);
  };

  const handlePublish = (id: string) => {
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can publish definitions.' });
        return;
    }
    const publishItem = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (def.id === id) return { ...def, isDraft: false, isPendingApproval: false };
        if (def.children) return { ...def, children: publishItem(def.children) };
        return def;
      });
    };
    setDefinitions(publishItem(definitions));
    toast({ title: 'Definition Published', description: 'The definition is now available in the MPM Wiki.' });
  };

  const handleRequestApproval = (id: string) => {
    const updateItem = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (def.id === id) return { ...def, isPendingApproval: true };
        if (def.children) return { ...def, children: updateItem(def.children) };
        return def;
      });
    };
    setDefinitions(updateItem(definitions));
    toast({ title: 'Submitted', description: 'Your definition has been submitted for approval.' });
  };

  const handleReject = (id: string, requestData?: { content: string; priority?: 'Low' | 'Medium' | 'High'; isRejection?: boolean }) => {
    if (!isAdmin) return;
    
    const updateItem = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (def.id === id) {
          const updatedDiscussions = [...(def.discussions || [])];
          if (requestData) {
            const newMessage: DiscussionMessage = {
              id: Date.now().toString(),
              authorId: currentUser.id,
              author: currentUser.name,
              avatar: currentUser.avatar,
              date: new Date().toISOString(),
              content: requestData.content,
              type: requestData.isRejection ? 'rejection' : 'change-request',
              priority: requestData.priority,
              round: 1
            };
            updatedDiscussions.push(newMessage);
          }
          return { ...def, isPendingApproval: false, discussions: updatedDiscussions };
        }
        if (def.children) return { ...def, children: updateItem(def.children) };
        return def;
      });
    };
    setDefinitions(updateItem(definitions));
    toast({ 
        title: requestData?.isRejection ? 'Definition Rejected' : 'Changes Requested', 
        description: `The definition has been returned to draft status with feedback.` 
    });
  };

  const enrichedDefinitions = useMemo(() => {
    const enrich = (items: Definition[]): Definition[] => {
      return items.map(item => ({
        ...item,
        isBookmarked: isBookmarked(item.id),
        children: item.children ? enrich(item.children) : []
      }));
    };
    return enrich(definitions);
  }, [definitions, bookmarks, isBookmarked]);

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
    return filterItems(enrichedDefinitions, searchQuery);
  }, [enrichedDefinitions, searchQuery]);

  const categorizedDefinitions = useMemo(() => {
    // Search only affects the published definitions
    const itemsForPublished = searchQuery ? filteredDefinitions : enrichedDefinitions;
    // Workflow items (Queue/Drafts) ignore the search query
    const itemsForWorkflow = enrichedDefinitions;

    const filterByDraft = (items: Definition[], isDraft: boolean): Definition[] => {
        return items.reduce((acc: Definition[], item) => {
            const children = item.children ? filterByDraft(item.children, isDraft) : [];
            const isMatch = isDraft ? (item.isDraft === true && !item.isPendingApproval) : (item.isDraft === false || item.isDraft === undefined);
            if (children.length > 0 || (isMatch && (item.description || item.shortDescription))) {
                acc.push({ ...item, children });
            }
            return acc;
        }, []);
    };

    const filterPending = (items: Definition[]): Definition[] => {
        return items.reduce((acc: Definition[], item) => {
            const children = item.children ? filterPending(item.children) : [];
            const isSelfPending = item.isPendingApproval === true;
            if (children.length > 0 || isSelfPending) {
                acc.push({ ...item, children });
            }
            return acc;
        }, []);
    }

    const filterBookmarked = (items: Definition[]): Definition[] => {
        return items.reduce((acc: Definition[], item) => {
            const children = filterBookmarked(item.children || []);
            if (isBookmarked(item.id) || children.length > 0) acc.push({ ...item, children });
            return acc;
        }, []);
    };

    let processedPublished = itemsForPublished;
    
    // Filter by Archived status (Exclusive behavior)
    if (showArchived) {
        // Exclusive: Only show archived (and their module parents)
        const getOnlyArchived = (items: Definition[]): Definition[] => {
            return items.reduce((acc: Definition[], item) => {
                const children = getOnlyArchived(item.children || []);
                if (item.isArchived || children.length > 0) {
                    acc.push({ ...item, children });
                }
                return acc;
            }, []);
        };
        processedPublished = getOnlyArchived(processedPublished);
    } else {
        // Standard: Hide archived items completely
        const getHideArchived = (items: Definition[]): Definition[] => {
            return items.reduce((acc: Definition[], item) => {
                if (item.isArchived) return acc;
                const children = getHideArchived(item.children || []);
                acc.push({ ...item, children });
                return acc;
            }, []);
        };
        processedPublished = getHideArchived(processedPublished);
    }

    // Filter by Bookmarked status
    if (showBookmarked) {
        processedPublished = filterBookmarked(processedPublished);
    }

    return {
        drafts: filterByDraft(itemsForWorkflow, true),
        published: filterByDraft(processedPublished, false),
        pending: filterPending(itemsForWorkflow)
    };
  }, [enrichedDefinitions, filteredDefinitions, showArchived, showBookmarked, searchQuery, isBookmarked]);

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
        if (checked) return [...new Set([...prev, ...idsToToggle])];
        return prev.filter(selectedId => !idsToToggle.includes(selectedId));
    });
  };

  const handleExport = async (formatType: 'pdf' | 'json' | 'xlsx' | 'html') => {
    const flatten = (items: Definition[]): Definition[] => {
        let flat: Definition[] = [];
        items.forEach(item => {
            flat.push(item);
            if (item.children) flat = [...flat, ...flatten(item.children)];
        });
        return flat;
    };
    const definitionsToExport = flatten(definitions).filter(d => selectedForExport.includes(d.id));
    if (definitionsToExport.length === 0) return;

    if (formatType === 'json') {
        const exportData = {
            exportDate: new Date().toISOString(),
            definitions: definitionsToExport
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `bulk-export-${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast({ title: 'Export Success', description: 'Definitions exported to JSON.' });
    } else if (formatType === 'pdf') {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        let y = 20;
        definitionsToExport.forEach((def, index) => {
          if (index > 0) { doc.addPage(); y = 20; }
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
        doc.save(`bulk-export-${Date.now()}.pdf`);
        toast({ title: 'Export Success', description: 'Definitions exported to PDF.' });
    } else if (formatType === 'xlsx') {
        const XLSX = await import('xlsx');
        const data = definitionsToExport.map(def => ({
            ID: def.id,
            Name: def.name,
            Module: def.module,
            Keywords: def.keywords.join(', '),
            Description: def.description.replace(/<[^>]+>/g, ''),
            Archived: def.isArchived,
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Definitions');
        XLSX.writeFile(workbook, `bulk-export-${Date.now()}.xlsx`);
        toast({ title: 'Export Success', description: 'Definitions exported to Excel.' });
    } else if (formatType === 'html') {
        let htmlContent = `<html><head><title>Bulk Export</title><style>body { font-family: sans-serif; line-height: 1.6; padding: 2rem; } h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; } .def-block { margin-bottom: 4rem; } .keywords { font-style: italic; color: #777; }</style></head><body>`;
        definitionsToExport.forEach(def => {
            htmlContent += `
              <div class="def-block">
                <h1>${def.name}</h1>
                <p><strong>Module:</strong> ${def.module}</p>
                <div class="keywords"><strong>Keywords:</strong> ${def.keywords.join(', ')}</div>
                <hr/>
                ${def.description}
                ${def.technicalDetails ? `<h3>Technical Details</h3>${def.technicalDetails}` : ''}
                ${def.usageExamples ? `<h3>Usage Examples</h3>${def.usageExamples}` : ''}
              </div>
            `;
        });
        htmlContent += `</body></html>`;
        const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `bulk-export-${Date.now()}.html`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast({ title: 'Export Success', description: 'Definitions exported to HTML.' });
    }

    setSelectedForExport([]);
    setIsSelectMode(false);
  };

  const selectedDefinition = useMemo(() => {
    if (!selectedDefinitionId) return null;
    const def = findDefinition(definitions, selectedDefinitionId);
    if (!def) return null;
    return { ...def, isBookmarked: isBookmarked(def.id) };
  }, [definitions, selectedDefinitionId, isBookmarked]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditLockId(selectedDefinitionId);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditLockId(null);
  };

  const handleCancelResume = () => {
    setEditLockId(null);
  };

  const renderContent = () => {
    switch (activeView) {
        case 'activity-logs': return <div className="p-6"><ActivityLogs /></div>;
        case 'template-management': return <div className="p-6"><TemplateManagement templates={templates} onSaveTemplates={setTemplates} /></div>;
        default: return (
                <div className="relative">
                  {/* Sticky Header for Status Messages (View Mode Only) */}
                  {editLockId === selectedDefinitionId && !isEditing && (
                    <div className="sticky top-0 z-30 bg-background px-6 py-4 border-b shadow-sm">
                        <Alert className="bg-primary/5 border-primary/20">
                          <Lock className="h-4 w-4 text-primary" />
                          <AlertTitle className="text-primary font-bold">Edit Mode Active</AlertTitle>
                          <AlertDescription className="text-muted-foreground flex items-center justify-between">
                            <span>This definition is currently being modified. Your session is locked.</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Resume Editing</Button>
                                <Button variant="ghost" size="sm" onClick={handleCancelResume}>Dismiss Lock</Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                    </div>
                  )}
                  
                  {isEditing && selectedDefinition ? (
                      <DefinitionEdit 
                        definition={selectedDefinition} 
                        onSave={handleSave} 
                        onCancel={handleCancelEdit} 
                        isAdmin={isAdmin}
                      />
                  ) : selectedDefinition ? (
                      <div className="p-6">
                        <DefinitionView 
                          definition={selectedDefinition} 
                          allDefinitions={definitions}
                          onEdit={handleEditClick} 
                          onDuplicate={handleDuplicate} 
                          onArchive={handleArchive} 
                          onDelete={handleDelete} 
                          onToggleBookmark={toggleBookmark} 
                          onPublish={handlePublish}
                          onReject={handleReject}
                          onSendApproval={handleRequestApproval}
                          activeTab={activeTab} 
                          onTabChange={handleTabChange} 
                          onSave={handleSave} 
                          isAdmin={isAdmin}
                          searchQuery={searchQuery}
                        />
                      </div>
                  ) : (
                      <div className="flex items-center justify-center h-full min-h-[400px]"><p className="text-muted-foreground">Select a definition to view its details.</p></div>
                  )}
                </div>
            );
    }
  }

  const handleNewDefinitionClick = (type: 'template' | 'blank') => {
    if (type === 'template') {
      setIsTemplatesModalOpen(true);
    } else {
      setDraftedDefinitionData({ name: 'New Standard Definition', module: 'Core', keywords: [], description: '' });
      setIsNewDefinitionModalOpen(true);
    }
  };
  
  const handleUseTemplate = (templateData: Partial<Definition>, templateId?: string) => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setDraftedDefinitionData({ 
          ...templateData, 
          templateId: template.id,
          attachments: template.defaultAttachments || []
        });
      } else {
        setDraftedDefinitionData(templateData);
      }
      setIsNewDefinitionModalOpen(true);
      setIsTemplatesModalOpen(false);
  };

  if (!isMounted) return null;

  // Count total leaf definitions pending approval
  const countLeafPending = (items: Definition[]): number => {
    return items.reduce((acc, item) => {
      const isPendingLeaf = item.isPendingApproval && (item.description || item.shortDescription);
      return acc + (isPendingLeaf ? 1 : 0) + (item.children ? countLeafPending(item.children) : 0);
    }, 0);
  };
  const totalPendingCount = countLeafPending(categorizedDefinitions.pending);

  // Count total leaf definitions in drafts
  const countLeafDrafts = (items: Definition[]): number => {
    return items.reduce((acc, item) => {
      const isDraftLeaf = item.isDraft && !item.isPendingApproval && (item.description || item.shortDescription);
      return acc + (isDraftLeaf ? 1 : 0) + (item.children ? countLeafDrafts(item.children) : 0);
    }, 0);
  };
  const totalDraftCount = countLeafDrafts(categorizedDefinitions.drafts);

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onNavigate={handleNavigate} isAdmin={isAdmin} />
      <SidebarInset>
        <div className="flex flex-col h-screen bg-background">
          <AppHeader
              onRecentClick={() => setIsRecentModalOpen(true)}
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
                  <div className="p-4 flex flex-col gap-4 border-b bg-background sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold tracking-tight">MPM Data Definitions</h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search definitions..."
                            className="w-full h-10 rounded-md bg-muted/50 pl-8 focus-visible:bg-background border-muted"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button 
                      variant="outline" 
                      className={cn("w-full justify-center h-10 font-semibold gap-2 border-muted", isSelectMode && "bg-primary text-primary-foreground border-primary")}
                      onClick={() => setIsSelectMode(!isSelectMode)}
                    >
                      <ListFilter className="h-4 w-4" />
                      Bulk Actions
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                      {/* Workflow Switcher (Approval Queue/Drafts) */}
                      <div className="p-4 space-y-3 bg-muted/10 border-b">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workflow Queue</h2>
                        </div>
                        <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full p-1 border shadow-inner">
                            <button 
                                onClick={() => setSidebarTab('queue')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[11px] font-bold transition-all relative whitespace-nowrap",
                                    sidebarTab === 'queue' ? "bg-white dark:bg-muted shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Approval Queue
                                {totalPendingCount > 0 && (
                                    <span className="bg-destructive text-white h-4 min-w-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold animate-pulse">
                                        {totalPendingCount}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => setSidebarTab('drafts')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[11px] font-bold transition-all relative whitespace-nowrap",
                                    sidebarTab === 'drafts' ? "bg-white dark:bg-muted shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Drafts
                                {totalDraftCount > 0 && (
                                    <span className="bg-primary/10 text-primary h-4 min-w-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold">
                                        {totalDraftCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="pt-2">
                            {sidebarTab === 'queue' ? (
                                categorizedDefinitions.pending.length > 0 ? (
                                    <DefinitionTree
                                        treeId="queue"
                                        definitions={categorizedDefinitions.pending}
                                        selectedId={selectedDefinitionId}
                                        onSelect={handleSelectDefinition}
                                        onToggleSelection={toggleSelectionForExport}
                                        selectedForExport={selectedForExport}
                                        isSelectMode={isSelectMode}
                                        activeSection={activeTab}
                                        searchQuery="" // Search filtering doesn't work for the workflow queue
                                        editLockId={editLockId}
                                    />
                                ) : <p className="py-4 text-[11px] text-muted-foreground text-center italic">No items pending review.</p>
                            ) : (
                                categorizedDefinitions.drafts.length > 0 ? (
                                    <DefinitionTree
                                        treeId="drafts"
                                        definitions={categorizedDefinitions.drafts}
                                        selectedId={selectedDefinitionId}
                                        onSelect={handleSelectDefinition}
                                        onToggleSelection={toggleSelectionForExport}
                                        selectedForExport={selectedForExport}
                                        isSelectMode={isSelectMode}
                                        activeSection={activeTab}
                                        searchQuery="" // Search filtering doesn't work for drafts
                                        editLockId={editLockId}
                                    />
                                ) : <p className="py-4 text-[11px] text-muted-foreground text-center italic">No saved drafts found.</p>
                            )}
                        </div>
                      </div>

                      {/* MPM Definitions Panel (Always Visible) */}
                      <div className="flex flex-col flex-1 min-h-0">
                          <div className="px-4 py-3 bg-muted/5 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FolderTree className="h-4 w-4 text-primary/70" />
                                <h2 className="text-xs font-bold tracking-tight uppercase">MPM Definitions</h2>
                              </div>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                          <ListFilter className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2">
                                          <Checkbox id="sidebar-show-archived" checked={showArchived} onCheckedChange={() => setShowArchived(!showArchived)} />
                                          <Label htmlFor="sidebar-show-archived" className="text-xs cursor-pointer">Show Archived</Label>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2">
                                          <Checkbox id="sidebar-show-bookmarked" checked={showBookmarked} onCheckedChange={() => setShowBookmarked(!showBookmarked)} />
                                          <Label htmlFor="sidebar-show-bookmarked" className="text-xs cursor-pointer">Show Bookmarked</Label>
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                          
                          {isSelectMode && selectedForExport.length > 0 && (
                              <div className="mx-4 my-2 p-3 bg-primary/5 border rounded-lg flex flex-col gap-3 sticky top-2 z-20 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                      </div>
                                      <span className="text-sm font-bold">{selectedForExport.length} selected</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setIsSelectMode(false); setSelectedForExport([]); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 text-xs" disabled={selectedForExport.length === 0}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Export
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => handleExport('json')}>
                                                <FileJson className="mr-2 h-4 w-4" />
                                                JSON
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                Excel (XLSX)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('html')}>
                                                <FileCode className="mr-2 h-4 w-4" />
                                                HTML
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => { handleArchive(selectedForExport, true); setIsSelectMode(false); setSelectedForExport([]); }} disabled={selectedForExport.length === 0}>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archive
                                    </Button>
                                  </div>
                              </div>
                          )}

                          <div className="p-2">
                            {categorizedDefinitions.published.length > 0 ? (
                                <DefinitionTree
                                    treeId="mpm"
                                    definitions={categorizedDefinitions.published}
                                    selectedId={selectedDefinitionId}
                                    onSelect={handleSelectDefinition}
                                    onToggleSelection={toggleSelectionForExport}
                                    selectedForExport={selectedForExport}
                                    isSelectMode={isSelectMode}
                                    activeSection={activeTab}
                                    searchQuery={searchQuery} // Highlighting works for published definitions
                                    editLockId={editLockId}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <Info className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-xs text-muted-foreground italic">No definitions found for this filter.</p>
                                </div>
                            )}
                          </div>
                      </div>
                  </div>
              </div>
             )}
              <div className="flex-1 w-full overflow-y-auto" id="definition-content">
                  {renderContent()}
              </div>
          </main>
        </div>
      </SidebarInset>
      <RecentViewsModal open={isRecentModalOpen} onOpenChange={setIsRecentModalOpen} onDefinitionClick={handleSelectDefinition} />
      <NewDefinitionModal open={isNewDefinitionModalOpen} onOpenChange={setIsNewDefinitionModalOpen} onSave={handleCreateDefinition} initialData={draftedDefinitionData} templates={templates} isAdmin={isAdmin} />
      <TemplatesModal open={isTemplatesModalOpen} onOpenChange={setIsTemplatesModalOpen} onUseTemplate={handleUseTemplate} managedTemplates={templates} />
    </SidebarProvider>
  );
}
