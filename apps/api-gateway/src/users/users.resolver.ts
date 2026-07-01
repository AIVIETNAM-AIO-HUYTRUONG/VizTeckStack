import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/types';
import { UsersService } from './users.service';
import { UserType, CreateUserInput, UpdateUserInput } from './users.dto';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => [UserType])
  users(): Promise<UserType[]> {
    return this.usersService.list();
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => UserType)
  createUser(
    @Args('input') input: CreateUserInput,
    @Context() ctx: { req: { user: { id: string } } },
  ): Promise<UserType> {
    return this.usersService.create(input.email, input.name, input.role, ctx.req.user.id);
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => UserType)
  updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
    @Context() ctx: { req: { user: { id: string } } },
  ): Promise<UserType> {
    return this.usersService.update(id, input.role, ctx.req.user.id);
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => Boolean)
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
    @Context() ctx: { req: { user: { id: string } } },
  ): Promise<boolean> {
    await this.usersService.delete(id, ctx.req.user.id);
    return true;
  }

  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => Boolean)
  async resendInvite(
    @Args('id', { type: () => ID }) id: string,
    @Context() ctx: { req: { user: { id: string } } },
  ): Promise<boolean> {
    await this.usersService.resendInvite(id, ctx.req.user.id);
    return true;
  }
}
