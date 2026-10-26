import { apiClient } from '@/lib/http/apiClient';
import type { UserResponse } from '@/lib/auth/types';
import type {
  ChangePasswordRequest,
  OnboardingCompleteRequest,
  ProfileUpdateRequest,
} from '../types';

export async function getProfile(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>('/profile');
  return response.data;
}

export async function updateProfile(
  payload: ProfileUpdateRequest,
): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>('/profile', payload);
  return response.data;
}

export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<void> {
  await apiClient.put('/profile/password', payload);
}

export async function completeOnboarding(
  payload: OnboardingCompleteRequest,
): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>('/profile/onboarding', payload);
  return response.data;
}
