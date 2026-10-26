import { apiClient } from '@/lib/http/apiClient'
import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUserResponse,
} from '../types'

export async function listAdminUsers(): Promise<AdminUserResponse[]> {
  const response = await apiClient.get<AdminUserResponse[]>('/admin/users')
  return response.data
}

export async function createAdminUser(
  payload: AdminCreateUserRequest,
): Promise<AdminUserResponse> {
  const response = await apiClient.post<AdminUserResponse>('/admin/users', payload)
  return response.data
}

export async function updateAdminUser(
  id: number,
  payload: AdminUpdateUserRequest,
): Promise<AdminUserResponse> {
  const response = await apiClient.put<AdminUserResponse>(`/admin/users/${id}`, payload)
  return response.data
}

export async function deleteAdminUser(id: number): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`)
}

export async function restoreAdminUser(id: number): Promise<void> {
  await apiClient.patch(`/admin/users/${id}/restore`)
}
