import { apiClient } from '@/lib/http/apiClient';
import type {
  EstablishmentRequest,
  EstablishmentResponse,
  EstablishmentUpdateRequest
} from '../types';

export async function listEstablishments(): Promise<EstablishmentResponse[]> {
  const response = await apiClient.get<EstablishmentResponse[]>(
    '/establishments'
  );
  return response.data;
}

export async function getEstablishmentById(
  id: number
): Promise<EstablishmentResponse> {
  const response = await apiClient.get<EstablishmentResponse>(
    `/establishments/${id}`
  );
  return response.data;
}

export async function createEstablishment(
  payload: EstablishmentRequest
): Promise<EstablishmentResponse> {
  const response = await apiClient.post<EstablishmentResponse>(
    '/establishments',
    payload
  );
  return response.data;
}

export async function updateEstablishment(
  id: number,
  payload: EstablishmentUpdateRequest
): Promise<EstablishmentResponse> {
  const formData = new FormData();

  formData.append('userId', payload.userId.toString());
  formData.append('name', payload.name);
  formData.append('description', payload.description);
  formData.append('address', payload.address);
  formData.append('checkInTime', payload.checkInTime);
  formData.append('checkOutTime', payload.checkOutTime);
  formData.append('advancePaymentPolicy', payload.advancePaymentPolicy);
  formData.append('cancellationPolicy', payload.cancellationPolicy);
  formData.append(
    'cancelPenaltyAfterEnabled',
    String(payload.cancelPenaltyAfterEnabled)
  );
  formData.append('childrenPolicy', payload.childrenPolicy);
  formData.append('ageRestrictionPolicy', payload.ageRestrictionPolicy);
  formData.append('petsPolicy', payload.petsPolicy);
  (payload.otherPolicies ?? []).forEach((policy, index) => {
    formData.append(`otherPolicies[${index}]`, policy);
  });

  payload.images.forEach((img, index) => {
    if (img.id !== null && img.id !== undefined) {
      formData.append(`images[${index}].id`, img.id.toString());
    }

    formData.append(`images[${index}].isPrimary`, String(img.isPrimary));

    if (img.file) {
      formData.append(`images[${index}].file`, img.file, img.file.name);
    }
  });

  if (payload.cancelPenaltyWindowHours !== null) {
    formData.append(
      'cancelPenaltyWindowHours',
      payload.cancelPenaltyWindowHours.toString()
    );
  }
  if (payload.cancelPenaltyAfterPercentage !== null) {
    formData.append(
      'cancelPenaltyAfterPercentage',
      payload.cancelPenaltyAfterPercentage.toString()
    );
  }
  if (payload.parish !== null) formData.append('parish', payload.parish);
  if (payload.latitude !== null)
    formData.append('latitude', payload.latitude.toString());
  if (payload.longitude !== null)
    formData.append('longitude', payload.longitude.toString());
  if (payload.payphoneToken !== null)
    formData.append('payphoneToken', payload.payphoneToken);
  if (payload.payphoneStoreId !== null)
    formData.append('payphoneStoreId', payload.payphoneStoreId);
  if (payload.bankName !== null && payload.bankName !== undefined)
    formData.append('bankName', payload.bankName);
  if (payload.bankAccountType !== null && payload.bankAccountType !== undefined)
    formData.append('bankAccountType', payload.bankAccountType);
  if (payload.bankAccountNumber !== null && payload.bankAccountNumber !== undefined)
    formData.append('bankAccountNumber', payload.bankAccountNumber);
  if (payload.bankAccountOwnerName !== null && payload.bankAccountOwnerName !== undefined)
    formData.append('bankAccountOwnerName', payload.bankAccountOwnerName);
  if (payload.bankAccountOwnerId !== null && payload.bankAccountOwnerId !== undefined)
    formData.append('bankAccountOwnerId', payload.bankAccountOwnerId);

  const response = await apiClient.put<EstablishmentResponse>(
    `/establishments/${id}`,
    formData,
    {
      headers: {
        'Content-Type': undefined
      }
    }
  );
  return response.data;
}

export async function deleteEstablishment(id: number): Promise<void> {
  await apiClient.delete(`/establishments/${id}`);
}

export async function restoreEstablishment(id: number): Promise<void> {
  await apiClient.patch(`/establishments/${id}/restore`);
}
