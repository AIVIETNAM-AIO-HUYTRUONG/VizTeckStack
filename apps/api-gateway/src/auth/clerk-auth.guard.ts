import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { verifyToken } from '@clerk/backend';
import { UserRole, ClerkRequestUser } from './types';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
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

      req.user = {
        id: payload.sub,
        email: (payload as any).email ?? '',
        name: (payload as any).name ?? '',
        role: ((payload as any).publicMetadata?.role ?? UserRole.VIEWER) as UserRole,
      } satisfies ClerkRequestUser;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
