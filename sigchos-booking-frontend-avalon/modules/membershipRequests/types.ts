export interface MembershipRequestCreateRequest {
  firstName: string
  lastName: string
  email: string
  ruc: string
}

export type MembershipRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface MembershipRequestDecisionRequest {
  status: MembershipRequestStatus
  sriVerified: boolean
  reviewNote?: string
}

export interface MembershipRequestResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  ruc: string
  status: MembershipRequestStatus
  sriVerified: boolean
  reviewNote?: string | null
  reviewedBy?: string | null
  createdAt: string
  reviewedAt?: string | null
}
