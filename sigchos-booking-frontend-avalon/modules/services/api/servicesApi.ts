import { apiClient } from '@/lib/http/apiClient'
import type {
  EstablishmentServicesRequest,
  EstablishmentServiceResponse,
} from '../types'

export async function listServicesByEstablishment(
  establishmentId: number,
): Promise<EstablishmentServiceResponse[]> {
  const response = await apiClient.get<EstablishmentServiceResponse[]>(
    `/establishments/${establishmentId}/services`,
  )
  return response.data
}

export async function getServiceByIdInEstablishment(
  establishmentId: number,
  serviceId: number,
): Promise<EstablishmentServiceResponse> {
  const response = await apiClient.get<EstablishmentServiceResponse>(
    `/establishments/${establishmentId}/services/${serviceId}`,
  )
  return response.data
}

export async function createServiceInEstablishment(
  establishmentId: number,
  payload: EstablishmentServicesRequest,
): Promise<EstablishmentServiceResponse> {
  const response = await apiClient.post<EstablishmentServiceResponse>(
    `/establishments/${establishmentId}/services`,
    payload,
  )
  return response.data
}

export async function updateServiceInEstablishment(
  establishmentId: number,
  serviceId: number,
  payload: EstablishmentServicesRequest,
): Promise<EstablishmentServiceResponse> {
  const response = await apiClient.put<EstablishmentServiceResponse>(
    `/establishments/${establishmentId}/services/${serviceId}`,
    payload,
  )
  return response.data
}

export async function deleteServiceInEstablishment(
  establishmentId: number,
  serviceId: number,
): Promise<void> {
  await apiClient.delete(`/establishments/${establishmentId}/services/${serviceId}`)
}

export async function restoreServiceInEstablishment(
  establishmentId: number,
  serviceId: number,
): Promise<void> {
  await apiClient.patch(
    `/establishments/${establishmentId}/services/${serviceId}/restore`,
  )
}
