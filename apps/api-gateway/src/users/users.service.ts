import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { db } from '@vizteck/db';
import { UserRole } from '../auth/types';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
  createdAt: string;
  lastSignInAt?: string;
}

@Injectable()
export class UsersService {
  private clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

  async list(): Promise<UserDto[]> {
    const [usersResp, invitationsResp] = await Promise.all([
      this.clerk.users.getUserList({ limit: 100 }),
      this.clerk.invitations.getInvitationList({ status: 'pending' } as any),
    ]);

    const active: UserDto[] = usersResp.data.map(u => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress ?? '',
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      role: ((u.publicMetadata as Record<string, unknown>)?.role ?? UserRole.VIEWER) as UserRole,
      status: u.banned ? 'banned' : 'active',
      createdAt: new Date(u.createdAt).toISOString(),
      lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : undefined,
    }));

    const pending: UserDto[] = (invitationsResp.data ?? []).map((inv: any) => ({
      id: inv.id,
      email: inv.emailAddress,
      name: (inv.publicMetadata as any)?.name ?? '',
      role: ((inv.publicMetadata as any)?.role ?? UserRole.VIEWER) as UserRole,
      status: 'pending',
      createdAt: new Date(inv.createdAt).toISOString(),
    }));

    return [...active, ...pending];
  }

  async create(email: string, name: string, role: UserRole, actorId: string): Promise<UserDto> {
    const invitation = await this.clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role, name },
      redirectUrl: `${process.env.ADMIN_URL ?? 'http://localhost:3002'}/roadmaps`,
    } as any);

    await db.auditLog.create({
      data: { actorId, targetId: invitation.id, action: 'CREATE' },
    });

    return {
      id: invitation.id,
      email: (invitation as any).emailAddress,
      name,
      role,
      status: 'pending',
      createdAt: new Date((invitation as any).createdAt).toISOString(),
    };
  }

  async update(id: string, role: UserRole, actorId: string): Promise<UserDto> {
    const users = await this.clerk.users.getUserList({ limit: 100 });
    const superAdmins = users.data.filter(
      u => ((u.publicMetadata as any)?.role) === UserRole.SUPER_ADMIN,
    );
    if (
      role !== UserRole.SUPER_ADMIN &&
      superAdmins.length === 1 &&
      superAdmins[0].id === id
    ) {
      throw new BadRequestException('Cannot demote the only Super Admin');
    }

    const updated = await this.clerk.users.updateUser(id, {
      publicMetadata: { role },
    } as any);

    await db.auditLog.create({
      data: { actorId, targetId: id, action: 'UPDATE_ROLE' },
    });

    return {
      id: updated.id,
      email: updated.emailAddresses[0]?.emailAddress ?? '',
      name: `${updated.firstName ?? ''} ${updated.lastName ?? ''}`.trim(),
      role,
      status: updated.banned ? 'banned' : 'active',
      createdAt: new Date(updated.createdAt).toISOString(),
      lastSignInAt: updated.lastSignInAt ? new Date(updated.lastSignInAt).toISOString() : undefined,
    };
  }

  async delete(id: string, actorId: string): Promise<void> {
    if (id.startsWith('inv_')) {
      await this.clerk.invitations.revokeInvitation(id);
    } else {
      const users = await this.clerk.users.getUserList({ limit: 100 });
      const superAdmins = users.data.filter(
        u => ((u.publicMetadata as any)?.role) === UserRole.SUPER_ADMIN,
      );
      if (superAdmins.length === 1 && superAdmins[0].id === id) {
        throw new BadRequestException('Cannot delete the only Super Admin');
      }
      await this.clerk.users.deleteUser(id);
    }

    await db.auditLog.create({
      data: { actorId, targetId: id, action: 'DELETE' },
    });
  }

  async resendInvite(id: string, actorId: string): Promise<void> {
    if (!id.startsWith('inv_')) {
      throw new BadRequestException('User is already active');
    }

    const invitations = await this.clerk.invitations.getInvitationList({ status: 'pending' } as any);
    const inv = (invitations.data ?? []).find((i: any) => i.id === id);
    if (!inv) throw new NotFoundException('Invitation not found');

    await this.clerk.invitations.revokeInvitation(id);
    await this.clerk.invitations.createInvitation({
      emailAddress: (inv as any).emailAddress,
      publicMetadata: (inv as any).publicMetadata,
      redirectUrl: `${process.env.ADMIN_URL ?? 'http://localhost:3002'}/roadmaps`,
    } as any);

    await db.auditLog.create({
      data: { actorId, targetId: id, action: 'RESET_INVITE' },
    });
  }
}
