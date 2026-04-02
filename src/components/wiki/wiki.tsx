
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
const RecentViewsModal = dynamic(() => import('@/components/wiki/recent-views-modal'), { ssr: false });
const NewDefinitionModal = dynamic(() => import('@/components/wiki/new-definition-modal'), { ssr: false });
const TemplatesModal = dynamic(() => import('@/components/wiki/templates-modal'), { ssr: false });
const TemplateManagement = dynamic(() => import('@/components/wiki/template-management'), { ssr: false });
const ApprovalQueue = dynamic(() => import('@/components/wiki/approval-queue'), { ssr: false });
const ApprovalHistory = dynamic(() => import('@/components/wiki/approval-history'), { ssr: false });
const DiscussionsPanel = dynamic(() => import('@/components/wiki/discussions-panel'), { ssr: false });

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
  const [definitions, setDefinitions] = useLocalStorage<Definition[]>('definitions_v17', initialDefinitions);
  const [templates, setTemplates] = useLocalStorage<Template[]>('managed_templates_v17', initialTemplates);
  const [approvalHistory, setApprovalHistory] = useLocalStorage<ApprovalHistoryEntry[]>('approval_history_v17', initialApprovalHistory);
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
  const [isDiscussionsOpen, setIsDiscussionsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useLocalStorage<boolean>('mpm_user_role_admin_v17', true);
  const [activeView, setActiveView] = useState<View>('definitions');
  const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('notifications_v17', initialNotifications);
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
    const def = findDefinition(definitions || [], id);
    if (def && !def.description && !def.shortDescription && def.children && def.children.length > 0) {
        return;
    }

    const isSameDefinition = id === selectedDefinitionId;
    setActiveView('definitions');
    setViewingMode(mode);
    setSelectedDefinitionId(id);
    
    if (!isSameDefinition && def) {
        const status = getStatusText(def);
        trackView(id, def.name, def.module, status);
    }
    const targetSection = sectionId || 'description';
    setActiveTab(targetSection);
    if (shouldUpdateUrl) updateUrl(id, targetSection);
  }, [definitions, selectedDefinitionId, updateUrl, getStatusText]);

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
        handleSelectDefinition(definitionIdFromUrl, sectionFromUrl || undefined, 'live', false);
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

  // Heartbeat Mechanism
  useEffect(() => {
    if (isEditing && selectedDefinitionId) {
      heartbeatInterval.current = setInterval(() => {
        setDefinitions(prev => {
          const extendLock = (items: Definition[]): Definition[] => {
            if (!Array.isArray(items)) return [];
            return items.map(def => {
              if (def.id === selectedDefinitionId) {
                const newExpireAt = new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000).toISOString();
                return { ...def, lock: def.lock ? { ...def.lock, expireAt: newExpireAt } : undefined };
              }
              if (def.children) return { ...def, children: extendLock(def.children) };
              return def;
            });
          };
          return extendLock(prev || []);
        });
      }, 60000); 
    } else {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    }
    return () => { if (heartbeatInterval.current) clearInterval(heartbeatInterval.current); };
  }, [isEditing, selectedDefinitionId, setDefinitions]);

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
    const updateItems = (items: Definition[]): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.map(def => {
        if (def.id === updatedDefinition.id) {
            const shouldKeepLock = updatedDefinition.isDraft && !updatedDefinition.isPendingApproval;
            const updatedLock = shouldKeepLock ? updatedDefinition.lock : undefined;
            return { ...updatedDefinition, lock: updatedLock };
        }
        if (def.children) return { ...def, children: updateItems(def.children) };
        return def;
      });
    };
    
    setDefinitions(prev => updateItems(prev || []));
    setIsEditing(false);
    setViewingMode(updatedDefinition.isDraft ? 'draft' : 'live');

    toast({
        title: "Changes Persisted",
        description: updatedDefinition.isDraft ? "Definition updated in your drafts. Lock maintained." : "Definition has been updated and lock released.",
    });

    if (isBookmarked(updatedDefinition.id)) {
        const newNotification: NotificationType = {
            id: Date.now().toString(),
            definitionId: updatedDefinition.id,
            definitionName: updatedDefinition.name,
            message: `Definition updated by ${currentUser.name}.`,
            date: new Date().toISOString(),
            read: false,
        };
        setNotifications((prev: any) => [newNotification, ...(prev || [])]);
    }
  };

  const handleDiscardDraft = (id: string) => {
    const removeDraftAndLock = (items: Definition[]): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.reduce((acc: Definition[], item) => {
        if (item.id === id) {
          if (item.publishedSnapshot) {
            const restored = { ...item, ...item.publishedSnapshot, isDraft: false, publishedSnapshot: undefined, lock: undefined };
            acc.push(restored as Definition);
          } else {
            return acc;
          }
        } else {
          const children = item.children ? removeDraftAndLock(item.children) : [];
          acc.push({ ...item, children });
        }
        return acc;
      }, []);
    };

    setDefinitions(prev => removeDraftAndLock(prev || []));
    setIsEditing(false);
    setViewingMode('live');
    setSelectedDefinitionId(null);
    toast({ title: "Draft Discarded", description: "Your draft has been deleted and the lock released." });
  };
  
  const handleCreateDefinition = (newDefinitionData: Omit<Definition, 'id' | 'revisions' | 'isArchived'>) => {
    const newId = Date.now().toString();
    const isPending = !newDefinitionData.isDraft && !isAdmin;
    
    const newDefinition: Definition = {
        ...newDefinitionData,
        id: newId,
        isPendingApproval: isPending,
        submittedAt: isPending ? new Date().toISOString() : undefined,
        submittedBy: isPending ? currentUser.name : undefined,
        isDraft: newDefinitionData.isDraft || isPending,
        revisions: [],
        isArchived: false,
        children: [],
        notes: newDefinitionData.notes || [],
        discussions: [],
        relatedDefinitions: [],
        lock: {
          userId: currentUser.id,
          userName: currentUser.name,
          expireAt: new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000).toISOString()
        }
    };

    if (isPending) {
      setApprovalHistory(prev => [{
        id: Date.now().toString(),
        definitionId: newId,
        definitionName: newDefinition.name,
        action: 'Submitted',
        userName: currentUser.name,
        date: new Date().toISOString()
      }, ...(prev || [])]);
    }

    const addDefinitionToModule = (items: Definition[], moduleName: string, def: Definition): Definition[] => {
        if (!Array.isArray(items)) return [];
        return items.map(item => {
            if (item.name === moduleName && item.children) return { ...item, children: [def, ...item.children] };
            if (item.children) return { ...item, children: addDefinitionToModule(item.children, moduleName, def) };
            return item;
        });
    };
    setDefinitions(prev => {
        const moduleExists = (prev || []).some(m => m.name === newDefinition.module);
        if (moduleExists) return addDefinitionToModule(prev || [], newDefinition.module, newDefinition);
        const newModule: Definition = {
            id: `mod-${Date.now()}`, name: newDefinition.module, module: newDefinition.module,
            keywords: [], description: '', revisions: [], isArchived: false, supportingTables: [], attachments: [], notes: [], discussions: [],
            children: [newDefinition]
        };
        return [...(prev || []), newModule];
    });
    setIsNewDefinitionModalOpen(false);
    setIsTemplatesModalOpen(false);
    setSelectedDefinitionId(newId);
    setViewingMode('draft');
    setActiveView('definitions');
    setIsEditing(true);
    
    if (isPending) {
      toast({ title: 'Submitted', description: 'Your new definition has been sent for approval.' });
    }
  };

  const handleDuplicate = (id: string) => {
    const definitionToDuplicate = findDefinition(definitions || [], id);
    if (!definitionToDuplicate) return;
    
    const baseName = definitionToDuplicate.name.replace(/ \(Copy\d*\)$/, '');
    const flatten = (items: Definition[]): Definition[] => {
        if (!Array.isArray(items)) return [];
        let flat: Definition[] = [];
        items.forEach(item => {
            flat.push(item);
            if (item.children) flat = [...flat, ...flatten(item.children)];
        });
        return flat;
    };
    const flatDefs = flatten(definitions || []);
    const copies = flatDefs.filter(d => d.name.startsWith(`${baseName} (Copy`));
    const nextCopyNumber = copies.length + 1;
    const newName = `${baseName} (Copy${nextCopyNumber})`;

    const newDefinition: Omit<Definition, 'id' | 'revisions' | 'isArchived'> = {
      ...definitionToDuplicate,
      name: newName,
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
      if (!Array.isArray(items)) return [];
      return items.map(def => {
        if (ids.includes(def.id)) {
          return { ...def, isArchived: archive };
        }
        if (def.children) return { ...def, children: updateArchiveStatus(def.children) };
        return def;
      });
    };
    setDefinitions(prev => updateArchiveStatus(prev || []));
    toast({ 
      title: archive ? 'Definition Archived' : 'Definition Unarchived', 
      description: archive ? 'The definition has been moved to Archive.' : 'The definition has been removed from Archive.' 
    });
  };

  const handleDelete = (id: string) => {
    const remove = (items: Definition[], idToDelete: string): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.filter(def => def.id !== idToDelete).map(def => {
          if (def.children) def.children = remove(def.children, idToDelete);
          return def;
        });
    };
    setDefinitions(prev => remove(prev || [], id));
    if (selectedDefinitionId === id) setSelectedDefinitionId(null);
  };

  const handlePublish = (id: string) => {
    if (!isAdmin) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Only administrators can publish definitions.' });
        return;
    }
    const target = findDefinition(definitions || [], id);
    if (target) {
      setApprovalHistory(prev => [{
        id: Date.now().toString(),
        definitionId: id,
        definitionName: target.name,
        action: 'Approved',
        userName: currentUser.name,
        date: new Date().toISOString()
      }, ...(prev || [])]);
    }

    const publishItem = (items: Definition[]): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.map(def => {
        if (def.id === id) return { ...def, isDraft: false, isPendingApproval: false, publishedSnapshot: undefined, lock: undefined };
        if (def.children) return { ...def, children: publishItem(def.children) };
        return def;
      });
    };
    setDefinitions(prev => publishItem(prev || []));
    setViewingMode('live');
    toast({ title: 'Definition Published', description: 'The definition is now available in the MPM Wiki. Lock released.' });
  };

  const handleRequestApproval = (id: string) => {
    const target = findDefinition(definitions || [], id);
    if (target) {
      setApprovalHistory(prev => [{
        id: Date.now().toString(),
        definitionId: id,
        definitionName: target.name,
        action: 'Submitted',
        userName: currentUser.name,
        date: new Date().toISOString()
      }, ...(prev || [])]);
    }

    const updateItem = (items: Definition[]): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.map(def => {
        if (def.id === id) return { 
            ...def, 
            isPendingApproval: true, 
            submittedAt: new Date().toISOString(),
            submittedBy: currentUser.name,
            lock: undefined 
        };
        if (def.children) return { ...def, children: updateItem(def.children) };
        return def;
      });
    };
    setDefinitions(prev => updateItem(prev || []));
    toast({ title: 'Submitted', description: 'Your definition has been submitted for approval. Lock released.' });
  };

  const handleReject = (id: string, comment: string, isRejection: boolean = true) => {
    if (!isAdmin) return;
    
    const target = findDefinition(definitions || [], id);
    if (target) {
      setApprovalHistory(prev => [{
        id: Date.now().toString(),
        definitionId: id,
        definitionName: target.name,
        action: isRejection ? 'Rejected' : 'Changes Requested',
        userName: currentUser.name,
        date: new Date().toISOString(),
        comment: comment
      }, ...(prev || [])]);
    }

    const updateItem = (items: Definition[]): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.map(def => {
        if (def.id === id) {
          const updatedDiscussions = [...(def.discussions || [])];
          if (comment) {
            const newMessage: DiscussionMessage = {
              id: Date.now().toString(),
              authorId: currentUser.id,
              author: currentUser.name,
              avatar: currentUser.avatar,
              date: new Date().toISOString(),
              content: comment,
              type: isRejection ? 'rejection' : 'change-request',
              priority: 'Medium',
              round: 1
            };
            updatedDiscussions.push(newMessage);
          }
          return { ...def, isPendingApproval: false, isDraft: true, discussions: updatedDiscussions, lock: undefined };
        }
        if (def.children) return { ...def, children: updateItem(def.children) };
        return def;
      });
    };
    setDefinitions(prev => updateItem(prev || []));
    toast({ 
        title: isRejection ? 'Definition Rejected' : 'Changes Requested', 
        description: `The definition has been returned to draft status with feedback. Lock released.` 
    });
  };

  const handleAddReply = (content: string) => {
    if (!selectedDefinitionId) return;
    const newMessage: DiscussionMessage = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      author: currentUser.name,
      avatar: currentUser.avatar,
      date: new Date().toISOString(),
      content,
      type: 'comment'
    };

    const updateItem = (items: Definition[]): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.map(def => {
        if (def.id === selectedDefinitionId) {
          return { ...def, discussions: [...(def.discussions || []), newMessage] };
        }
        if (def.children) return { ...def, children: updateItem(def.children) };
        return def;
      });
    };
    setDefinitions(prev => updateItem(prev || []));
  };

  const enrichedDefinitions = useMemo(() => {
    const enrich = (items: Definition[]): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => ({
        ...item,
        isBookmarked: isBookmarked(item.id),
        children: item.children ? enrich(item.children) : []
      }));
    };
    return enrich(definitions || []);
  }, [definitions, bookmarks, isBookmarked]);

  const filteredDefinitions = useMemo(() => {
    const filterItems = (items: Definition[], query: string): Definition[] => {
        if (!Array.isArray(items)) return [];
        if (!query) return items;
        const lowerCaseQuery = query.toLowerCase();
        return items.reduce((acc: Definition[], item) => {
            const children = item.children ? filterItems(item.children, query) : [];
            const nameMatch = (item.name || '').toLowerCase().includes(lowerCaseQuery);
            const keywordsMatch = (item.keywords || []).some(k => k.toLowerCase().includes(lowerCaseQuery));
            if (nameMatch || keywordsMatch || children.length > 0) acc.push({ ...item, children });
            return acc;
        }, []);
    };
    return filterItems(enrichedDefinitions, searchQuery);
  }, [enrichedDefinitions, searchQuery]);

  const categorizedDefinitions = useMemo(() => {
    const itemsForPublished = searchQuery ? filteredDefinitions : enrichedDefinitions;
    const itemsForWorkflow = enrichedDefinitions;

    if (!Array.isArray(itemsForPublished) || !Array.isArray(itemsForWorkflow)) {
        return { drafts: [], published: [], pending: [], mySubmissions: [] };
    }

    const filterByDraft = (items: Definition[], isDraft: boolean): Definition[] => {
        if (!Array.isArray(items)) return [];
        return items.reduce((acc: Definition[], item) => {
            const children = filterByDraft(item.children || [], isDraft);
            const isMatch = isDraft ? (item.isDraft === true && !item.isPendingApproval) : (item.isDraft === false || item.isDraft === undefined);
            if (children.length > 0 || (isMatch && (item.description || item.shortDescription))) {
                acc.push({ ...item, children });
            }
            return acc;
        }, []);
    };

    const filterPublishedStrict = (items: Definition[]): Definition[] => {
        if (!Array.isArray(items)) return [];
        return items.reduce((acc: Definition[], item) => {
            if (!item) return acc;
            const children = filterPublishedStrict(item.children || []);
            
            // Logic: Include only if strictly published OR has a previously published version
            const hasPublishedVersion = (!item.isDraft && !item.isPendingApproval) || !!item.publishedSnapshot;
            
            const isModule = children.length > 0;
            const isMatch = isModule || (hasPublishedVersion && (item.description || item.shortDescription));
            
            if (isMatch) {
                acc.push({ ...item, children } as Definition);
            }
            return acc;
        }, []);
    };

    const filterPending = (items: Definition[]): Definition[] => {
        if (!Array.isArray(items)) return [];
        return items.reduce((acc: Definition[], item) => {
            const children = filterPending(item.children || []);
            const isSelfPending = item.isPendingApproval === true;
            if (isSelfPending || children.length > 0) {
                acc.push({ ...item, children });
            }
            return acc;
        }, []);
    }

    const filterMySubmissions = (items: Definition[]): Definition[] => {
        if (!Array.isArray(items)) return [];
        return items.reduce((acc: Definition[], item) => {
            const children = filterMySubmissions(item.children || []);
            const isMyPending = item.isPendingApproval === true && item.submittedBy === currentUser.name;
            if (isMyPending || children.length > 0) {
                acc.push({ ...item, children });
            }
            return acc;
        }, []);
    };

    const filterBookmarkedRecursive = (items: Definition[]): Definition[] => {
        if (!Array.isArray(items)) return [];
        return items.reduce((acc: Definition[], item) => {
            const children = filterBookmarkedRecursive(item.children || []);
            const isSelfBookmarked = isBookmarked(item.id);
            if (isSelfBookmarked || children.length > 0) {
                acc.push({ ...item, children });
            }
            return acc;
        }, []);
    };

    let processedPublished = filterPublishedStrict(itemsForPublished);
    if (showArchived) {
        const getOnlyArchived = (items: Definition[]): Definition[] => {
            if (!Array.isArray(items)) return [];
            return items.reduce((acc: Definition[], item) => {
                const children = getOnlyArchived(item.children || []);
                if (item.isArchived || children.length > 0) acc.push({ ...item, children });
                return acc;
            }, []);
        };
        processedPublished = getOnlyArchived(processedPublished);
    } else {
        const getHideArchived = (items: Definition[]): Definition[] => {
            if (!Array.isArray(items)) return [];
            return items.reduce((acc: Definition[], item) => {
                if (item.isArchived) return acc;
                const children = getHideArchived(item.children || []);
                acc.push({ ...item, children });
                return acc;
            }, []);
        };
        processedPublished = getHideArchived(processedPublished);
    }

    if (showBookmarked) {
        processedPublished = filterBookmarkedRecursive(processedPublished);
    }

    return {
        drafts: filterByDraft(itemsForWorkflow, true),
        published: processedPublished,
        pending: filterPending(itemsForWorkflow),
        mySubmissions: filterMySubmissions(itemsForWorkflow)
    };
  }, [enrichedDefinitions, filteredDefinitions, showArchived, showBookmarked, searchQuery, isBookmarked]);

  const leafSelectionCount = useMemo(() => {
    const flattenToLeafIds = (items: Definition[]): string[] => {
        if (!Array.isArray(items)) return [];
        let ids: string[] = [];
        items.forEach(item => {
            if (item.description || item.shortDescription) ids.push(item.id);
            if (item.children) ids = [...ids, ...flattenToLeafIds(item.children)];
        });
        return ids;
    };
    const allPublishedLeafIds = new Set(flattenToLeafIds(categorizedDefinitions.published));
    return (selectedForExport || []).filter(id => allPublishedLeafIds.has(id)).length;
  }, [selectedForExport, categorizedDefinitions.published]);

  const handleExport = async (formatType: 'pdf' | 'json' | 'xlsx' | 'html') => {
    const flatten = (items: Definition[]): Definition[] => {
        if (!Array.isArray(items)) return [];
        let flat: Definition[] = [];
        items.forEach(item => {
            flat.push(item);
            if (item.children) flat = [...flat, ...flatten(item.children)];
        });
        return flat;
    };
    const definitionsToExport = flatten(definitions || []).filter(d => (selectedForExport || []).includes(d.id) && (d.description || d.shortDescription));
    if (definitionsToExport.length === 0) return;

    if (formatType === 'json') {
        const exportData = { exportDate: new Date().toISOString(), definitions: definitionsToExport };
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
            ID: def.id, Name: def.name, Module: def.module, Keywords: def.keywords.join(', '),
            Description: def.description.replace(/<[^>]+>/g, ''), Archived: def.isArchived,
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Definitions');
        XLSX.writeFile(workbook, `bulk-export-${Date.now()}.xlsx`);
        toast({ title: 'Export Success', description: 'Definitions exported to Excel.' });
    } else if (formatType === 'html') {
        let htmlContent = `<html><head><title>Bulk Export</title><style>body { font-family: sans-serif; line-height: 1.6; padding: 2rem; } h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; } .def-block { margin-bottom: 4rem; } .keywords { font-style: italic; color: #777; }</style></head><body>`;
        definitionsToExport.forEach(def => {
            htmlContent += `<div class="def-block"><h1>${def.name}</h1><p><strong>Module:</strong> ${def.module}</p><div class="keywords"><strong>Keywords:</strong> ${def.keywords.join(', ')}</div><hr/>${def.description}${def.technicalDetails ? `<h3>Technical Details</h3>${def.technicalDetails}` : ''}${def.usageExamples ? `<h3>Usage Examples</h3>${def.usageExamples}` : ''}</div>`;
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
    const def = findDefinition(definitions || [], selectedDefinitionId);
    if (!def) return null;
    
    // If viewing strictly the published tree while a draft exists, show the snapshot
    if (viewingMode === 'live' && def.publishedSnapshot && !isEditing) {
        return { ...def, ...def.publishedSnapshot, isBookmarked: isBookmarked(def.id) } as Definition;
    }

    return { ...def, isBookmarked: isBookmarked(def.id) };
  }, [definitions, selectedDefinitionId, isBookmarked, viewingMode, isEditing]);

  const handleEditClick = () => {
    if (!selectedDefinitionId) return;
    const def = findDefinition(definitions || [], selectedDefinitionId);
    if (!def) return;

    if (def.lock && def.lock.userId !== currentUser.id && new Date(def.lock.expireAt) > new Date()) {
      toast({ variant: 'destructive', title: "Definition Locked", description: `${def.lock.userName} is currently editing this definition. Try again later.` });
      return;
    }
    
    const newLock: LockInfo = {
      userId: currentUser.id,
      userName: currentUser.name,
      expireAt: new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000).toISOString()
    };

    let updatedDefinition: Definition;
    if (!def.isDraft) {
      const { revisions, children, notes, discussions, publishedSnapshot, ...snapshot } = def;
      updatedDefinition = { ...def, isDraft: true, publishedSnapshot: snapshot, lock: newLock };
    } else {
      updatedDefinition = { ...def, lock: newLock };
    }

    const updateItems = (items: Definition[]): Definition[] => {
      if (!Array.isArray(items)) return [];
      return items.map(d => {
        if (d.id === updatedDefinition.id) return updatedDefinition;
        if (d.children) return { ...d, children: updateItems(d.children) };
        return d;
      });
    };
    
    setDefinitions(prev => updateItems(prev || []));
    setIsEditing(true);
    setViewingMode('draft');
    toast({ title: "Lock Acquired", description: "You now have exclusive editing access for this definition." });
  };

  const allPendingApprovals = useMemo(() => {
    const flattenToPending = (items: Definition[]): Definition[] => {
        if (!Array.isArray(items)) return [];
        return items.reduce((acc: Definition[], item) => {
            const isPendingLeaf = item.isPendingApproval && (item.description || item.shortDescription);
            if (isPendingLeaf) acc.push(item);
            if (item.children) acc = acc.concat(flattenToPending(item.children));
            return acc;
        }, []);
    };
    return flattenToPending(definitions || []);
  }, [definitions]);

  const renderContent = () => {
    switch (activeView) {
        case 'activity-logs': return <div className="p-6"><ActivityLogs /></div>;
        case 'template-management': return <div className="p-6"><TemplateManagement templates={templates} onSaveTemplates={setTemplates} /></div>;
        case 'approval-queue': return (
            <ApprovalQueue 
                pendingDefinitions={allPendingApprovals} 
                onApprove={handlePublish}
                onReject={(id, comment, isRejection) => handleReject(id, comment, isRejection)}
            />
        );
        case 'approval-history': return <div className="p-6"><ApprovalHistory history={approvalHistory} /></div>;
        default: return (
                <div className="relative">
                  {isEditing && selectedDefinition ? (
                      <DefinitionEdit definition={selectedDefinition} onSave={handleSave} onDiscard={handleDiscardDraft} isAdmin={isAdmin} />
                  ) : selectedDefinition ? (
                      <div className="p-6">
                        <DefinitionView 
                          definition={selectedDefinition} 
                          allDefinitions={definitions}
                          onEdit={handleEditClick} 
                          onDuplicate={(id) => handleDuplicate(id)} 
                          onArchive={handleArchive} 
                          onDelete={handleDelete} 
                          onToggleBookmark={toggleBookmark} 
                          onPublish={handlePublish}
                          onReject={(id, data) => handleReject(id, data?.content || '', data?.isRejection)}
                          onSendApproval={handleRequestApproval}
                          activeTab={activeTab} 
                          onTabChange={handleTabChange} 
                          onSave={handleSave} 
                          isAdmin={isAdmin}
                          searchQuery={searchQuery}
                          currentUser={currentUser}
                          onOpenFeedback={() => setIsDiscussionsOpen(true)}
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
      const template = (templates || []).find(t => t.id === templateId);
      if (template) {
        setDraftedDefinitionData({ ...templateData, templateId: template.id, attachments: template.defaultAttachments || [] });
      } else {
        setDraftedDefinitionData(templateData);
      }
      setIsNewDefinitionModalOpen(true);
      setIsTemplatesModalOpen(false);
  };

  const countLeafItems = (items: Definition[], filterFn: (item: Definition) => boolean): number => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((acc, item) => {
      const isLeaf = (item.description || item.shortDescription);
      return acc + (isLeaf && filterFn(item) ? 1 : 0) + (item.children ? countLeafItems(item.children, filterFn) : 0);
    }, 0);
  };

  const totalDraftCount = countLeafItems(categorizedDefinitions.drafts, (i) => i.isDraft === true && !i.isPendingApproval);
  const totalPendingCount = countLeafItems(categorizedDefinitions.mySubmissions, (i) => i.isPendingApproval === true);

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
                    <div className="flex items-center justify-between"><h1 className="text-xl font-bold tracking-tight">MPM Data Definitions</h1></div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search definitions..." className="w-full h-10 rounded-md bg-muted/50 pl-8 focus-visible:bg-background border-muted" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <Button variant="outline" className={cn("w-full justify-center h-10 font-semibold gap-2 border-muted", isSelectMode && "bg-primary text-primary-foreground border-primary")} onClick={() => setIsSelectMode(!isSelectMode)}>
                      <ListFilter className="h-4 w-4" />
                      Bulk Actions
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col">
                      {/* ADMIN VIEW OR TABS FOR STANDARD USER */}
                      {isAdmin ? (
                        <div className="p-4 space-y-3 bg-muted/10 border-b">
                          <div className="flex items-center justify-between">
                              <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Saved Definitions</h2>
                              {totalDraftCount > 0 && <span className="bg-primary/10 text-primary h-4 min-w-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold">{totalDraftCount}</span>}
                          </div>
                          <div className="pt-2">
                              {categorizedDefinitions.drafts.length > 0 ? (
                                  <DefinitionTree treeId="drafts" definitions={categorizedDefinitions.drafts} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                              ) : <p className="py-4 text-[11px] text-muted-foreground text-center italic">No saved drafts found.</p>}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/5 border-b">
                          <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="w-full">
                            <TabsList className="w-full grid grid-cols-2 rounded-none bg-transparent h-10 p-0 border-b">
                              <TabsTrigger 
                                value="saved" 
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:text-primary text-[10px] font-bold uppercase tracking-wider h-full text-primary"
                              >
                                My Saved
                                {totalDraftCount > 0 && <span className="ml-1.5 bg-primary/10 text-primary h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center text-[8px]">{totalDraftCount}</span>}
                              </TabsTrigger>
                              <TabsTrigger 
                                value="pending" 
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white data-[state=active]:text-primary text-[10px] font-bold uppercase tracking-wider h-full text-primary"
                              >
                                Submitted
                                {totalPendingCount > 0 && <span className="ml-1.5 bg-indigo-100 text-indigo-700 h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center text-[8px]">{totalPendingCount}</span>}
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="saved" className="p-4 m-0">
                                {categorizedDefinitions.drafts.length > 0 ? (
                                    <DefinitionTree treeId="drafts" definitions={categorizedDefinitions.drafts} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                                ) : <p className="py-4 text-[11px] text-muted-foreground text-center italic">No saved drafts found.</p>}
                            </TabsContent>
                            <TabsContent value="pending" className="p-4 m-0">
                                {categorizedDefinitions.mySubmissions.length > 0 ? (
                                    <DefinitionTree treeId="submissions" definitions={categorizedDefinitions.mySubmissions} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'draft')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={false} activeSection={activeTab} searchQuery="" editLockId={null} />
                                ) : <p className="py-4 text-[11px] text-muted-foreground text-center italic">No pending requests.</p>}
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}

                      <div className="flex flex-col flex-1 min-h-0">
                          <div className="px-4 py-3 bg-muted/5 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2"><FolderTree className="h-4 w-4 text-primary/70" /><h2 className="text-xs font-bold tracking-tight uppercase">MPM Definitions</h2></div>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 rounded-full"><ListFilter className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2"><Checkbox id="sidebar-show-archived" checked={showArchived} onCheckedChange={() => setShowArchived(!showArchived)} /><Label htmlFor="sidebar-show-archived" className="text-xs cursor-pointer">Show Archived</Label></DropdownMenuItem>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2"><Checkbox id="sidebar-show-bookmarked" checked={showBookmarked} onCheckedChange={() => setShowBookmarked(!showBookmarked)} /><Label htmlFor="sidebar-show-bookmarked" className="text-xs cursor-pointer">Show Bookmarked</Label></DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                          
                          {isSelectMode && leafSelectionCount > 0 && (
                              <div className="mx-4 my-2 p-3 bg-primary/5 border rounded-lg flex flex-col gap-3 sticky top-2 z-20 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div><span className="text-sm font-bold">{leafSelectionCount} selected</span></div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setIsSelectMode(false); setSelectedForExport([]); }}><X className="h-4 w-4" /></Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 text-xs" disabled={leafSelectionCount === 0}><Download className="mr-2 h-4 w-4" />Export</Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => handleExport('json')}><FileJson className="mr-2 h-4 w-4" />JSON</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('pdf')}><FileText className="mr-2 h-4 w-4" />PDF</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('xlsx')}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel (XLSX)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('html')}><FileCode className="mr-2 h-4 w-4" />HTML</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => { handleArchive(selectedForExport, true); setIsSelectMode(false); setSelectedForExport([]); }} disabled={leafSelectionCount === 0}><Archive className="mr-2 h-4 w-4" />Archive</Button>
                                  </div>
                              </div>
                          )}

                          <div className="p-2">
                            {categorizedDefinitions.published.length > 0 ? (
                                <DefinitionTree treeId="mpm" definitions={categorizedDefinitions.published} selectedId={selectedDefinitionId} onSelect={(id, sectionId) => handleSelectDefinition(id, sectionId, 'live')} onToggleSelection={toggleSelectionForExport} selectedForExport={selectedForExport} isSelectMode={isSelectMode} activeSection={activeTab} searchQuery={searchQuery} editLockId={null} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center"><Info className="h-8 w-8 text-muted-foreground/30 mb-2" /><p className="text-xs text-muted-foreground italic">No published definitions found.</p></div>
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
      <RecentViewsModal open={isRecentModalOpen} onOpenChange={setIsRecentModalOpen} onDefinitionClick={(id) => handleSelectDefinition(id, undefined, 'live')} />
      <NewDefinitionModal open={isNewDefinitionModalOpen} onOpenChange={setIsNewDefinitionModalOpen} onSave={handleCreateDefinition} initialData={draftedDefinitionData} templates={templates} isAdmin={isAdmin} />
      <TemplatesModal open={isTemplatesModalOpen} onOpenChange={setIsTemplatesModalOpen} onUseTemplate={handleUseTemplate} managedTemplates={templates} />
      
      {selectedDefinition && (
        <DiscussionsPanel 
          open={isDiscussionsOpen} 
          onOpenChange={setIsDiscussionsOpen} 
          discussions={selectedDefinition.discussions || []}
          definitionName={selectedDefinition.name}
          onAddReply={handleAddReply}
        />
      )}
    </SidebarProvider>
  );
}
