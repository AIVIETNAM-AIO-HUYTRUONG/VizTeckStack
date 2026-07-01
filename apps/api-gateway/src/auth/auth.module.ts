import { Module } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthResolver } from './auth.resolver';

@Module({
  providers: [ClerkAuthGuard, RolesGuard, AuthResolver],
  exports: [ClerkAuthGuard, RolesGuard],
})
export class AuthModule {}
