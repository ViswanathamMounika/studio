
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
    Mail, 
    UserCheck, 
    UserX, 
    ArrowUpDown, 
    FilterX,
    Clock,
    Plus,
    Trash2,
    Lock,
    Key,
    Shield,
    UserCircle2,
    Terminal,
    ChevronLeft,
    ChevronRight,
    KeyRound
} from 'lucide-react';
import { format } from 'date-fns';
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

    // Permission Pagination State
    const [permPage, setPermPage] = useState(1);
    const [permPageSize, setPermPageSize] = useState(6);

    const { toast } = useToast();

    // -- USER LOGIC --
    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.role.toLowerCase().includes(userSearch.toLowerCase())
        );
    }, [users, userSearch]);

    // -- PERMISSION LOGIC --
    const filteredPermissions = useMemo(() => {
        return permissions.filter(p => 
            p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            p.description.toLowerCase().includes(userSearch.toLowerCase())
        );
    }, [permissions, userSearch]);

    const totalPermPages = Math.ceil(filteredPermissions.length / permPageSize);
    const paginatedPermissions = useMemo(() => {
        const start = (permPage - 1) * permPageSize;
        return filteredPermissions.slice(start, start + permPageSize);
    }, [filteredPermissions, permPage, permPageSize]);

    const handleEditUser = (user: UserAccount) => {
        setEditingUser({ ...user });
        setIsEditUserModalOpen(true);
    };

    const handleSaveUser = () => {
        if (!editingUser) return;
        const original = users.find(u => u.id === editingUser.id);
        if (!original) return;

        if (original.role !== editingUser.role) {
            logAction('User Role Modified', `Assigned ${editingUser.role} to ${editingUser.name}`);
        }
        if (original.status !== editingUser.status) {
            logAction('User Status Changed', `${editingUser.name} status updated to ${editingUser.status}`);
        }

        onSaveUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setIsEditUserModalOpen(false);
        toast({ title: "Account Updated" });
    };

    // -- ROLE LOGIC --
    const handleAddRole = () => {
        setEditingRole({ id: `role_${Date.now()}`, name: '', description: '', status: 'Active', permissions: [] });
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setEditingRole({ ...role });
        setIsRoleModalOpen(true);
    };

    const handleSaveRole = () => {
        if (!editingRole?.name) return;
        const isNew = !roles.find(r => r.id === editingRole.id);
        const newRoles = isNew ? [...roles, editingRole as Role] : roles.map(r => r.id === editingRole.id ? (editingRole as Role) : r);
        
        setRoles(newRoles);
        logAction(isNew ? 'Role Created' : 'Role Updated', `Role: ${editingRole.name}`);
        setIsRoleModalOpen(false);
        toast({ title: isNew ? "Role Created" : "Role Saved" });
    };

    const handleDeleteRole = (id: string) => {
        const role = roles.find(r => r.id === id);
        if (!role) return;
        const usersWithRole = users.filter(u => u.role === role.name);
        if (usersWithRole.length > 0) {
            toast({ variant: 'destructive', title: "Cannot Delete", description: "This role is assigned to users." });
            return;
        }
        setRoles(roles.filter(r => r.id !== id));
        logAction('Role Deleted', `Role: ${role.name}`);
        toast({ title: "Role Removed" });
    };

    // -- PERMISSION MUTATION LOGIC --
    const handleAddPermission = () => {
        setEditingPermission({ id: `p_${Date.now()}`, name: '', description: '' });
        setIsPermissionModalOpen(true);
    };

    const handleSavePermission = () => {
        if (!editingPermission?.name) return;
        const isNew = !permissions.find(p => p.id === editingPermission.id);
        const newPermissions = isNew ? [...permissions, editingPermission as Permission] : permissions.map(p => p.id === editingPermission.id ? (editingPermission as Permission) : p);
        
        setPermissions(newPermissions);
        logAction(isNew ? 'Permission Created' : 'Permission Updated', `Permission: ${editingPermission.name}`);
        setIsPermissionModalOpen(false);
        toast({ title: "Permission Saved" });
    };

    const handleDeletePermission = (id: string) => {
        const perm = permissions.find(p => p.id === id);
        if (!perm) return;
        const rolesWithPerm = roles.filter(r => r.permissions.includes(id));
        if (rolesWithPerm.length > 0) {
            toast({ variant: 'destructive', title: "Cannot Delete", description: "Permission is assigned to existing roles." });
            return;
        }
        setPermissions(permissions.filter(p => p.id !== id));
        logAction('Permission Deleted', `Permission: ${perm.name}`);
        toast({ title: "Permission Removed" });
    };

    const logAction = (type: any, details?: string) => {
        const newLog: ActivityLog = {
            id: `log_${Date.now()}`,
            userName: currentUser.name,
            definitionName: 'Security Administration',
            activityType: type,
            occurredDate: new Date().toISOString(),
            details
        };
        setActivityLogs(prev => [newLog, ...(prev || [])]);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security & Access</h1>
                    <p className="text-muted-foreground font-medium">Govern system access, roles, and functional permissions.</p>
                </div>
                {isSuperAdmin && (
                    <div className="p-1 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-1">
                        <div className="px-3 py-1.5">
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block">Role Impersonation</span>
                        </div>
                        {['Admin', 'Approver', 'Standard User'].map(role => (
                            <Button 
                                key={role}
                                variant="ghost" 
                                size="sm" 
                                className="h-8 rounded-lg text-indigo-600 font-bold hover:bg-white hover:shadow-sm text-[11px]"
                                onClick={() => onImpersonate(role)}
                            >
                                <Terminal className="h-3 w-3 mr-1.5" />
                                {role}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <Tabs defaultValue="users" className="flex-1 flex flex-col">
                <TabsList className="bg-slate-100 p-1 w-fit rounded-xl mb-6">
                    <TabsTrigger value="users" className="rounded-lg px-6 font-bold">Users</TabsTrigger>
                    <TabsTrigger value="roles" className="rounded-lg px-6 font-bold">Role Governance</TabsTrigger>
                    <TabsTrigger value="permissions" className="rounded-lg px-6 font-bold">Permissions (Securables)</TabsTrigger>
                </TabsList>

                {/* --- USERS TAB --- */}
                <TabsContent value="users" className="flex-1 m-0 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search user accounts..." className="pl-9 rounded-xl" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                        </div>
                    </div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-4 px-6">User</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Email</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Current Role</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Status</TableHead>
                                    <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50">
                                        <TableCell className="px-6 font-bold text-slate-900">{user.name}</TableCell>
                                        <TableCell className="text-slate-500">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold bg-slate-50 border-slate-200">{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'Active' ? 'success' : 'secondary'} className="font-bold">{user.status}</Badge>
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
                                                        Impersonate
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => handleEditUser(user)}><Edit className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* --- ROLES TAB --- */}
                <TabsContent value="roles" className="flex-1 m-0 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleAddRole} className="bg-indigo-600 font-bold rounded-xl px-6"><Plus className="mr-2 h-4 w-4" />Create Role</Button>
                    </div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-4 px-6">Role Name</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Description</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Permissions</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Status</TableHead>
                                    <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map(role => (
                                    <TableRow key={role.id} className="hover:bg-slate-50/50">
                                        <TableCell className="px-6 font-bold text-slate-900">{role.name}</TableCell>
                                        <TableCell className="text-slate-500 text-xs">{role.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold text-primary bg-primary/5">{role.permissions.length} items</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={role.status === 'Active' ? 'success' : 'secondary'} className="font-bold">{role.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => handleEditRole(role)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDeleteRole(role.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* --- PERMISSIONS GRID TAB --- */}
                <TabsContent value="permissions" className="flex-1 m-0 space-y-6 flex flex-col">
                    <div className="flex justify-between items-center">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search permissions..." 
                                className="pl-9 rounded-xl" 
                                value={userSearch} 
                                onChange={e => {
                                    setUserSearch(e.target.value);
                                    setPermPage(1);
                                }} 
                            />
                        </div>
                        <Button onClick={handleAddPermission} className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6 shadow-md shadow-indigo-100">
                            <Plus className="mr-2 h-4 w-4" />
                            New Permission
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 content-start">
                        {paginatedPermissions.map(perm => (
                            <Card key={perm.id} className="rounded-2xl border-slate-200 hover:border-primary/20 hover:shadow-md transition-all group bg-white overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
                                                <KeyRound className="h-4.5 w-4.5 text-indigo-600 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{perm.name}</h3>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">ID: {perm.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => { setEditingPermission({ ...perm }); setIsPermissionModalOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-[24px] border-none p-8">
                                                    <AlertDialogHeader>
                                                        <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                                                            <Trash2 className="h-6 w-6 text-red-600" />
                                                        </div>
                                                        <AlertDialogTitle className="text-2xl font-bold">Delete Permission?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-slate-500 text-sm">
                                                            Are you sure you want to delete the <strong>{perm.name}</strong> securable? This cannot be undone if it is already in use by active roles.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="mt-8 gap-3">
                                                        <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeletePermission(perm.id)} className="rounded-xl bg-red-600 font-bold px-6">Confirm Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50">
                                        <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
                                            {perm.description || <span className="italic text-slate-300">No guideline provided.</span>}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {filteredPermissions.length === 0 && (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                                <KeyRound className="h-10 w-10 text-slate-200 mb-2" />
                                <p className="text-sm font-bold text-slate-400">No securables match your criteria.</p>
                            </div>
                        )}
                    </div>

                    {/* Permission Pagination Controls */}
                    {filteredPermissions.length > 0 && (
                        <div className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm mt-auto">
                            <div className="flex items-center gap-4">
                                <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                    Showing {(permPage - 1) * permPageSize + 1} to {Math.min(permPage * permPageSize, filteredPermissions.length)} of {filteredPermissions.length} securables
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Items per page:</span>
                                    <Select value={String(permPageSize)} onValueChange={(v) => { setPermPageSize(Number(v)); setPermPage(1); }}>
                                        <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold border-slate-200">
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
                                    className="rounded-xl h-9 px-4 font-bold border-slate-200"
                                    onClick={() => setPermPage(p => Math.max(1, p - 1))}
                                    disabled={permPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1.5" />
                                    Prev
                                </Button>
                                <div className="flex items-center justify-center min-w-[3rem] h-9 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-indigo-600">
                                    {permPage} / {totalPermPages || 1}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-xl h-9 px-4 font-bold border-slate-200"
                                    onClick={() => setPermPage(p => Math.min(totalPermPages, p + 1))}
                                    disabled={permPage >= totalPermPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* MODALS */}
            
            {/* User Edit */}
            <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
                <DialogContent className="max-w-md rounded-[24px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><UserCog className="h-5 w-5 text-indigo-600" /></div><DialogTitle className="text-xl font-bold">Edit Account</DialogTitle></div></div>
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="space-y-4">
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Full Name</Label><Input value={editingUser?.name || ''} onChange={e => setEditingUser(p => p ? ({ ...p, name: e.target.value }) : null)} className="rounded-xl border-slate-200 h-11 font-bold" /></div>
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">System Role</Label>
                                <Select value={editingUser?.role} onValueChange={v => setEditingUser(p => p ? ({ ...p, role: v }) : null)}>
                                    <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>{roles.filter(r => r.status === 'Active').map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                <span className="text-sm font-bold text-slate-700">Account Access</span>
                                <Switch checked={editingUser?.status === 'Active'} onCheckedChange={v => setEditingUser(p => p ? ({ ...p, status: v ? 'Active' : 'Inactive' }) : null)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-white border-t gap-2"><DialogClose asChild><Button variant="outline" className="rounded-xl font-bold">Cancel</Button></DialogClose><Button onClick={handleSaveUser} className="bg-indigo-600 rounded-xl font-bold px-8">Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Role Edit */}
            <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                <DialogContent className="max-w-2xl rounded-[24px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-indigo-600" /></div><DialogTitle className="text-xl font-bold">{!roles.find(r => r.id === editingRole?.id) ? 'Create' : 'Edit'} Security Role</DialogTitle></div></div>
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Role Name</Label><Input value={editingRole?.name || ''} onChange={e => setEditingRole(p => p ? ({ ...p, name: e.target.value }) : null)} className="rounded-xl h-11 font-bold" /></div>
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Status</Label>
                                <div className="flex items-center justify-between h-11 px-4 bg-white border border-slate-200 rounded-xl">
                                    <span className="text-xs font-bold">{editingRole?.status}</span>
                                    <Switch checked={editingRole?.status === 'Active'} onCheckedChange={v => setEditingRole(p => p ? ({ ...p, status: v ? 'Active' : 'Inactive' }) : null)} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Description</Label><Textarea value={editingRole?.description || ''} onChange={e => setEditingRole(p => p ? ({ ...p, description: e.target.value }) : null)} className="rounded-xl min-h-[80px]" /></div>
                        
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase text-slate-500">Functional Permissions</Label>
                            <div className="grid grid-cols-2 gap-2 bg-white p-4 rounded-xl border border-slate-200">
                                {permissions.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                                        <Checkbox 
                                            id={`p-${p.id}`} 
                                            checked={editingRole?.permissions?.includes(p.id)} 
                                            onCheckedChange={(checked) => {
                                                const current = editingRole?.permissions || [];
                                                const next = checked ? [...current, p.id] : current.filter(id => id !== p.id);
                                                setEditingRole(prev => prev ? ({ ...prev, permissions: next }) : null);
                                            }}
                                        />
                                        <Label htmlFor={`p-${p.id}`} className="text-xs font-medium cursor-pointer">{p.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-white border-t gap-2"><DialogClose asChild><Button variant="outline" className="rounded-xl font-bold">Cancel</Button></DialogClose><Button onClick={handleSaveRole} className="bg-indigo-600 rounded-xl font-bold px-8">Save Role</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permission Edit */}
            <Dialog open={isPermissionModalOpen} onOpenChange={setIsPermissionModalOpen}>
                <DialogContent className="max-w-md rounded-[24px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Key className="h-5 w-5 text-indigo-600" /></div><DialogTitle className="text-xl font-bold">Securable Permission</DialogTitle></div></div>
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="space-y-4">
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Internal Name</Label><Input value={editingPermission?.name || ''} onChange={e => setEditingPermission(p => p ? ({ ...p, name: e.target.value }) : null)} className="rounded-xl border-slate-200 h-11 font-bold" /></div>
                            <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-500">Guideline / Scope</Label><Textarea value={editingPermission?.description || ''} onChange={e => setEditingPermission(p => p ? ({ ...p, description: e.target.value }) : null)} className="rounded-xl min-h-[80px]" /></div>
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-white border-t gap-2"><DialogClose asChild><Button variant="outline" className="rounded-xl font-bold">Cancel</Button></DialogClose><Button onClick={handleSavePermission} className="bg-indigo-600 rounded-xl font-bold px-8">Save Securable</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

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
