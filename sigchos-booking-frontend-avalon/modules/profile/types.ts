export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  ruc?: string;
  birthDate?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface OnboardingCompleteRequest {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  currentPassword: string;
  newPassword: string;
}
