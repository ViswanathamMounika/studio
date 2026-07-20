"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    History
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserAccount, ActivityLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';

type UserManagementProps = {
  users: UserAccount[];
  onSaveUsers: (users: UserAccount[]) => void;
  currentUser: { name: string };
};

const ROLES = ['Super Admin', 'Editor', 'Viewer'];

export default function UserManagement({ users, onSaveUsers, currentUser }: UserManagementProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
    const [activityLogs, setActivityLogs] = useLocalStorage<ActivityLog[]>('activity_logs_v19', []);
    const { toast } = useToast();

    const [sortConfig, setSortConfig] = useState<{ key: keyof UserAccount; direction: 'asc' | 'desc' }>({
        key: 'name',
        direction: 'asc'
    });

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => {
            const valA = String(a[sortConfig.key] || '').toLowerCase();
            const valB = String(b[sortConfig.key] || '').toLowerCase();
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [users, searchQuery, sortConfig]);

    const handleSort = (key: keyof UserAccount) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleEditClick = (user: UserAccount) => {
        setEditingUser({ ...user });
        setIsEditModalOpen(true);
    };

    const logAction = (type: any, user: UserAccount, details?: string) => {
        const newLog: ActivityLog = {
            id: `log_${Date.now()}`,
            userName: currentUser.name,
            definitionName: `User: ${user.name}`,
            activityType: type,
            occurredDate: new Date().toISOString(),
            details
        };
        setActivityLogs(prev => [newLog, ...(prev || [])]);
    };

    const handleSaveUser = () => {
        if (!editingUser) return;
        
        const original = users.find(u => u.id === editingUser.id);
        if (!original) return;

        // Audit Trail Logic
        if (original.status !== editingUser.status) {
            logAction(editingUser.status === 'Active' ? 'User Status Changed' : 'User Status Changed', editingUser, `Account ${editingUser.status}`);
        }
        if (original.role !== editingUser.role) {
            logAction('User Role Modified', editingUser, `Role changed from ${original.role} to ${editingUser.role}`);
        }
        if (original.name !== editingUser.name || original.email !== editingUser.email) {
            logAction('User Profile Updated', editingUser);
        }

        const updatedUsers = users.map(u => u.id === editingUser.id ? editingUser : u);
        onSaveUsers(updatedUsers);
        setIsEditModalOpen(false);
        toast({ title: "User Updated", description: `Account for ${editingUser.name} has been modified.` });
    };

    const toggleStatus = (user: UserAccount) => {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        const updatedUsers = users.map(u => u.id === user.id ? { ...u, status: newStatus } : u);
        onSaveUsers(updatedUsers);
        logAction('User Status Changed', user, `Toggled to ${newStatus}`);
        toast({ 
            title: `User ${newStatus === 'Active' ? 'Activated' : 'Deactivated'}`, 
            description: `${user.name} is now ${newStatus.toLowerCase()}.` 
        });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                    <p className="text-muted-foreground font-medium">Govern system access and documentation permissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search users..." 
                            className="pl-9 bg-white rounded-xl border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold bg-white" onClick={() => setSearchQuery('')}>
                        <FilterX className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                </div>
            </div>

            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white flex-1 flex flex-col">
                <CardContent className="p-0 flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-slate-50 border-b">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="py-4 px-6 font-black uppercase text-[11px] tracking-widest text-slate-500 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                    Full Name <ArrowUpDown className="h-3 w-3 inline ml-1" />
                                </TableHead>
                                <TableHead className="font-black uppercase text-[11px] tracking-widest text-slate-500 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('email')}>
                                    Email Address <ArrowUpDown className="h-3 w-3 inline ml-1" />
                                </TableHead>
                                <TableHead className="font-black uppercase text-[11px] tracking-widest text-slate-500">System Role</TableHead>
                                <TableHead className="font-black uppercase text-[11px] tracking-widest text-slate-500">Status</TableHead>
                                <TableHead className="font-black uppercase text-[11px] tracking-widest text-slate-500">Last Active</TableHead>
                                <TableHead className="text-right px-6 font-black uppercase text-[11px] tracking-widest text-slate-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map(user => (
                                <TableRow key={user.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="font-bold text-slate-900">{user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 text-slate-300" />
                                            {user.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "font-bold text-[10px] uppercase h-6 px-2 border",
                                            user.role === 'Super Admin' ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-slate-50 text-slate-600 border-slate-200"
                                        )}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-2 w-2 rounded-full", user.status === 'Active' ? "bg-emerald-500" : "bg-slate-300")} />
                                            <span className={cn("text-xs font-bold", user.status === 'Active' ? "text-emerald-700" : "text-slate-500")}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-xs font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" />
                                            {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, HH:mm') : 'Never'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-slate-400 hover:text-primary rounded-lg"
                                                onClick={() => handleEditClick(user)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className={cn("h-8 w-8 rounded-lg", user.status === 'Active' ? "text-slate-400 hover:text-red-600" : "text-slate-400 hover:text-emerald-600")}
                                                onClick={() => toggleStatus(user)}
                                            >
                                                {user.status === 'Active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md border-none rounded-[24px] p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <UserCog className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Edit Account</DialogTitle>
                                <p className="text-sm text-slate-500 font-medium">Update profile and role assignments.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Account Holder</Label>
                                <Input 
                                    value={editingUser?.name || ''} 
                                    onChange={e => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                    className="rounded-xl border-slate-200 h-11 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Email Address</Label>
                                <Input 
                                    value={editingUser?.email || ''} 
                                    onChange={e => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                                    className="rounded-xl border-slate-200 h-11 font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Assigned Role</Label>
                                    <Select 
                                        value={editingUser?.role} 
                                        onValueChange={v => setEditingUser(prev => prev ? ({ ...prev, role: v }) : null)}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Account Access</Label>
                                    <div className="flex items-center justify-between h-11 px-4 bg-white border border-slate-200 rounded-xl">
                                        <span className="text-sm font-bold text-slate-700">{editingUser?.status}</span>
                                        <Switch 
                                            checked={editingUser?.status === 'Active'} 
                                            onCheckedChange={v => setEditingUser(prev => prev ? ({ ...prev, status: v ? 'Active' : 'Inactive' }) : null)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-white border-t flex gap-3 sm:justify-end">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl font-bold border-slate-200 px-6">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSaveUser} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-10 shadow-lg shadow-indigo-100">
                            Update Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}