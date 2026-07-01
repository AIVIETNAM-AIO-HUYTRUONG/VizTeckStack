'use client';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Button,
} from '@vizteck/ui';
import type { ClerkUser } from '@vizteck/core';

const ROLE_CLASS: Record<string, string> = {
  SUPER_ADMIN: 'bg-indigo/10 text-indigo',
  EDITOR: 'bg-bg-2 text-text-2',
  VIEWER: 'bg-bg-2 text-text-3',
};

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 dark:text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  banned: 'bg-red-500/10 text-red-500',
};

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="13" cy="8" r="1.25" fill="currentColor" />
    </svg>
  );
}

function SkeletonRow() {
  return (
    <TableRow className="hover:bg-transparent animate-pulse">
      <TableCell><div className="h-4 bg-bg-2 rounded w-32" /></TableCell>
      <TableCell><div className="h-3.5 bg-bg-2 rounded w-44" /></TableCell>
      <TableCell><div className="h-5 bg-bg-2 rounded-full w-20" /></TableCell>
      <TableCell><div className="h-5 bg-bg-2 rounded-full w-14" /></TableCell>
      <TableCell><div className="h-4 bg-bg-2 rounded w-6 ml-auto" /></TableCell>
    </TableRow>
  );
}

interface Props {
  users: ClerkUser[];
  isLoading: boolean;
  onEdit: (user: ClerkUser) => void;
  onDelete: (user: ClerkUser) => void;
  onResendInvite: (user: ClerkUser) => void;
  onInvite: () => void;
}

export function UserList({ users, isLoading, onEdit, onDelete, onResendInvite, onInvite }: Props) {
  return (
    <div className="bg-bg-1 border border-border rounded-md overflow-hidden">
      {isLoading ? (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-bg-2">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </TableBody>
        </Table>
      ) : users.length === 0 ? (
        <div className="text-center py-16 px-4">
          <h2 className="font-display text-[20px] font-semibold text-text-1 mb-2">No users yet</h2>
          <p className="text-sm text-text-2 mb-5">Invite your first team member to get started.</p>
          <Button variant="primary" size="sm" onClick={onInvite}>+ Invite User</Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-bg-2">
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="w-32">Role</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-text-1">{user.name || '—'}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-text-2">{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full ${ROLE_CLASS[user.role] ?? ROLE_CLASS.VIEWER}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full ${STATUS_CLASS[user.status] ?? ''}`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={`Actions for ${user.name || user.email}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-3 hover:text-text-1 hover:bg-bg-2 focus:outline-none focus:ring-2 focus:ring-indigo transition-colors motion-reduce:transition-none"
                      >
                        <DotsIcon />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(user)}>Edit Role</DropdownMenuItem>
                      {user.status === 'pending' && (
                        <DropdownMenuItem onClick={() => onResendInvite(user)}>
                          Resend Invite
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => onDelete(user)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
