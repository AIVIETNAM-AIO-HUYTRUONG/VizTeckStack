import { UserRole } from '../auth/types';

export interface ClerkUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
  createdAt: string;
  lastSignInAt?: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserDto {
  role: UserRole;
}
