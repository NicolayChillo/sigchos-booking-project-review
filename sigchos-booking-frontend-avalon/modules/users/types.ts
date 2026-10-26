import type { UserRole, UserResponse } from '@/lib/auth/types';

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export type AdminUserResponse = UserResponse;

export interface AdminCreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  role: UserRole;
  active?: boolean;
  /** Obligatorio cuando role es ESTABLISHMENT_ADMIN */
  ruc?: string | null;
}

export interface AdminUpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  birthDate?: string;
  role?: UserRole;
  active?: boolean;
  ruc?: string | null;
}

export const ADMIN_USER_ROLES: Array<{ label: string; value: UserRole }> = [
  { label: 'CLIENT', value: 'CLIENT' },
  { label: 'ESTABLISHMENT_ADMIN', value: 'ESTABLISHMENT_ADMIN' },
  { label: 'SYSTEM_ADMIN', value: 'SYSTEM_ADMIN' },
];
