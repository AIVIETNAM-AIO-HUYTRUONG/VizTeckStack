'use client';
import { useState, useEffect, useCallback } from 'react';
import type { ApolloLike } from '../../roadmap/types';
import { listUsers, createUser, updateUser, deleteUser, resendInvite } from '../user.service';
import type { ClerkUser, CreateUserDto, UpdateUserDto } from '../types';

export interface UseUsersResult {
  users: ClerkUser[];
  isLoading: boolean;
  createUser: (dto: CreateUserDto) => Promise<void>;
  updateUser: (id: string, dto: UpdateUserDto) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resendInvite: (id: string) => Promise<void>;
}

export function useUsers(client: ApolloLike): UseUsersResult {
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listUsers(client)
      .then((data) => { if (!cancelled) setUsers(data); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [client]);

  const handleCreate = useCallback(async (dto: CreateUserDto) => {
    const created = await createUser(client, dto);
    setUsers((prev) => [...prev, created]);
  }, [client]);

  const handleUpdate = useCallback(async (id: string, dto: UpdateUserDto) => {
    const updated = await updateUser(client, id, dto);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  }, [client]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteUser(client, id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, [client]);

  const handleResendInvite = useCallback(async (id: string) => {
    await resendInvite(client, id);
  }, [client]);

  return {
    users,
    isLoading,
    createUser: handleCreate,
    updateUser: handleUpdate,
    deleteUser: handleDelete,
    resendInvite: handleResendInvite,
  };
}
