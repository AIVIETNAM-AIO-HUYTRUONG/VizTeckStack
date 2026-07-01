'use client';
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button,
} from '@vizteck/ui';
import { UserRole } from '@vizteck/core';
import type { ClerkUser, CreateUserDto, UpdateUserDto } from '@vizteck/core';

const ROLES = [UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER];

interface Props {
  user?: ClerkUser;
  onSubmit: (dto: CreateUserDto | UpdateUserDto) => Promise<void>;
  onClose: () => void;
}

export function UserFormModal({ user, onSubmit, onClose }: Props) {
  const isEdit = !!user;
  const [email, setEmail] = useState(user?.email ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? UserRole.VIEWER);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(isEdit ? { role } : { email, name, role });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Invite User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-1 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-bg-2 border border-border rounded-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-indigo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-1 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-bg-2 border border-border rounded-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-indigo"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-text-1 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full h-9 px-3 text-sm bg-bg-2 border border-border rounded-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-indigo"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              {isEdit ? 'Save' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
