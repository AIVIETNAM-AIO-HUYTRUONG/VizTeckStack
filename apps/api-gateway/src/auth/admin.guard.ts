import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.getType() === 'http'
      ? context.switchToHttp().getRequest()
      : GqlExecutionContext.create(context).getContext().req;

    const token = (req.headers['authorization'] as string | undefined)?.replace('Bearer ', '');
    if (!token || token !== process.env.ADMIN_TOKEN) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return true;
  }
}
