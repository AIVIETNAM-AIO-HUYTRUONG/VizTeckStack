export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface ClerkRequestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
