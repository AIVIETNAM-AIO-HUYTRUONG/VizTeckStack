'use client';
import { useState } from 'react';
import { Button } from '@vizteck/ui';
import { AdminLayout } from '@/components/AdminLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UserList } from '@/features/user-management/components/UserList';
import { UserFormModal } from '@/features/user-management/components/UserFormModal';
import { useAdminUsers } from '@/features/user-management/hooks/useAdminUsers';
import type { ClerkUser } from '@vizteck/core';

type Modal =
  | { type: 'none' }
  | { type: 'invite' }
  | { type: 'edit'; user: ClerkUser }
  | { type: 'delete'; user: ClerkUser };

export default function UsersPage() {
  const { users, isLoading, createUser, updateUser, deleteUser, resendInvite } = useAdminUsers();
  const [modal, setModal] = useState<Modal>({ type: 'none' });

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-[20px] font-semibold text-text-1">Users</h1>
          <Button variant="primary" size="sm" onClick={() => setModal({ type: 'invite' })}>
            + Invite User
          </Button>
        </div>

        <UserList
          users={users}
          isLoading={isLoading}
          onInvite={() => setModal({ type: 'invite' })}
          onEdit={(user) => setModal({ type: 'edit', user })}
          onDelete={(user) => setModal({ type: 'delete', user })}
          onResendInvite={(user) => resendInvite(user.id)}
        />
      </div>

      {modal.type === 'invite' && (
        <UserFormModal
          onSubmit={(dto) => createUser(dto as any)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'edit' && (
        <UserFormModal
          user={modal.user}
          onSubmit={(dto) => updateUser(modal.user.id, dto as any)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'delete' && (
        <ConfirmDialog
          heading="Delete user?"
          body={`This will permanently delete "${modal.user.name || modal.user.email}". This cannot be undone.`}
          confirmLabel="Delete User"
          dismissLabel="Cancel"
          onConfirm={() => deleteUser(modal.user.id)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </AdminLayout>
  );
}
