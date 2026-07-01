import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { AuthUserType } from './auth.dto';

@Resolver()
export class AuthResolver {
  @UseGuards(ClerkAuthGuard)
  @Query(() => AuthUserType)
  me(@Context() ctx: { req: { user: AuthUserType } }): AuthUserType {
    return ctx.req.user;
  }
}
