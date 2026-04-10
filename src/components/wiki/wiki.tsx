
"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { initialDefinitions, initialTemplates, findDefinition, initialApprovalHistory, initialDrafts } from '@/lib/data';
import type { Definition, Notification as NotificationType, Template, DiscussionMessage, Note, LockInfo, View, ApprovalHistoryEntry, Revision } from '@/lib/types';
import { Search, X, Download, Archive, ChevronDown, Lock as LockIcon, Info, ListFilter, Check, FileJson, FileText, FileSpreadsheet, FileCode, FolderTree, MessageSquare, Clock, ClipboardList, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { trackSearch, trackView } from '@/lib/analytics';
import { useDebounce } from '@/hooks/use-debounce';
import useLocalStorage from '@/hooks/use-local-storage';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Dynamic imports for heavy components
const DefinitionTree = dynamic(() => import('@/components/wiki/definition-tree'), { 
  ssr: false,
  loading: () => <div className="space-y-2 p-4"><Skeleton className="h-4 w-4 w-full"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-full"/></div>
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

type ViewingMode = 'live' | 'draft';

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
];

export default function Wiki() {
  const [definitions, setDefinitions] = useLocalStorage<Definition[]>('definitions_v19', initialDefinitions);
  const [drafts, setDrafts] = useLocalStorage<Definition[]>('mpm_user_drafts_v19', initialDrafts);
  const [templates, setTemplates] = useLocalStorage<Template[]>('managed_templates_v19', initialTemplates);
  const [approvalHistory, setApprovalHistory] = useLocalStorage<ApprovalHistoryEntry[]>('approval_history_v19', initialApprovalHistory);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [viewingMode, setViewingMode] = useState<ViewingMode>('live');
  const [isEditing, setIsEditing] = useState(false);
  const [isNewBranch, setIsNewBranch] = useState(false); 
  const [showArchived, setShowArchived] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [searchQuery, setSearchQuery] = useState("");
  const { isMounted, toggleBookmark, isBookmarked } = useBookmarks();
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const [isNewDefinitionModalOpen, setIsNewDefinitionModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useLocalStorage<boolean>('mpm_user_role_admin_v19', true);
  const [activeView, setActiveView] = useState<View>('definitions');
  const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('notifications_v19', initialNotifications);
  const [draftedDefinitionData, setDraftedDefinitionData] = useState<Partial<Definition> | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const { toast } = useToast();
  
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const currentUser = useMemo(() => ({
    id: isAdmin ? "user_admin" : "user_std",
    name: isAdmin ? "Administrator" : "Standard User",
    avatar: isAdmin ? "https://picsum.photos/seed/admin/40/40" : "https://picsum.photos/seed/std/40/40"
  }), [isAdmin]);

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

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
    setActiveView('definitions');
    setViewingMode(mode);
    setSelectedDefinitionId(id);
    setIsEditing(false);
    setIsNewBranch(false);
    
    const sourceList = mode === 'draft' ? drafts : definitions;
    const def = findDefinition(sourceList, id);
    if (def) {
        trackView(id, def.name, def.module, def.isArchived ? 'Archived' : mode === 'live' ? 'Published' : (def.isPendingApproval ? 'Pending Review' : 'Draft'));
    }
    
    const targetSection = sectionId || 'description';
    setActiveTab(targetSection);
    if (shouldUpdateUrl) updateUrl(id, targetSection);
  }, [definitions, drafts, updateUrl]);

  const handleNavigate = useCallback((view: View, shouldUpdateUrl = true) => {
    if ((view === 'template-management' || view === 'approval-workflow') && !isAdmin) {
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
    setSelectedForExport(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleSave = (updatedDefinition: Definition) => {
    const isNowPending = updatedDefinition.isPendingApproval && !updatedDefinition.isDraft;
    
    if (updatedDefinition.isDraft || updatedDefinition.isPendingApproval) {
        setDrafts(prev => {
            const exists = prev.some(d => d.id === updatedDefinition.id);
            const savedDraft = {
              ...updatedDefinition,
              authorId: updatedDefinition.authorId || currentUser.id,
              submittedBy: isNowPending ? currentUser.name : updatedDefinition.submittedBy,
              submittedAt: isNowPending ? new Date().toISOString() : updatedDefinition.submittedAt
            };
            if (exists) return prev.map(d => d.id === updatedDefinition.id ? savedDraft : d);
            return [...prev, savedDraft];
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

            setNotifications(prev => [{
                id: `notif_${Date.now()}`,
                definitionId: updatedDefinition.id,
                definitionName: updatedDefinition.name,
                message: `${currentUser.name} submitted a definition for approval.`,
                date: new Date().toISOString(),
                read: false
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

        const targetId = updatedDefinition.originalId || updatedDefinition.id;
        const finalDef = {
            ...updatedDefinition,
            id: targetId,
            revisions: [newRevision, ...updatedDefinition.revisions]
        };

        const updateTree = (items: Definition[]): Definition[] => {
            return items.map(item => {
                if (item.id === targetId) return finalDef;
                if (item.children) return { ...item, children: updateTree(item.children) };
                return item;
            });
        };

        setDefinitions(prev => updateTree(prev || []));
        setDrafts(prev => prev.filter(d => d.id !== updatedDefinition.id));
        setViewingMode('live');
        setSelectedDefinitionId(targetId);
    }

    setIsEditing(false);
    setIsNewBranch(false);
    toast({
        title: "Changes Saved",
        description: updatedDefinition.isDraft ? "Draft updated." : "Changes successfully processed.",
    });
  };

  const handleDiscardDraft = (id: string) => {
    const draft = drafts.find(d => d.id === id);
    const originalId = draft?.originalId;

    if (isNewBranch) {
      setDrafts(prev => prev.filter(d => d.id !== id));
      
      if (originalId) {
        setSelectedDefinitionId(originalId);
        setViewingMode('live');
        updateUrl(originalId, activeTab);
      } else {
        setSelectedDefinitionId(null);
        updateUrl('', '', activeView);
      }
    }
    
    setIsEditing(false);
    setIsNewBranch(false);
    toast({ title: isNewBranch ? "Temporary Branch Discarded" : "Changes Cancelled" });
  };

  const handleRetract = (id: string) => {
    setDrafts(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, isPendingApproval: false, isDraft: true };
      }
      return d;
    }));
    toast({ 
      title: "Submission Retracted", 
      description: "The definition has been returned to your drafts." 
    });
  };

  const handleAcceptLiveChanges = (draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    const live = draft?.originalId ? findDefinition(definitions, draft.originalId) : null;
    
    if (draft && live) {
        const { revisions, children, notes, discussions, publishedSnapshot, ...snapshot } = live;
        const updatedDraft: Definition = {
            ...live,
            id: draft.id,
            originalId: draft.originalId,
            authorId: draft.authorId,
            isDraft: true,
            isPendingApproval: false,
            publishedSnapshot: snapshot,
            baseVersionId: live.revisions[0]?.ticketId,
            revisions: draft.revisions,
            notes: draft.notes,
            discussions: draft.discussions
        };

        setDrafts(prev => prev.map(d => d.id === draftId ? updatedDraft : d));
        toast({ 
            title: "Draft Synced", 
            description: "Your draft has been updated to match the latest published version." 
        });
    }
  };
  
  const handleCreateDefinition = (newDefinitionData: Omit<Definition, 'id' | 'revisions' | 'isArchived'>) => {
    const tempId = `draft_new_${Date.now()}`;
    const newDefinition: Definition = {
        ...newDefinitionData,
        id: tempId,
        authorId: currentUser.id,
        isDraft: true,
        isPendingApproval: false,
        revisions: [],
        isArchived: false,
        children: [],
        notes: [],
        discussions: [],
        relatedDefinitions: [],
        lock: { userId: currentUser.id, userName: currentUser.name, expireAt: new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000).toISOString() }
    };

    setDrafts(prev => [...prev, newDefinition]);
    setIsNewDefinitionModalOpen(false);
    setIsTemplatesModalOpen(false);
    setSelectedDefinitionId(tempId);
    setViewingMode('draft');
    setIsEditing(true);
    setIsNewBranch(true);
  };

  const handleDuplicate = (id: string) => {
    const sourceList = viewingMode === 'draft' ? drafts : definitions;
    const original = findDefinition(sourceList, id);
    if (!original) return;
    
    handleCreateDefinition({
      ...original,
      name: `${original.name} (Copy)`,
      children: [],
      isDraft: true,
      isPendingApproval: false,
      notes: [],
      discussions: [],
      publishedSnapshot: undefined,
    });
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
    toast({ title: archive ? 'Definition Archived' : 'Definition Unarchived' });
  };

  const handleDelete = (id: string) => {
    const draft = drafts.find(d => d.id === id);
    const originalId = draft?.originalId;

    const remove = (items: Definition[]): Definition[] => {
      return items.filter(def => def.id !== id).map(def => def.children ? { ...def, children: remove(def.children) } : def);
    };

    setDefinitions(prev => remove(prev || []));
    setDrafts(prev => prev.filter(d => d.id !== id));

    if (selectedDefinitionId === id) {
      if (originalId) {
        setSelectedDefinitionId(originalId);
        setViewingMode('live');
        setIsEditing(false);
        setIsNewBranch(false);
        updateUrl(originalId, activeTab);
      } else {
        setSelectedDefinitionId(null);
        updateUrl('', '', activeView);
      }
    }
    
    toast({ 
      title: draft ? "Draft Discarded" : "Definition Deleted",
      description: draft ? "Your private draft has been removed." : "Item permanently deleted from the library."
    });
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

    const targetId = draft.originalId || `pub_${Date.now()}`;
    const finalPublishedDef = {
        ...draft,
        id: targetId,
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

    const updateTreeRecursive = (items: Definition[]): { items: Definition[], found: boolean } => {
        let found = false;
        const newItems = items.map(item => {
            if (item.id === targetId) {
                found = true;
                return finalPublishedDef;
            }
            if (item.children) {
                const { items: newChildren, found: childFound } = updateTreeRecursive(item.children);
                if (childFound) {
                    found = true;
                    return { ...item, children: newChildren };
                }
            }
            return item;
        });
        return { items: newItems, found };
    };

    setDefinitions(prev => {
        const { items, found } = updateTreeRecursive(prev || []);
        if (found) return items;

        const moduleExists = items.find(m => m.name === draft.module);
        if (moduleExists) return items.map(m => m.name === draft.module ? { ...m, children: [finalPublishedDef, ...(m.children || [])] } : m);
        
        return [...items, { id: `mod-${Date.now()}`, name: draft.module, module: draft.module, revisions: [], isArchived: false, children: [finalPublishedDef], attachments: [], keywords: [], description: '', supportingTables: [] }];
    });

    setDrafts(prev => prev.filter(d => d.id !== draftId));
    setViewingMode('live');
    setSelectedDefinitionId(finalPublishedDef.id);
    toast({ title: 'Published Successfully' });
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
        type: isRejection ? 'rejection' : 'change-request'
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
    const sourceList = viewingMode === 'draft' ? drafts : definitions;
    const def = findDefinition(sourceList, selectedDefinitionId);
    if (!def) return;

    if (viewingMode === 'draft') {
        setIsEditing(true);
        setIsNewBranch(false);
        return;
    }

    const existingDraft = drafts.find(d => d.originalId === def.id && d.authorId === currentUser.id);
    if (existingDraft) {
        handleSelectDefinition(existingDraft.id, undefined, 'draft');
        setIsEditing(true);
        setIsNewBranch(false); 
        return;
    }

    const { revisions, children, notes, discussions, publishedSnapshot, ...snapshot } = def;
    const draftId = `draft_${def.id}_${currentUser.id}_${Date.now()}`;
    const newDraft: Definition = { 
        ...def, 
        id: draftId,
        originalId: def.id,
        authorId: currentUser.id,
        isDraft: true, 
        isPendingApproval: false,
        publishedSnapshot: snapshot, 
        lock: { userId: currentUser.id, userName: currentUser.name, expireAt: new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000).toISOString() },
        baseVersionId: def.revisions[0]?.ticketId 
    };

    setDrafts(prev => [...prev, newDraft]);
    setViewingMode('draft');
    setSelectedDefinitionId(draftId);
    setIsEditing(true);
    setIsNewBranch(true); 
    updateUrl(draftId, activeTab);
    toast({ title: "Drafting Started" });
  };

  const handleUseTemplate = (templateData: Partial<Definition>, templateId: string) => {
    setDraftedDefinitionData({ ...templateData, templateId });
    setIsTemplatesModalOpen(false);
    setIsNewDefinitionModalOpen(true);
  };

  const categorizedDefinitions = useMemo(() => {
    const hasFeedbackFunc = (d: Definition) => (d.discussions || []).some(m => m.type === 'change-request' || m.type === 'rejection');

    const filterPublishedTree = (items: Definition[]): Definition[] => {
        return items.reduce((acc: Definition[], item) => {
            const children = filterPublishedTree(item.children || []);
            const isMatch = children.length > 0 || (!item.isDraft && !item.isPendingApproval);
            if (isMatch) {
                if (showArchived && !item.isArchived && children.length === 0) return acc;
                if (!showArchived && item.isArchived) return acc;
                if (showBookmarked && !isBookmarked(item.id) && children.length === 0) return acc;
                acc.push({ ...item, children });
            }
            return acc;
        }, []);
    };

    return {
        userDrafts: drafts.filter(d => {
            // CRITICAL: Suppress drafts that are currently in a fresh "Edit" branch from sidebar
            if (isEditing && isNewBranch && d.id === selectedDefinitionId) return false;
            return d.authorId === currentUser.id && d.isDraft && !d.isPendingApproval && !hasFeedbackFunc(d);
        }),
        userPending: drafts.filter(d => d.authorId === currentUser.id && (d.isPendingApproval || (d.isDraft && hasFeedbackFunc(d)))),
        allPending: drafts.filter(d => d.isPendingApproval),
        published: filterPublishedTree(definitions)
    };
  }, [definitions, drafts, showArchived, showBookmarked, isBookmarked, currentUser.id, isEditing, isNewBranch, selectedDefinitionId]);

  const renderContent = () => {
    switch (activeView) {
        case 'activity-logs': return <div className="p-6"><ActivityLogs isAdmin={isAdmin} /></div>;
        case 'template-management': return <div className="p-6"><TemplateManagement templates={templates} onSaveTemplates={setTemplates} /></div>;
        case 'approval-workflow': return (
            <div className="h-full">
                <ApprovalQueue 
                    pendingDefinitions={categorizedDefinitions.allPending} 
                    history={approvalHistory}
                    allDefinitions={definitions}
                    drafts={drafts}
                    templates={templates}
                    onApprove={handlePublish} 
                    onReject={handleReject} 
                />
            </div>
        );
        default: {
            const defSource = viewingMode === 'draft' ? drafts : definitions;
            const selectedDef = findDefinition(defSource, selectedDefinitionId || '');
            const liveDef = selectedDef?.originalId ? findDefinition(definitions, selectedDef.originalId) : null;

            return (
                <div className="relative h-full">
                  {isEditing && selectedDef ? (
                      <DefinitionEdit 
                        definition={selectedDef} 
                        liveVersion={liveDef}
                        onSave={handleSave} 
                        onDiscard={handleDiscardDraft} 
                        onDelete={handleDelete}
                        onAcceptLiveChanges={handleAcceptLiveChanges}
                        isAdmin={isAdmin} 
                        templates={templates}
                        isNewBranch={isNewBranch}
                      />
                  ) : selectedDef ? (
                      <div className="p-6">
                        <DefinitionView 
                          definition={selectedDef} 
                          allDefinitions={definitions}
                          templates={templates}
                          liveVersion={liveDef}
                          onEdit={handleEditClick} 
                          onDuplicate={handleDuplicate} 
                          onArchive={handleArchive} 
                          onDelete={handleDelete} 
                          onToggleBookmark={toggleBookmark} 
                          onPublish={handlePublish}
                          onReject={(id, data) => handleReject(id, data?.content || '', data?.isRejection)}
                          onRetract={handleRetract}
                          onAcceptLiveChanges={handleAcceptLiveChanges}
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
                      <div className="flex items-center justify-center h-full text-muted-foreground font-medium">Select a definition from the sidebar to begin.</div>
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
              onNewDefinitionClick={(type) => type === 'template' ? setIsTemplatesModalOpen(true) : setIsNewDefinitionModalOpen(true)}
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
                      {!isAdmin ? (
                        <div className="border-b bg-white/50">
                          <Tabs defaultValue="saved" className="w-full">
                            <TabsList className="w-full grid grid-cols-2 h-10 bg-transparent rounded-none border-b p-0">
                              <TabsTrigger value="saved" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:border-primary data-[state=active]:text-primary rounded-none font-bold text-[10px] text-slate-500 uppercase tracking-wider transition-all">
                                My Saved
                              </TabsTrigger>
                              <TabsTrigger value="submitted" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:border-primary data-[state=active]:text-primary rounded-none font-bold text-[10px] text-slate-500 uppercase tracking-wider transition-all">
                                Submitted
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="saved" className="mt-0 p-3">
                               <DefinitionTree treeId="drafts" definitions={categorizedDefinitions.userDrafts} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onDelete={handleDelete} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                            </TabsContent>
                            <TabsContent value="submitted" className="mt-0 p-3">
                               <DefinitionTree treeId="submissions" definitions={categorizedDefinitions.userPending} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                            </TabsContent>
                          </Tabs>
                        </div>
                      ) : (
                        <div className="p-4 space-y-3 border-b bg-white/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Saved Definitions</h2>
                                </div>
                                {categorizedDefinitions.userDrafts.length > 0 && <Badge className="bg-primary/10 text-primary h-5 px-1.5 rounded-full text-[10px] font-black">{categorizedDefinitions.userDrafts.length}</Badge>}
                            </div>
                            <div className="pt-1">
                                <DefinitionTree treeId="drafts" definitions={categorizedDefinitions.userDrafts} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onDelete={handleDelete} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                            </div>
                        </div>
                      )}

                      <div className="flex-1 p-3">
                        <div className="flex items-center gap-2 px-2 mb-3">
                            <FolderTree className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MPM Definitions</span>
                        </div>
                        <DefinitionTree treeId="mpm" definitions={categorizedDefinitions.published} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'live')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={isSelectMode} activeSection={activeTab} searchQuery={searchQuery} editLockId={null} />
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
