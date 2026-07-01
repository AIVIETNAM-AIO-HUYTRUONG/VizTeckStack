import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [AuthModule],
  providers: [UsersService, UsersResolver],
})
export class UsersModule {}
