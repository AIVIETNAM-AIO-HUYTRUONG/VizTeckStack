import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { UserRole, ClerkRequestUser } from './types';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.getType() === 'http'
      ? context.switchToHttp().getRequest()
      : GqlExecutionContext.create(context).getContext().req;

    const token = (req.headers['authorization'] as string | undefined)?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      let role = (payload as any).publicMetadata?.role;

      // Fallback: If role is not in the JWT claims, fetch from Clerk API
      if (!role && payload.sub) {
        try {
          const user = await this.clerk.users.getUser(payload.sub);
          role = (user.publicMetadata as Record<string, unknown>)?.role;
        } catch (e) {
          console.error('Failed to fetch user from Clerk API in Guard:', e);
        }
      }

      req.user = {
        id: payload.sub,
        email: (payload as any).email ?? '',
        name: (payload as any).name ?? '',
        role: ((role ?? UserRole.VIEWER) as UserRole),
      } satisfies ClerkRequestUser;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
