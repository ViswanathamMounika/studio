
"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { initialDefinitions, initialTemplates, findDefinition, initialApprovalHistory, initialDrafts, initialUsers, initialMasterData, initialSystemConfig, initialActivityLogs } from '@/lib/data';
import type { Definition, Notification as NotificationType, Template, DiscussionMessage, Note, LockInfo, View, ApprovalHistoryEntry, UserAccount, ActivityLog, MasterDataState, SystemConfigurationState, ActivityType } from '@/lib/types';
import { Search, ListFilter, Library, Clock, LogOut, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
const SecurityManagement = dynamic(() => import('@/components/wiki/user-management'), { ssr: false });
const MasterDataManagement = dynamic(() => import('@/components/wiki/master-data-management'), { ssr: false });
const SystemConfiguration = dynamic(() => import('@/components/wiki/system-configuration'), { ssr: false });
const Dashboard = dynamic(() => import('@/components/wiki/dashboard'), { ssr: false });
const ReportsDashboard = dynamic(() => import('@/components/wiki/reports'), { ssr: false });

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
  const [definitions, setDefinitions] = useLocalStorage<Definition[]>('definitions_v20', initialDefinitions);
  const [drafts, setDrafts] = useLocalStorage<Definition[]>('mpm_user_drafts_v20', initialDrafts);
  const [templates, setTemplates] = useLocalStorage<Template[]>('managed_templates_v20', initialTemplates);
  const [approvalHistory, setApprovalHistory] = useLocalStorage<ApprovalHistoryEntry[]>('approval_history_v20', initialApprovalHistory);
  const [users, setUsers] = useLocalStorage<UserAccount[]>('mpm_users_v3', initialUsers);
  const [activityLogs, setActivityLogs] = useLocalStorage<ActivityLog[]>('activity_logs_v20', initialActivityLogs);
  const [masterData, setMasterData] = useLocalStorage<MasterDataState>('mpm_master_data_v2', initialMasterData);
  const [systemConfig, setSystemConfig] = useLocalStorage<SystemConfigurationState>('mpm_system_config_v2', initialSystemConfig);
  
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
  
  const [originalAdminState, setOriginalAdminState] = useLocalStorage<boolean>('mpm_user_role_admin_v20', true);
  const [impersonatedUser, setImpersonatedUser] = useState<UserAccount | null>(null);
  const [activeView, setActiveView] = useState<View>('definitions');
  const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('notifications_v20', initialNotifications);
  const [draftedDefinitionData, setDraftedDefinitionData] = useState<Partial<Definition> | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const { toast } = useToast();
  
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const saved = sessionStorage.getItem('mpm_impersonated_user_v1');
    if (saved) {
        try {
            setImpersonatedUser(JSON.parse(saved));
        } catch (e) {
            sessionStorage.removeItem('mpm_impersonated_user_v1');
        }
    }
  }, []);

  const isAdmin = useMemo(() => {
    if (impersonatedUser) {
        return impersonatedUser.role === 'Super Admin' || impersonatedUser.role === 'Admin' || impersonatedUser.role === 'Approver';
    }
    return originalAdminState;
  }, [impersonatedUser, originalAdminState]);

  const isSuperAdmin = useMemo(() => {
    return originalAdminState && !impersonatedUser;
  }, [originalAdminState, impersonatedUser]);

  const currentUser = useMemo(() => {
    if (impersonatedUser) return impersonatedUser;
    return {
        id: originalAdminState ? "user_admin" : "user_std",
        name: originalAdminState ? "Administrator" : "Standard User",
        avatar: originalAdminState ? "https://picsum.photos/seed/admin/40/40" : "https://picsum.photos/seed/std/40/40",
        role: originalAdminState ? 'Super Admin' : 'Standard User',
        email: originalAdminState ? 'admin@medpoint.com' : 'user@medpoint.com',
        status: 'Active' as const
    };
  }, [originalAdminState, impersonatedUser]);

  useEffect(() => {
    if (debouncedSearchQuery) {
      trackSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const logAction = useCallback((type: ActivityType, details?: string) => {
    const actorName = impersonatedUser ? `Super Admin (as ${impersonatedUser.name})` : currentUser.name;
    const newLog: ActivityLog = {
        id: `log_${Date.now()}`,
        userName: actorName,
        definitionName: details?.includes('Definition') ? (details.split(': ')[1] || 'N/A') : (details?.includes('Template') ? 'Template Governance' : 'System Governance'),
        activityType: type,
        occurredDate: new Date().toISOString(),
        details
    };
    setActivityLogs(prev => [newLog, ...(Array.isArray(prev) ? prev : [])]);
  }, [currentUser.name, impersonatedUser, setActivityLogs]);

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
    
    const sourceList = mode === 'draft' ? (Array.isArray(drafts) ? drafts : []) : (Array.isArray(definitions) ? definitions : []);
    const def = findDefinition(sourceList, id);
    if (def) {
        trackView(id, def.name, def.module, def.isArchived ? 'Archived' : mode === 'live' ? 'Published' : (def.isPendingApproval ? 'Pending Review' : 'Draft'));
    }
    
    const targetSection = sectionId || 'description';
    setActiveTab(targetSection);
    if (shouldUpdateUrl) updateUrl(id, targetSection);
  }, [definitions, drafts, updateUrl]);

  const handleNavigate = useCallback((view: View, shouldUpdateUrl = true) => {
    const userRole = currentUser.role;

    const superAdminViews = ['dashboard', 'reports', 'master-data-management', 'user-management', 'system-configuration'];
    if (superAdminViews.includes(view) && userRole !== 'Super Admin') {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Access to the Admin Console is restricted to Super Administrators.' });
        return;
    }

    if (view === 'approval-workflow' && userRole !== 'Super Admin' && userRole !== 'Approver') {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Access to Approvals is restricted to Approvers.' });
        return;
    }

    if (view === 'template-management' && userRole !== 'Super Admin' && userRole !== 'Admin') {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Access to Templates is restricted to Administrators.' });
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
  }, [currentUser.role, toast, handleSelectDefinition, updateUrl]);

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
          const safeDrafts = Array.isArray(prev) ? prev : [];
          return safeDrafts.map(def => {
            if (def && def.id === selectedDefinitionId) {
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

  const handleImpersonate = (user: UserAccount | string) => {
    if (typeof user === 'string') {
        if (user === '') {
            setImpersonatedUser(null);
            sessionStorage.removeItem('mpm_impersonated_user_v1');
            logAction('User Logout', 'Ended Act as proxy session.');
            toast({ title: 'Impersonation Ended' });
        }
    } else {
        setImpersonatedUser(user);
        sessionStorage.setItem('mpm_impersonated_user_v1', JSON.stringify(user));
        logAction('User Login', `Super Admin began "Acting as" ${user.name} (${user.role})`);
        toast({ title: `Now Acting as ${user.name}` });
    }
  };

  const toggleSelectionForExport = (id: string, checked: boolean) => {
    setSelectedForExport(prev => checked ? [...prev, id] : prev.filter(item => item !== id));
  };

  const handleSave = (updatedDefinition: Definition) => {
    const isNowPending = updatedDefinition.isPendingApproval && !updatedDefinition.isDraft;
    
    if (updatedDefinition.isDraft || updatedDefinition.isPendingApproval) {
        setDrafts(prev => {
            const safeDrafts = Array.isArray(prev) ? prev : [];
            const exists = safeDrafts.some(d => d && d.id === updatedDefinition.id);
            const savedDraft = {
              ...updatedDefinition,
              authorId: updatedDefinition.authorId || currentUser.id,
              submittedBy: isNowPending ? currentUser.name : updatedDefinition.submittedBy,
              submittedAt: isNowPending ? new Date().toISOString() : updatedDefinition.submittedAt
            };
            if (exists) return safeDrafts.map(d => d.id === updatedDefinition.id ? savedDraft : d);
            return [...safeDrafts, savedDraft];
        });

        if (isNowPending) {
            setApprovalHistory(prev => [{
                id: Date.now().toString(),
                definitionId: updatedDefinition.originalId || updatedDefinition.id,
                definitionName: updatedDefinition.name,
                action: 'Submitted',
                userName: currentUser.name,
                date: new Date().toISOString()
            }, ...(Array.isArray(prev) ? prev : [])]);

            setNotifications(prev => [{
                id: `notif_${Date.now()}`,
                definitionId: updatedDefinition.id,
                definitionName: updatedDefinition.name,
                message: `${currentUser.name} submitted a definition for approval.`,
                date: new Date().toISOString(),
                read: false
            }, ...(Array.isArray(prev) ? prev : [])]);
            
            logAction('Definition Updated', `Submitted for Approval: ${updatedDefinition.name}`);
        } else {
            logAction('Definition Updated', `Draft Saved: ${updatedDefinition.name}`);
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
            return (Array.isArray(items) ? items : []).map(item => {
                if (item.id === targetId) return finalDef;
                if (item.children) return { ...item, children: updateTree(item.children) };
                return item;
            });
        };

        setDefinitions(prev => updateTree(Array.isArray(prev) ? prev : []));
        setDrafts(prev => (Array.isArray(prev) ? prev : []).filter(d => d && d.id !== updatedDefinition.id));
        setViewingMode('live');
        setSelectedDefinitionId(targetId);
        logAction('Definition Updated', `Published: ${updatedDefinition.name}`);
    }

    setIsEditing(false);
    setIsNewBranch(false);
    toast({
        title: "Changes Saved",
        description: updatedDefinition.isDraft ? "Draft updated." : "Changes successfully processed.",
    });
  };

  const handleDiscardDraft = (id: string) => {
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const draft = safeDrafts.find(d => d && d.id === id);
    const originalId = draft?.originalId;

    if (isNewBranch) {
      setDrafts(prev => (Array.isArray(prev) ? prev : []).filter(d => d && d.id !== id));
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
    
    setIsEditing(false);
    setIsNewBranch(false);
    toast({ title: isNewBranch ? "Temporary Branch Discarded" : "Changes Cancelled" });
  };

  const handleRetract = (id: string) => {
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const draft = safeDrafts.find(d => d && d.id === id);
    setDrafts(prev => (Array.isArray(prev) ? prev : []).map(d => {
      if (d && d.id === id) {
        return { ...d, isPendingApproval: false, isDraft: true };
      }
      return d;
    }));
    logAction('Definition Updated', `Submission Retracted: ${draft?.name}`);
    toast({ title: "Submission Retracted", description: "Returned to drafts." });
  };

  const handleAcceptLiveChanges = (draftId: string) => {
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const draft = safeDrafts.find(d => d && d.id === draftId);
    const live = draft?.originalId ? findDefinition(Array.isArray(definitions) ? definitions : [], draft.originalId) : null;
    
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

        setDrafts(prev => (Array.isArray(prev) ? prev : []).map(d => d && d.id === draftId ? updatedDraft : d));
        logAction('Definition Updated', `Draft Synced with Live: ${draft.name}`);
        toast({ title: "Draft Synced" });
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

    setDrafts(prev => [...(Array.isArray(prev) ? prev : []), newDefinition]);
    setIsNewDefinitionModalOpen(false);
    setIsTemplatesModalOpen(false);
    setSelectedDefinitionId(tempId);
    setViewingMode('draft');
    setIsEditing(true);
    setIsNewBranch(true);
    logAction('Definition Created', `New Draft: ${newDefinition.name}`);
  };

  const handleDuplicate = (id: string) => {
    const sourceList = viewingMode === 'draft' ? (Array.isArray(drafts) ? drafts : []) : (Array.isArray(definitions) ? definitions : []);
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
     const targetNames: string[] = [];
     const updateArchiveStatus = (items: Definition[]): Definition[] => {
      return (Array.isArray(items) ? items : []).map(def => {
        if (def && ids.includes(def.id)) {
            targetNames.push(def.name);
            return { ...def, isArchived: archive };
        }
        if (def && def.children) return { ...def, children: updateArchiveStatus(def.children) };
        return def;
      });
    };
    setDefinitions(prev => updateArchiveStatus(Array.isArray(prev) ? prev : []));
    logAction(archive ? 'Definition Archived' : 'Definition Unarchived', `Targets: ${targetNames.join(', ')}`);
    toast({ title: archive ? 'Definition Archived' : 'Definition Unarchived' });
  };

  const handleDelete = (id: string) => {
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const draft = safeDrafts.find(d => d && d.id === id);
    const originalId = draft?.originalId;
    const targetName = draft?.name || findDefinition(Array.isArray(definitions) ? definitions : [], id)?.name;

    const remove = (items: Definition[]): Definition[] => {
      return (Array.isArray(items) ? items : []).filter(def => def && def.id !== id).map(def => (def && def.children) ? { ...def, children: remove(def.children) } : def);
    };

    setDefinitions(prev => remove(Array.isArray(prev) ? prev : []));
    setDrafts(prev => (Array.isArray(prev) ? prev : []).filter(d => d && d.id !== id && d.originalId !== id));

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
    
    logAction('Definition Deleted', `ID: ${id}, Name: ${targetName}`);
    toast({ title: draft ? "Draft Discarded" : "Definition Removed" });
  };

  const handlePublish = (draftId: string) => {
    if (!isAdmin) return;
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const draft = safeDrafts.find(d => d && d.id === draftId);
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
    }, ...(Array.isArray(prev) ? prev : [])]);

    const updateTreeRecursive = (items: Definition[]): { items: Definition[], found: boolean } => {
        let found = false;
        const newItems = (Array.isArray(items) ? items : []).map(item => {
            if (item && item.id === targetId) {
                found = true;
                return finalPublishedDef;
            }
            if (item && item.children) {
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
        const { items, found } = updateTreeRecursive(Array.isArray(prev) ? prev : []);
        if (found) return items;
        const moduleExists = items.find(m => m && m.name === draft.module);
        if (moduleExists) return items.map(m => (m && m.name === draft.module) ? { ...m, children: [finalPublishedDef, ...(m.children || [])] } : m);
        return [...items, { id: `mod-${Date.now()}`, name: draft.module, module: draft.module, revisions: [], isArchived: false, children: [finalPublishedDef], attachments: [], keywords: [], description: '', supportingTables: [] }];
    });

    setDrafts(prev => (Array.isArray(prev) ? prev : []).filter(d => d && d.id !== draftId));
    setViewingMode('live');
    setSelectedDefinitionId(finalPublishedDef.id);
    logAction('Approval Decision', `Approved & Published: ${draft.name}`);
    toast({ title: 'Published Successfully' });
  };

  const handleReject = (draftId: string, comment: string, isRejection: boolean = true) => {
    if (!isAdmin) return;
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const draft = safeDrafts.find(d => d && d.id === draftId);
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

    setDrafts(prev => (Array.isArray(prev) ? prev : []).map(d => (d && d.id === draftId) ? updatedDraft : d));
    setApprovalHistory(prev => [{
        id: Date.now().toString(),
        definitionId: draft.originalId || draft.id,
        definitionName: draft.name,
        action: isRejection ? 'Rejected' : 'Changes Requested',
        userName: currentUser.name,
        date: new Date().toISOString(),
        comment
    }, ...(Array.isArray(prev) ? prev : [])]);

    logAction('Approval Decision', `${isRejection ? 'Rejected' : 'Requested Changes'}: ${draft.name}`);
    toast({ title: isRejection ? 'Rejected' : 'Changes Requested' });
  };

  const handleEditClick = () => {
    if (!selectedDefinitionId) return;
    const sourceList = viewingMode === 'draft' ? (Array.isArray(drafts) ? drafts : []) : (Array.isArray(definitions) ? definitions : []);
    const def = findDefinition(sourceList, selectedDefinitionId);
    if (!def) return;

    if (viewingMode === 'draft') {
        setIsEditing(true);
        setIsNewBranch(false);
        return;
    }

    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const existingDraft = safeDrafts.find(d => d && d.originalId === def.id && d.authorId === currentUser.id);
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

    setDrafts(prev => [...(Array.isArray(prev) ? prev : []), newDraft]);
    setViewingMode('draft');
    setSelectedDefinitionId(draftId);
    setIsEditing(true);
    setIsNewBranch(true); 
    updateUrl(draftId, activeTab);
    logAction('Definition Updated', `Began Editing: ${def.name}`);
    toast({ title: "Drafting Started" });
  };

  const handleUseTemplate = (templateData: Partial<Definition>, templateId: string) => {
    setDraftedDefinitionData({ ...templateData, templateId });
    setIsTemplatesModalOpen(false);
    setIsNewDefinitionModalOpen(true);
  };

  const categorizedDefinitions = useMemo(() => {
    const hasFeedbackFunc = (d: Definition) => d && (d.discussions || []).some(m => m.type === 'change-request' || m.type === 'rejection');
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const safeDefs = Array.isArray(definitions) ? definitions : [];

    const filterPublishedTree = (items: Definition[]): Definition[] => {
        return (Array.isArray(items) ? items : []).reduce((acc: Definition[], item) => {
            if (!item) return acc;
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
        userDrafts: safeDrafts.filter(d => {
            if (!d) return false;
            if (isEditing && isNewBranch && d.id === selectedDefinitionId) return false;
            return d.authorId === currentUser.id && d.isDraft && !d.isPendingApproval && !hasFeedbackFunc(d);
        }),
        userPending: safeDrafts.filter(d => d && d.authorId === currentUser.id && (d.isPendingApproval || (d.isDraft && hasFeedbackFunc(d)))),
        allPending: safeDrafts.filter(d => d && d.isPendingApproval),
        published: filterPublishedTree(safeDefs)
    };
  }, [definitions, drafts, showArchived, showBookmarked, isBookmarked, currentUser.id, isEditing, isNewBranch, selectedDefinitionId]);

  const renderContent = () => {
    const safeDefs = Array.isArray(definitions) ? definitions : [];
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const safeTemplates = Array.isArray(templates) ? templates : [];
    const safeUsers = Array.isArray(users) ? users : [];

    switch (activeView) {
        case 'dashboard': return <Dashboard definitions={safeDefs} drafts={safeDrafts} users={safeUsers} templates={safeTemplates} onNavigate={handleNavigate} activityLogs={Array.isArray(activityLogs) ? activityLogs : []} />;
        case 'activity-logs': return <div className="p-6 h-full overflow-hidden"><ActivityLogs isAdmin={isAdmin} users={safeUsers} /></div>;
        case 'template-management': return <div className="p-6"><TemplateManagement templates={safeTemplates} onSaveTemplates={setTemplates} onLogAction={logAction} masterData={masterData} /></div>;
        case 'master-data-management': return <div className="p-6 h-full"><MasterDataManagement masterData={masterData} onSaveMasterData={setMasterData} onLogAction={logAction} definitions={safeDefs} templates={safeTemplates} drafts={safeDrafts} /></div>;
        case 'system-configuration': return <div className="p-6 h-full"><SystemConfiguration config={systemConfig} onSaveConfig={setSystemConfig} onLogAction={logAction} /></div>;
        case 'reports': return (
            <div className="p-0 h-full overflow-hidden">
                <ReportsDashboard 
                    users={safeUsers} 
                    definitions={safeDefs} 
                    drafts={safeDrafts} 
                    activityLogs={Array.isArray(activityLogs) ? activityLogs : []} 
                    approvalHistory={Array.isArray(approvalHistory) ? approvalHistory : []} 
                    templates={safeTemplates}
                    masterData={masterData}
                />
            </div>
        );
        case 'user-management': return (
            <div className="p-6 h-full">
                <SecurityManagement 
                    users={safeUsers} 
                    onSaveUsers={setUsers} 
                    currentUser={currentUser}
                    isSuperAdmin={isSuperAdmin}
                    onImpersonate={handleImpersonate}
                />
            </div>
        );
        case 'approval-workflow': return (
            <div className="h-full">
                <ApprovalQueue 
                    pendingDefinitions={categorizedDefinitions.allPending} 
                    history={Array.isArray(approvalHistory) ? approvalHistory : []}
                    allDefinitions={safeDefs}
                    drafts={safeDrafts}
                    templates={safeTemplates}
                    onApprove={handlePublish} 
                    onReject={handleReject} 
                />
            </div>
        );
        default: {
            const defSource = viewingMode === 'draft' ? safeDrafts : safeDefs;
            const selectedDef = findDefinition(defSource, selectedDefinitionId || '');
            const liveDef = selectedDef?.originalId ? findDefinition(safeDefs, selectedDef.originalId) : null;

            return (
                <div className="relative h-full overflow-y-auto">
                  {isEditing && selectedDef ? (
                      <DefinitionEdit 
                        definition={selectedDef} 
                        liveVersion={liveDef}
                        onSave={handleSave} 
                        onDiscard={handleDiscardDraft} 
                        onDelete={handleDelete}
                        onAcceptLiveChanges={handleAcceptLiveChanges}
                        isAdmin={isAdmin} 
                        templates={safeTemplates}
                        isNewBranch={isNewBranch}
                        masterData={masterData}
                      />
                  ) : selectedDef ? (
                      <div className="p-6">
                        <DefinitionView 
                          definition={selectedDef} 
                          allDefinitions={safeDefs}
                          templates={safeTemplates}
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
      <AppSidebar 
        activeView={activeView} 
        onNavigate={handleNavigate} 
        isAdmin={isAdmin} 
        onToggleAdmin={setOriginalAdminState} 
        isImpersonating={!!impersonatedUser}
        systemConfig={systemConfig}
        currentUser={currentUser}
      />
      <SidebarInset>
        <div className="flex flex-col h-screen bg-background relative overflow-hidden">
          {impersonatedUser && (
              <div className="bg-red-600 px-6 py-2.5 flex items-center justify-between text-white shadow-xl z-[100] sticky top-0 shrink-0 border-b border-red-500">
                  <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 shadow-inner">
                          <AlertTriangle className="h-5 w-5 text-white animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                          <p className="text-[14px] font-black uppercase tracking-widest leading-none">Security Override: Act as Session Active</p>
                          <p className="text-[11px] font-bold text-white/90 mt-1 uppercase tracking-tight">
                              Proxying Identity: <span className="underline decoration-white/40">{impersonatedUser.name}</span> <span className="mx-2 opacity-40">|</span> Role: <span className="font-black">{impersonatedUser.role}</span>
                          </p>
                      </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-6 rounded-xl border-white/40 bg-white/10 hover:bg-white text-white hover:text-red-600 font-black uppercase text-[11px] gap-2 transition-all active:scale-95 shadow-lg"
                    onClick={() => handleImpersonate('')} 
                  >
                      <LogOut className="h-4 w-4" />
                      Terminate Proxy Session
                  </Button>
              </div>
          )}
          <AppHeader
              onRecentClick={() => setIsRecentModalOpen(true)}
              onNewDefinitionClick={(type) => type === 'template' ? setIsTemplatesModalOpen(true) : setIsNewDefinitionModalOpen(true)}
              isAdmin={isAdmin}
              notifications={Array.isArray(notifications) ? notifications : []}
              setNotifications={setNotifications}
              onDefinitionClick={(id) => handleSelectDefinition(id, undefined, 'live')}
              activeView={activeView}
              currentUser={currentUser}
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
                              <TabsTrigger value="saved" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none font-bold text-[10px] text-slate-500 uppercase tracking-wider transition-all">
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
                            <Library className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MPM Definitions</span>
                        </div>
                        <DefinitionTree treeId="mpm" definitions={categorizedDefinitions.published} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'live')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={isSelectMode} activeSection={activeTab} searchQuery={searchQuery} editLockId={null} />
                      </div>
                  </div>
              </div>
             )}
              <div className={cn("flex-1 w-full bg-slate-50/30", activeView === 'definitions' ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden")}>
                  {renderContent()}
              </div>
          </main>
        </div>
      </SidebarInset>
      <RecentViewsModal open={isRecentModalOpen} onOpenChange={setIsRecentModalOpen} onDefinitionClick={(id) => handleSelectDefinition(id, undefined, 'live')} />
      <NewDefinitionModal open={isNewDefinitionModalOpen} onOpenChange={setIsNewDefinitionModalOpen} onSave={handleCreateDefinition} initialData={draftedDefinitionData} templates={Array.isArray(templates) ? templates : []} isAdmin={isAdmin} masterData={masterData} systemConfig={systemConfig} />
      <TemplatesModal open={isTemplatesModalOpen} onOpenChange={setIsTemplatesModalOpen} onUseTemplate={handleUseTemplate} managedTemplates={Array.isArray(templates) ? templates : []} />
    </SidebarProvider>
  );
}
