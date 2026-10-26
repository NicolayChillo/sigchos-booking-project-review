import { apiClient } from '@/lib/http/apiClient'
import type {
  MembershipRequestCreateRequest,
  MembershipRequestDecisionRequest,
  MembershipRequestResponse,
  MembershipRequestStatus,
} from '../types'

export async function createMembershipRequest(
  payload: MembershipRequestCreateRequest,
): Promise<MembershipRequestResponse> {
  const response = await apiClient.post<MembershipRequestResponse>('/public/membership-requests', payload)
  return response.data
}

export async function listMembershipRequests(
  status?: MembershipRequestStatus,
): Promise<MembershipRequestResponse[]> {
  const response = await apiClient.get<MembershipRequestResponse[]>('/admin/membership-requests', {
    params: status ? { status } : undefined,
  })
  return response.data
}

export async function reviewMembershipRequest(
  id: number,
  payload: MembershipRequestDecisionRequest,
): Promise<MembershipRequestResponse> {
  const response = await apiClient.patch<MembershipRequestResponse>(`/admin/membership-requests/${id}/decision`, payload)
  return response.data
}