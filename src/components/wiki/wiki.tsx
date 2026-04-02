
"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { initialDefinitions, initialTemplates, findDefinition, initialApprovalHistory } from '@/lib/data';
import type { Definition, Notification as NotificationType, Template, DiscussionMessage, Note, LockInfo, View, ApprovalHistoryEntry } from '@/lib/types';
import { Search, X, Download, Archive, ChevronDown, Lock as LockIcon, Info, ListFilter, Check, FileJson, FileText, FileSpreadsheet, FileCode, FolderTree, MessageSquare, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
const ApprovalQueue = dynamic(() => import('@/components/wiki/approval-queue'), { ssr: false });
const ApprovalHistory = dynamic(() => import('@/components/wiki/approval-history'), { ssr: false });

type ViewingMode = 'live' | 'draft';

const currentUser = {
    id: "user_123",
    name: "Dhilip Sagadevan",
    avatar: "https://picsum.photos/seed/dhilip/40/40"
};

const LOCK_TIMEOUT_MINUTES = 30;

const initialNotifications: NotificationType[] = [
  {
    id: '1',
    definitionId: '1.1.1',
    definitionName: 'Auth Decision Date',
    message: 'The description was updated by Dhilip Sagadevan.',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: '2',
    definitionId: '2.1.1',
    definitionName: 'Contracted Rates',
    message: 'A new note was added by Jane Smith.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
];

export default function Wiki() {
  const [definitions, setDefinitions] = useLocalStorage<Definition[]>('definitions_v18', initialDefinitions);
  const [drafts, setDrafts] = useLocalStorage<Definition[]>('mpm_user_drafts_v18', []);
  const [templates, setTemplates] = useLocalStorage<Template[]>('managed_templates_v18', initialTemplates);
  const [approvalHistory, setApprovalHistory] = useLocalStorage<ApprovalHistoryEntry[]>('approval_history_v18', initialApprovalHistory);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [viewingMode, setViewingMode] = useState<ViewingMode>('live');
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
  const [isAdmin, setIsAdmin] = useLocalStorage<boolean>('mpm_user_role_admin_v18', true);
  const [activeView, setActiveView] = useState<View>('definitions');
  const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('notifications_v18', initialNotifications);
  const [draftedDefinitionData, setDraftedDefinitionData] = useState<Partial<Definition> | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'saved' | 'pending'>('saved');
  const { toast } = useToast();
  
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const getStatusText = useCallback((def: Definition) => {
    if (!def) return 'Unknown';
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

  const handleSelectDefinition = useCallback((id: string, sectionId?: string, mode: ViewingMode = 'live', shouldUpdateUrl = true) => {
    const isSameDefinition = id === selectedDefinitionId && mode === viewingMode;
    setActiveView('definitions');
    setViewingMode(mode);
    setSelectedDefinitionId(id);
    setIsEditing(false); // Reset editing mode when switching definitions
    
    const sourceList = mode === 'draft' ? drafts : definitions;
    const def = findDefinition(sourceList, id);
    if (def && !isSameDefinition) {
        const status = getStatusText(def);
        trackView(id, def.name, def.module, status);
    }
    
    const targetSection = sectionId || 'description';
    setActiveTab(targetSection);
    if (shouldUpdateUrl) updateUrl(id, targetSection);
  }, [definitions, drafts, selectedDefinitionId, viewingMode, updateUrl, getStatusText]);

  const handleNavigate = useCallback((view: View, shouldUpdateUrl = true) => {
    if ((view === 'activity-logs' || view === 'template-management' || view === 'approval-queue' || view === 'approval-history') && !isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Access restricted to administrators.' });
        return;
    }
    setActiveView(view);
    if (view === 'definitions') {
        handleSelectDefinition('1.1.1', undefined, 'live', shouldUpdateUrl);
    } else {
        setSelectedDefinitionId(null);
        if(shouldUpdateUrl) {
            updateUrl('', '', view);
        }
    }
  }, [isAdmin, toast, handleSelectDefinition, updateUrl]);

  const handlePopState = useCallback(() => {
    if (!isMounted) return;
    const urlParams = new URLSearchParams(window.location.search);
    const definitionIdFromUrl = urlParams.get('definitionId');
    const sectionFromUrl = urlParams.get('section');
    const viewFromUrl = urlParams.get('view') as View;

    if (viewFromUrl && viewFromUrl !== 'definitions') {
        handleNavigate(viewFromUrl, false);
    } else if (definitionIdFromUrl) {
        const isDraftId = definitionIdFromUrl.startsWith('draft_');
        handleSelectDefinition(definitionIdFromUrl, sectionFromUrl || undefined, isDraftId ? 'draft' : 'live', false);
    } else {
        setActiveView('definitions');
        handleSelectDefinition('1.1.1', undefined, 'live', false);
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
    if (isEditing && selectedDefinitionId && viewingMode === 'draft') {
      heartbeatInterval.current = setInterval(() => {
        setDrafts(prev => {
          return prev.map(def => {
            if (def.id === selectedDefinitionId) {
              const newExpireAt = new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000).toISOString();
              return { ...def, lock: def.lock ? { ...def.lock, expireAt: newExpireAt } : undefined };
            }
            return def;
          });
        });
      }, 60000); 
    } else {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    }
    return () => { if (heartbeatInterval.current) clearInterval(heartbeatInterval.current); };
  }, [isEditing, selectedDefinitionId, viewingMode, setDrafts]);

  const toggleSelectionForExport = (id: string, checked: boolean) => {
    setSelectedForExport(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(i => i !== id);
      }
    });
  };

  const handleSave = (updatedDefinition: Definition) => {
    const isNowPending = updatedDefinition.isPendingApproval && !updatedDefinition.isDraft;
    
    if (updatedDefinition.isDraft || updatedDefinition.isPendingApproval) {
        setDrafts(prev => {
            const exists = prev.some(d => d.id === updatedDefinition.id);
            if (exists) {
                return prev.map(d => d.id === updatedDefinition.id ? updatedDefinition : d);
            }
            return [...prev, updatedDefinition];
        });

        if (isNowPending) {
            setApprovalHistory(prev => [{
                id: Date.now().toString(),
                definitionId: updatedDefinition.originalId || updatedDefinition.id,
                definitionName: updatedDefinition.name,
                action: 'Submitted',
                userName: currentUser.name,
                date: new Date().toISOString()
            }, ...(prev || [])]);
        }
        setViewingMode('draft');
    } else {
        const newRevision: Revision = {
            ticketId: `MPM-REV-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            developer: currentUser.name,
            description: 'Major content update and publish.',
            snapshot: { ...updatedDefinition, revisions: [] }
        };

        const finalDef = {
            ...updatedDefinition,
            revisions: [newRevision, ...updatedDefinition.revisions]
        };

        const updateDefinitions = (items: Definition[]): Definition[] => {
            return items.map(item => {
                if (item.id === (updatedDefinition.originalId || updatedDefinition.id)) return finalDef;
                if (item.children) return { ...item, children: updateDefinitions(item.children) };
                return item;
            });
        };

        setDefinitions(prev => updateDefinitions(prev || []));
        setDrafts(prev => prev.filter(d => d.id !== updatedDefinition.id && d.originalId !== updatedDefinition.id));
        setViewingMode('live');
        setSelectedDefinitionId(updatedDefinition.originalId || updatedDefinition.id);
    }

    setIsEditing(false);
    toast({
        title: "Changes Persisted",
        description: updatedDefinition.isDraft ? "Draft updated. Lock maintained." : "Changes published successfully.",
    });
  };

  const handleDiscardDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    setIsEditing(false);
    setViewingMode('live');
    setSelectedDefinitionId(null);
    toast({ title: "Draft Discarded", description: "Your working copy has been deleted." });
  };
  
  const handleCreateDefinition = (newDefinitionData: Omit<Definition, 'id' | 'revisions' | 'isArchived'>) => {
    const tempId = `draft_new_${Date.now()}`;
    const newDefinition: Definition = {
        ...newDefinitionData,
        id: tempId,
        isDraft: true,
        isPendingApproval: false,
        revisions: [],
        isArchived: false,
        children: [],
        notes: [],
        discussions: [],
        relatedDefinitions: [],
        lock: {
          userId: currentUser.id,
          userName: currentUser.name,
          expireAt: new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000).toISOString()
        }
    };

    setDrafts(prev => [...prev, newDefinition]);
    setIsNewDefinitionModalOpen(false);
    setIsTemplatesModalOpen(false);
    setSelectedDefinitionId(tempId);
    setViewingMode('draft');
    setIsEditing(true);
  };

  const handleDuplicate = (id: string) => {
    const sourceList = viewingMode === 'draft' ? drafts : definitions;
    const definitionToDuplicate = findDefinition(sourceList, id);
    if (!definitionToDuplicate) return;
    
    const newDefinition: Omit<Definition, 'id' | 'revisions' | 'isArchived'> = {
      ...definitionToDuplicate,
      name: `${definitionToDuplicate.name} (Copy)`,
      children: [],
      isDraft: true,
      isPendingApproval: false,
      notes: [],
      discussions: [],
      publishedSnapshot: undefined,
    };
    
    handleCreateDefinition(newDefinition);
  };

  const handleArchive = (id: string | string[], archive: boolean) => {
     const ids = Array.isArray(id) ? id : [id];
     const updateArchiveStatus = (items: Definition[]): Definition[] => {
      return items.map(def => {
        if (ids.includes(def.id)) return { ...def, isArchived: archive };
        if (def.children) return { ...def, children: updateArchiveStatus(def.children) };
        return def;
      });
    };
    setDefinitions(prev => updateArchiveStatus(prev || []));
    toast({ 
      title: archive ? 'Definition Archived' : 'Definition Unarchived', 
      description: archive ? 'Moved to Archive.' : 'Restored to Library.' 
    });
  };

  const handleDelete = (id: string) => {
    const remove = (items: Definition[]): Definition[] => {
      return items.filter(def => def.id !== id).map(def => {
          if (def.children) return { ...def, children: remove(def.children) };
          return def;
        });
    };
    setDefinitions(prev => remove(prev || []));
    setDrafts(prev => prev.filter(d => d.id !== id));
    if (selectedDefinitionId === id) setSelectedDefinitionId(null);
  };

  const handlePublish = (draftId: string) => {
    if (!isAdmin) return;
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;

    const newRevision: Revision = {
        ticketId: `MPM-REV-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        developer: draft.submittedBy || currentUser.name,
        description: 'Approved and Published.',
        snapshot: { ...draft, revisions: [], isDraft: false, isPendingApproval: false }
    };

    const finalPublishedDef = {
        ...draft,
        id: draft.originalId || `pub_${Date.now()}`,
        isDraft: false,
        isPendingApproval: false,
        revisions: [newRevision, ...draft.revisions],
        lock: undefined,
        publishedSnapshot: undefined
    };

    setApprovalHistory(prev => [{
        id: Date.now().toString(),
        definitionId: finalPublishedDef.id,
        definitionName: finalPublishedDef.name,
        action: 'Approved',
        userName: currentUser.name,
        date: new Date().toISOString()
    }, ...(prev || [])]);

    const updateDefinitions = (items: Definition[]): Definition[] => {
        const existingIdx = items.findIndex(item => item.id === finalPublishedDef.id);
        if (existingIdx !== -1) {
            return items.map(item => item.id === finalPublishedDef.id ? finalPublishedDef : item);
        }
        const moduleExists = items.find(m => m.name === draft.module);
        if (moduleExists) {
            return items.map(m => m.name === draft.module ? { ...m, children: [finalPublishedDef, ...(m.children || [])] } : m);
        }
        return [...items, { id: `mod-${Date.now()}`, name: draft.module, module: draft.module, revisions: [], isArchived: false, children: [finalPublishedDef], attachments: [], keywords: [], description: '', supportingTables: [] }];
    };

    setDefinitions(prev => updateDefinitions(prev || []));
    setDrafts(prev => prev.filter(d => d.id !== draftId));
    setViewingMode('live');
    setSelectedDefinitionId(finalPublishedDef.id);
    toast({ title: 'Published', description: 'Changes are now live.' });
  };

  const handleReject = (draftId: string, comment: string, isRejection: boolean = true) => {
    if (!isAdmin) return;
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;

    const newMessage: DiscussionMessage = {
        id: Date.now().toString(),
        authorId: currentUser.id,
        author: currentUser.name,
        avatar: currentUser.avatar,
        date: new Date().toISOString(),
        content: comment,
        type: isRejection ? 'rejection' : 'change-request',
        priority: 'Medium'
    };

    const updatedDraft = {
        ...draft,
        isPendingApproval: false,
        isDraft: true,
        discussions: [...(draft.discussions || []), newMessage],
        lock: undefined
    };

    setDrafts(prev => prev.map(d => d.id === draftId ? updatedDraft : d));
    setApprovalHistory(prev => [{
        id: Date.now().toString(),
        definitionId: draft.originalId || draft.id,
        definitionName: draft.name,
        action: isRejection ? 'Rejected' : 'Changes Requested',
        userName: currentUser.name,
        date: new Date().toISOString(),
        comment
    }, ...(prev || [])]);

    toast({ title: isRejection ? 'Rejected' : 'Changes Requested' });
  };

  const handleEditClick = () => {
    if (!selectedDefinitionId) return;
    
    // Always start from the live version if we're not currently in draft mode
    const sourceList = viewingMode === 'draft' ? drafts : definitions;
    const def = findDefinition(sourceList, selectedDefinitionId);
    if (!def) return;

    // If we're already looking at a draft, just enter edit mode
    if (viewingMode === 'draft') {
        setIsEditing(true);
        return;
    }

    // Check if a draft already exists for this definition
    const existingDraft = drafts.find(d => d.originalId === def.id);
    if (existingDraft) {
        handleSelectDefinition(existingDraft.id, undefined, 'draft');
        setIsEditing(true);
        return;
    }

    // Create a new draft from the published version
    const newLock: LockInfo = {
      userId: currentUser.id,
      userName: currentUser.name,
      expireAt: new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000).toISOString()
    };

    const { revisions, children, notes, discussions, publishedSnapshot, ...snapshot } = def;
    const draftId = `draft_${def.id}_${currentUser.id}`;
    const newDraft: Definition = { 
        ...def, 
        id: draftId,
        originalId: def.id,
        isDraft: true, 
        isPendingApproval: false,
        publishedSnapshot: snapshot, 
        lock: newLock,
        baseVersionId: def.revisions[0]?.ticketId 
    };

    setDrafts(prev => [...prev, newDraft]);
    setIsEditing(true);
    setViewingMode('draft');
    setSelectedDefinitionId(draftId);
    toast({ title: "Draft Created", description: "Exclusive lock acquired." });
  };

  const handleNewDefinitionClick = (type: 'template' | 'blank') => {
    if (type === 'template') {
      setIsTemplatesModalOpen(true);
    } else {
      setDraftedDefinitionData(null);
      setIsNewDefinitionModalOpen(true);
    }
  };

  const handleUseTemplate = (templateData: Partial<Definition>, templateId: string) => {
    setDraftedDefinitionData({ ...templateData, templateId });
    setIsTemplatesModalOpen(false);
    setIsNewDefinitionModalOpen(true);
  };

  const categorizedDefinitions = useMemo(() => {
    const filterPublishedTree = (items: Definition[]): Definition[] => {
        return items.reduce((acc: Definition[], item) => {
            const children = filterPublishedTree(item.children || []);
            
            // Only include items that are NOT drafts/pending OR have a published snapshot
            const hasPublishedContent = !item.isDraft && !item.isPendingApproval;
            const hasLegacySnapshot = !!item.publishedSnapshot;
            
            const isMatch = children.length > 0 || (hasPublishedContent || hasLegacySnapshot);
            
            if (isMatch) {
                let filteredItem = { ...item, children };
                if (showArchived && !item.isArchived && children.length === 0) return acc;
                if (!showArchived && item.isArchived) return acc;
                if (showBookmarked && !isBookmarked(item.id) && children.length === 0) return acc;
                acc.push(filteredItem);
            }
            return acc;
        }, []);
    };

    return {
        drafts: drafts.filter(d => d.isDraft && !d.isPendingApproval),
        published: filterPublishedTree(definitions),
        pending: drafts.filter(d => d.isPendingApproval),
        mySubmissions: drafts.filter(d => d.isPendingApproval && d.submittedBy === currentUser.name)
    };
  }, [definitions, drafts, showArchived, showBookmarked, isBookmarked]);

  const renderContent = () => {
    switch (activeView) {
        case 'activity-logs': return <div className="p-6"><ActivityLogs /></div>;
        case 'template-management': return <div className="p-6"><TemplateManagement templates={templates} onSaveTemplates={setTemplates} /></div>;
        case 'approval-queue': return (
            <ApprovalQueue 
                pendingDefinitions={categorizedDefinitions.pending} 
                onApprove={handlePublish}
                onReject={(id, comment, isRejection) => handleReject(id, comment, isRejection)}
            />
        );
        case 'approval-history': return <div className="p-6"><ApprovalHistory history={approvalHistory} /></div>;
        default: {
            const defSource = viewingMode === 'draft' ? drafts : definitions;
            const selectedDef = findDefinition(defSource, selectedDefinitionId || '');
            const liveDef = selectedDef?.originalId ? findDefinition(definitions, selectedDef.originalId) : null;

            return (
                <div className="relative h-full">
                  {isEditing && selectedDef ? (
                      <DefinitionEdit definition={selectedDef} onSave={handleSave} onDiscard={handleDiscardDraft} isAdmin={isAdmin} />
                  ) : selectedDef ? (
                      <div className="p-6">
                        <DefinitionView 
                          definition={selectedDef} 
                          allDefinitions={definitions}
                          liveVersion={liveDef}
                          onEdit={handleEditClick} 
                          onDuplicate={handleDuplicate} 
                          onArchive={handleArchive} 
                          onDelete={handleDelete} 
                          onToggleBookmark={toggleBookmark} 
                          onPublish={handlePublish}
                          onReject={(id, data) => handleReject(id, data?.content || '', data?.isRejection)}
                          activeTab={activeTab} 
                          onTabChange={handleTabChange} 
                          onSave={handleSave} 
                          onDiscard={handleDiscardDraft}
                          isAdmin={isAdmin}
                          currentUser={currentUser}
                          viewingMode={viewingMode}
                        />
                      </div>
                  ) : (
                      <div className="flex items-center justify-center h-full"><p className="text-muted-foreground font-medium">Select a definition from the sidebar to view details.</p></div>
                  )}
                </div>
            );
        }
    }
  }

  if (!isMounted) return null;

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onNavigate={handleNavigate} isAdmin={isAdmin} onToggleAdmin={setIsAdmin} />
      <SidebarInset>
        <div className="flex flex-col h-screen bg-background">
          <AppHeader
              onRecentClick={() => setIsRecentModalOpen(true)}
              onNewDefinitionClick={handleNewDefinitionClick}
              isAdmin={isAdmin}
              notifications={notifications}
              setNotifications={setNotifications}
              onDefinitionClick={(id) => handleSelectDefinition(id, undefined, 'live')}
              activeView={activeView}
          />
          <main className="flex-1 flex overflow-hidden">
             {activeView === 'definitions' && (
              <div className="w-1/4 xl:w-1/5 border-r shrink-0 flex flex-col bg-card relative">
                  <div className="p-4 flex flex-col gap-4 border-b bg-background sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center justify-between"><h1 className="text-lg font-bold tracking-tight">Documentation</h1></div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search library..." className="w-full h-9 rounded-xl bg-muted/50 pl-8 focus-visible:bg-background border-muted" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <Button variant="outline" className={cn("w-full justify-center h-9 rounded-xl font-bold gap-2 border-slate-200 transition-all", isSelectMode && "bg-primary text-white border-primary")} onClick={() => setIsSelectMode(!isSelectMode)}>
                      <ListFilter className="h-4 w-4" />
                      Bulk Actions
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50/20">
                      {isAdmin ? (
                        <div className="p-4 space-y-3 border-b bg-white/50">
                          <div className="flex items-center justify-between">
                              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Saved Definitions</h2>
                              {categorizedDefinitions.drafts.length > 0 && (
                                <Badge className="bg-primary/10 text-primary h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black">
                                    {categorizedDefinitions.drafts.length}
                                </Badge>
                              )}
                          </div>
                          <div className="pt-1">
                              <DefinitionTree treeId="drafts" definitions={categorizedDefinitions.drafts} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border-b">
                          <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="w-full">
                            <TabsList className="w-full grid grid-cols-2 rounded-none bg-transparent h-10 p-0 border-b">
                              <TabsTrigger value="saved" className="text-[10px] font-black uppercase tracking-wider data-[state=active]:text-primary data-[state=active]:bg-primary/5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">My Saved</TabsTrigger>
                              <TabsTrigger value="pending" className="text-[10px] font-black uppercase tracking-wider data-[state=active]:text-primary data-[state=active]:bg-primary/5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">Submitted</TabsTrigger>
                            </TabsList>
                            <TabsContent value="saved" className="p-3 m-0">
                                <DefinitionTree treeId="drafts" definitions={categorizedDefinitions.drafts} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                            </TabsContent>
                            <TabsContent value="pending" className="p-3 m-0">
                                <DefinitionTree treeId="submissions" definitions={categorizedDefinitions.mySubmissions} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}

                      <div className="flex-1">
                          <div className="p-3">
                            <div className="flex items-center gap-2 px-2 mb-3">
                                <FolderTree className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MPM Definitions</span>
                            </div>
                            <DefinitionTree treeId="mpm" definitions={categorizedDefinitions.published} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'live')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={isSelectMode} activeSection={activeTab} searchQuery={searchQuery} editLockId={null} />
                          </div>
                      </div>
                  </div>
              </div>
             )}
              <div className="flex-1 w-full overflow-y-auto bg-slate-50/30">
                  {renderContent()}
              </div>
          </main>
        </div>
      </SidebarInset>
      <RecentViewsModal open={isRecentModalOpen} onOpenChange={setIsRecentModalOpen} onDefinitionClick={(id) => handleSelectDefinition(id, undefined, 'live')} />
      <NewDefinitionModal open={isNewDefinitionModalOpen} onOpenChange={setIsNewDefinitionModalOpen} onSave={handleCreateDefinition} initialData={draftedDefinitionData} templates={templates} isAdmin={isAdmin} />
      <TemplatesModal open={isTemplatesModalOpen} onOpenChange={setIsTemplatesModalOpen} onUseTemplate={handleUseTemplate} managedTemplates={templates} />
    </SidebarProvider>
  );
}
