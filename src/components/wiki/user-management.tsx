
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
    Search, 
    UserCog, 
    Edit, 
    ShieldCheck, 
    Plus, 
    Trash2, 
    UserCircle2, 
    Terminal, 
    ChevronLeft, 
    ChevronRight, 
    KeyRound 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserAccount, ActivityLog, Role, Permission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { initialRoles, initialPermissions } from '@/lib/data';

type SecurityManagementProps = {
  users: UserAccount[];
  onSaveUsers: (users: UserAccount[]) => void;
  currentUser: { name: string };
  isSuperAdmin: boolean;
  onImpersonate: (user: UserAccount | string) => void;
};

export default function SecurityManagement({ users, onSaveUsers, currentUser, isSuperAdmin, onImpersonate }: SecurityManagementProps) {
    const [roles, setRoles] = useLocalStorage<Role[]>('mpm_roles_v1', initialRoles);
    const [permissions, setPermissions] = useLocalStorage<Permission[]>('mpm_permissions_v1', initialPermissions);
    const [activityLogs, setActivityLogs] = useLocalStorage<ActivityLog[]>('activity_logs_v19', []);
    
    const [userSearch, setUserSearch] = useState('');
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<Partial<Permission> | null>(null);

    const [permPage, setPermPage] = useState(1);
    const [permPageSize, setPermPageSize] = useState(12);

    const { toast } = useToast();

    const safeUsers = useMemo(() => Array.isArray(users) ? users : [], [users]);
    const safeRoles = useMemo(() => Array.isArray(roles) ? roles : [], [roles]);
    const safePermissions = useMemo(() => Array.isArray(permissions) ? permissions : [], [permissions]);

    const filteredUsers = useMemo(() => {
        return safeUsers.filter(user => 
            user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.role.toLowerCase().includes(userSearch.toLowerCase())
        );
    }, [safeUsers, userSearch]);

    const filteredPermissions = useMemo(() => {
        return safePermissions.filter(p => 
            p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            p.description.toLowerCase().includes(userSearch.toLowerCase())
        );
    }, [safePermissions, userSearch]);

    const totalPermPages = Math.ceil(filteredPermissions.length / permPageSize);
    const paginatedPermissions = useMemo(() => {
        const start = (permPage - 1) * permPageSize;
        return filteredPermissions.slice(start, start + permPageSize);
    }, [filteredPermissions, permPage, permPageSize]);

    const logAction = (type: any, details?: string) => {
        const newLog: ActivityLog = {
            id: `log_${Date.now()}`,
            userName: currentUser.name,
            definitionName: 'Security Administration',
            activityType: type,
            occurredDate: new Date().toISOString(),
            details
        };
        setActivityLogs(prev => [newLog, ...(Array.isArray(prev) ? prev : [])]);
    };

    const handleEditUser = (user: UserAccount) => {
        setEditingUser({ ...user });
        setIsEditUserModalOpen(true);
    };

    const handleSaveUser = () => {
        if (!editingUser) return;
        const original = safeUsers.find(u => u.id === editingUser.id);
        if (!original) return;

        if (original.role !== editingUser.role) {
            logAction('User Role Modified', `Assigned ${editingUser.role} to ${editingUser.name}`);
        }
        if (original.status !== editingUser.status) {
            logAction('User Status Changed', `${editingUser.name} status updated to ${editingUser.status}`);
        }

        onSaveUsers(safeUsers.map(u => u.id === editingUser.id ? editingUser : u));
        setIsEditUserModalOpen(false);
        toast({ title: "Account Updated" });
    };

    const handleAddRole = () => {
        setEditingRole({ id: `role_${Date.now()}`, name: '', description: '', status: 'Active', permissions: [] });
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setEditingRole({ ...role });
        setIsRoleModalOpen(true);
    };

    const handleSaveRole = () => {
        if (!editingRole?.name?.trim()) return;

        // Unique Role Name Validation
        const normalizedName = editingRole.name.trim().toLowerCase();
        const duplicate = safeRoles.find(r => 
            r.id !== editingRole.id && 
            r.name.trim().toLowerCase() === normalizedName
        );

        if (duplicate) {
            toast({
                variant: 'destructive',
                title: "Duplicate Role",
                description: `A role named "${editingRole.name}" already exists.`
            });
            return;
        }

        const isNew = !safeRoles.find(r => r.id === editingRole.id);
        const newRoles = isNew ? [...safeRoles, editingRole as Role] : safeRoles.map(r => r.id === editingRole.id ? (editingRole as Role) : r);
        
        setRoles(newRoles);
        logAction(isNew ? 'Role Created' : 'Role Updated', `Role: ${editingRole.name}`);
        setIsRoleModalOpen(false);
        toast({ title: isNew ? "Role Created" : "Role Saved" });
    };

    const handleDeleteRole = (id: string) => {
        const role = safeRoles.find(r => r.id === id);
        if (!role) return;
        const usersWithRole = safeUsers.filter(u => u.role === role.name);
        if (usersWithRole.length > 0) {
            toast({ variant: 'destructive', title: "Cannot Delete", description: "This role is currently assigned to users." });
            return;
        }
        setRoles(safeRoles.filter(r => r.id !== id));
        logAction('Role Deleted', `Role: ${role.name}`);
        toast({ title: "Role Removed" });
    };

    const handleAddPermission = () => {
        setEditingPermission({ id: `p_${Date.now()}`, name: '', description: '' });
        setIsPermissionModalOpen(true);
    };

    const handleSavePermission = () => {
        if (!editingPermission?.name?.trim()) return;

        // Unique Permission Name Validation
        const normalizedName = editingPermission.name.trim().toLowerCase();
        const duplicate = safePermissions.find(p => 
            p.id !== editingPermission.id && 
            p.name.trim().toLowerCase() === normalizedName
        );

        if (duplicate) {
            toast({
                variant: 'destructive',
                title: "Duplicate Permission",
                description: `A permission with the name "${editingPermission.name}" already exists.`
            });
            return;
        }

        const isNew = !safePermissions.find(p => p.id === editingPermission.id);
        const newPermissions = isNew ? [...safePermissions, editingPermission as Permission] : safePermissions.map(p => p.id === editingPermission.id ? (editingPermission as Permission) : p);
        
        setPermissions(newPermissions);
        logAction(isNew ? 'Permission Created' : 'Permission Updated', `Permission: ${editingPermission.name}`);
        setIsPermissionModalOpen(false);
        toast({ title: "Permission Saved" });
    };

    const handleDeletePermission = (id: string) => {
        const perm = safePermissions.find(p => p.id === id);
        if (!perm) return;
        const rolesWithPerm = safeRoles.filter(r => r.permissions.includes(id));
        if (rolesWithPerm.length > 0) {
            toast({ variant: 'destructive', title: "Cannot Delete", description: "Permission is in use by active roles." });
            return;
        }
        setPermissions(safePermissions.filter(p => p.id !== id));
        logAction('Permission Deleted', `Permission: ${perm.name}`);
        toast({ title: "Permission Removed" });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security & Access</h1>
                    <p className="text-muted-foreground font-medium">Govern system access, roles, and functional permissions.</p>
                </div>
            </div>

            <Tabs defaultValue="users" className="flex-1 flex flex-col">
                <TabsList className="bg-slate-100 p-1 w-fit rounded-xl mb-6 mx-2">
                    <TabsTrigger value="users" className="rounded-lg px-6 font-bold">Users</TabsTrigger>
                    <TabsTrigger value="roles" className="rounded-lg px-6 font-bold">Role Governance</TabsTrigger>
                    <TabsTrigger value="permissions" className="rounded-lg px-6 font-bold">Permissions (Securables)</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="flex-1 m-0 space-y-4 px-2 pb-6">
                    <div className="flex justify-between items-center">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search user accounts..." className="pl-9 rounded-xl h-10 border-slate-200" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                        </div>
                    </div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-4 px-6">User Account</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Email Address</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Assigned Role</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Status</TableHead>
                                    <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50 border-slate-100">
                                        <TableCell className="px-6 font-bold text-slate-900">{user.name}</TableCell>
                                        <TableCell className="text-slate-500 text-sm font-medium">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold text-[10px] uppercase bg-white border-slate-200 text-slate-600">{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'Active' ? 'success' : 'secondary'} className="font-bold text-[10px] uppercase h-6 px-2">{user.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                {isSuperAdmin && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 rounded-lg text-indigo-600 font-bold hover:bg-indigo-50"
                                                        onClick={() => onImpersonate(user)}
                                                    >
                                                        <UserCircle2 className="h-4 w-4 mr-1.5" />
                                                        Act as
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => handleEditUser(user)}><Edit className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="roles" className="flex-1 m-0 space-y-4 px-2 pb-6">
                    <div className="flex justify-end">
                        <Button onClick={handleAddRole} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 shadow-md shadow-indigo-100 h-10">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    </div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-4 px-6">Role Identity</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Scope / Description</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Securables</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Status</TableHead>
                                    <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeRoles.map(role => (
                                    <TableRow key={role.id} className="hover:bg-slate-50/50 border-slate-100">
                                        <TableCell className="px-6 font-bold text-slate-900">{role.name}</TableCell>
                                        <TableCell className="text-slate-500 text-xs italic max-w-md truncate">{role.description || '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold text-[10px] uppercase text-indigo-600 bg-indigo-50 border-indigo-100">{Array.isArray(role.permissions) ? role.permissions.length : 0} Permissions</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={role.status === 'Active' ? 'success' : 'secondary'} className="font-bold text-[10px] uppercase">{role.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => handleEditRole(role)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors" onClick={() => handleDeleteRole(role.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="permissions" className="flex-1 m-0 space-y-6 flex flex-col px-2 pb-6">
                    <div className="flex justify-between items-center">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search permissions..." 
                                className="pl-9 rounded-xl h-10 border-slate-200" 
                                value={userSearch} 
                                onChange={e => {
                                    setUserSearch(e.target.value);
                                    setPermPage(1);
                                }} 
                            />
                        </div>
                        <Button onClick={handleAddPermission} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 shadow-md shadow-indigo-100 h-10">
                            <Plus className="mr-2 h-4 w-4" />
                            New Permission
                        </Button>
                    </div>

                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm flex-1 bg-white flex flex-col">
                        <div className="flex-1">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-4 px-6">Permission Name</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Guideline / Scope</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">System ID</TableHead>
                                        <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPermissions.map(perm => (
                                        <TableRow key={perm.id} className="hover:bg-slate-50/50 border-slate-100">
                                            <TableCell className="px-6 font-bold text-slate-900">{perm.name}</TableCell>
                                            <TableCell className="text-slate-500 text-xs italic max-w-md truncate">
                                                {perm.description || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono tracking-tight">{perm.id}</code>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => { setEditingPermission({ ...perm }); setIsPermissionModalOpen(true); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-[24px] border-none p-8 shadow-2xl">
                                                            <AlertDialogHeader className="space-y-3">
                                                                <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                                                                    <Trash2 className="h-6 w-6 text-red-600" />
                                                                </div>
                                                                <AlertDialogTitle className="text-2xl font-bold text-slate-900">Delete Permission?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
                                                                    Are you sure you want to delete the <strong>{perm.name}</strong> securable? This cannot be undone if it is already in use by active roles.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="mt-8 gap-3 sm:justify-end">
                                                                <AlertDialogCancel className="rounded-xl font-bold border-slate-200">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeletePermission(perm.id)} className="rounded-xl bg-red-600 hover:bg-red-700 font-bold px-6">Confirm Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredPermissions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-3 py-12">
                                                    <KeyRound className="h-10 w-10 text-slate-200" />
                                                    <p className="text-slate-400 font-bold text-sm">No securables match your criteria.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {filteredPermissions.length > 0 && (
                            <div className="flex items-center justify-between p-6 bg-slate-50/50 border-t">
                                <div className="flex items-center gap-6">
                                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                        Showing {(permPage - 1) * permPageSize + 1} to {Math.min(permPage * permPageSize, filteredPermissions.length)} of {filteredPermissions.length} records
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Items per page:</span>
                                        <Select value={String(permPageSize)} onValueChange={(v) => { setPermPageSize(Number(v)); setPermPage(1); }}>
                                            <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold border-slate-200 bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="6">6</SelectItem>
                                                <SelectItem value="12">12</SelectItem>
                                                <SelectItem value="24">24</SelectItem>
                                                <SelectItem value="48">48</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white"
                                        onClick={() => setPermPage(p => Math.max(1, p - 1))}
                                        disabled={permPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1.5" />
                                        Prev
                                    </Button>
                                    <div className="flex items-center justify-center min-w-[3.5rem] h-9 rounded-xl bg-white border border-slate-200 text-sm font-black text-indigo-600">
                                        {permPage} / {totalPermPages || 1}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white"
                                        onClick={() => setPermPage(p => Math.min(totalPermPages, p + 1))}
                                        disabled={permPage >= totalPermPages || totalPermPages === 0}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
                <DialogContent className="max-md rounded-[24px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><UserCog className="h-5 w-5 text-indigo-600" /></div><DialogTitle className="text-xl font-bold">Edit Account</DialogTitle></div></div>
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="space-y-4">
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Full Name</Label><Input value={editingUser?.name || ''} onChange={e => setEditingUser(p => p ? ({ ...p, name: e.target.value }) : null)} className="rounded-xl border-slate-200 h-11 font-bold bg-white" /></div>
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">System Role</Label>
                                <Select value={editingUser?.role} onValueChange={v => setEditingUser(p => p ? ({ ...p, role: v }) : null)}>
                                    <SelectTrigger className="rounded-xl h-11 font-bold bg-white border-slate-200"><SelectValue /></SelectTrigger>
                                    <SelectContent>{safeRoles.filter(r => r.status === 'Active').map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                <span className="text-sm font-bold text-slate-700">Account Access</span>
                                <Switch checked={editingUser?.status === 'Active'} onCheckedChange={v => setEditingUser(p => p ? ({ ...p, status: v ? 'Active' : 'Inactive' }) : null)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-white border-t gap-2"><DialogClose asChild><Button variant="outline" className="rounded-xl font-bold border-slate-200">Cancel</Button></DialogClose><Button onClick={handleSaveUser} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-8 shadow-md">Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                <DialogContent className="max-w-2xl rounded-[24px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-indigo-600" /></div><DialogTitle className="text-xl font-bold">{!safeRoles.find(r => r.id === editingRole?.id) ? 'Create' : 'Edit'} Security Role</DialogTitle></div></div>
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Role Name</Label><Input value={editingRole?.name || ''} onChange={e => setEditingRole(p => p ? ({ ...p, name: e.target.value }) : null)} className="rounded-xl border-slate-200 h-11 font-bold bg-white" /></div>
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Status</Label>
                                <div className="flex items-center justify-between h-11 px-4 bg-white border border-slate-200 rounded-xl">
                                    <span className="text-xs font-bold">{editingRole?.status}</span>
                                    <Switch checked={editingRole?.status === 'Active'} onCheckedChange={v => setEditingRole(p => p ? ({ ...p, status: v ? 'Active' : 'Inactive' }) : null)} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Description</Label><Textarea value={editingRole?.description || ''} onChange={e => setEditingRole(p => p ? ({ ...p, description: e.target.value }) : null)} className="rounded-xl border-slate-200 min-h-[80px] bg-white" /></div>
                        
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase text-slate-500">Functional Permissions</Label>
                            <div className="grid grid-cols-2 gap-2 bg-white p-4 rounded-xl border border-slate-200">
                                {safePermissions.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                                        <Checkbox 
                                            id={`p-${p.id}`} 
                                            checked={editingRole?.permissions?.includes(p.id)} 
                                            onCheckedChange={(checked) => {
                                                const current = editingRole?.permissions || [];
                                                const next = checked ? [...current, p.id] : current.filter(id => id !== p.id);
                                                setEditingRole(prev => prev ? ({ ...prev, permissions: next }) : null);
                                            }}
                                        />
                                        <Label htmlFor={`p-${p.id}`} className="text-xs font-medium cursor-pointer group-hover:text-indigo-600 transition-colors">{p.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-white border-t gap-2"><DialogClose asChild><Button variant="outline" className="rounded-xl font-bold border-slate-200">Cancel</Button></DialogClose><Button onClick={handleSaveRole} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-8 shadow-md">Save Role</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPermissionModalOpen} onOpenChange={setIsPermissionModalOpen}>
                <DialogContent className="max-md rounded-[24px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><KeyRound className="h-5 w-5 text-indigo-600" /></div><DialogTitle className="text-xl font-bold">Securable Permission</DialogTitle></div></div>
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="space-y-4">
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Permission Name</Label><Input value={editingPermission?.name || ''} onChange={e => setEditingPermission(p => p ? ({ ...p, name: e.target.value }) : null)} className="rounded-xl border-slate-200 h-11 font-bold bg-white" /></div>
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Guideline / Scope</Label><Textarea value={editingPermission?.description || ''} onChange={e => setEditingPermission(p => p ? ({ ...p, description: e.target.value }) : null)} className="rounded-xl border-slate-200 min-h-[100px] bg-white" /></div>
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-white border-t gap-2"><DialogClose asChild><Button variant="outline" className="rounded-xl font-bold border-slate-200">Cancel</Button></DialogClose><Button onClick={handleSavePermission} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-8 shadow-md">Save Securable</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
