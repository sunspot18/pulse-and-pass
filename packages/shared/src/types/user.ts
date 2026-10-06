import type { Role } from '../constants/roles.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface AuthSession {
  user: SafeUser;
}
