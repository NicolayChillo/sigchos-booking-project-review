import { apiClient } from '@/lib/http/apiClient';
import type {
  RoomTypeRequest,
  RoomTypeResponse,
  RoomTypeUpdateRequest,
  StatusFilter
} from '../types';

export async function listRoomTypesByEstablishment(
  establishmentId: number,
  status: StatusFilter = 'ALL'
): Promise<RoomTypeResponse[]> {
  const response = await apiClient.get<RoomTypeResponse[]>(
    `/establishments/${establishmentId}/room-types`,
    {
      params: { status }
    }
  );
  return response.data;
}

export async function getRoomTypeById(
  roomTypeId: number
): Promise<RoomTypeResponse> {
  const response = await apiClient.get<RoomTypeResponse>(
    `/room-types/${roomTypeId}`
  );
  return response.data;
}

export async function createRoomTypeInEstablishment(
  establishmentId: number,
  payload: RoomTypeRequest
): Promise<RoomTypeResponse> {
  const formData = new FormData();

  formData.append('name', payload.name);
  formData.append('description', payload.description);
  formData.append('category', payload.category);
  formData.append('capacity', payload.capacity.toString());
  formData.append('bedCount', payload.bedCount.toString());
  formData.append('bedType', payload.bedType);
  formData.append('pricePerNight', payload.pricePerNight.toString());

  formData.append(
    'requiresAdvancePayment',
    String(payload.requiresAdvancePayment)
  );

  payload.images.forEach((img, index) => {
    formData.append(`images[${index}].isPrimary`, String(img.isPrimary));
    formData.append(`images[${index}].file`, img.file, img.file.name);
  });

  if (payload.advancePaymentPercentage != null) {
    formData.append(
      'advancePaymentPercentage',
      payload.advancePaymentPercentage.toString()
    );
  }

  payload.amenities.forEach((amenity) => {
    formData.append('amenities', amenity);
  });

  const response = await apiClient.post<RoomTypeResponse>(
    `/establishments/${establishmentId}/room-types`,
    formData,
    {
      headers: {
        'Content-Type': undefined
      }
    }
  );
  return response.data;
}

export async function updateRoomTypeInEstablishment(
  establishmentId: number,
  roomTypeId: number,
  payload: RoomTypeUpdateRequest
): Promise<RoomTypeResponse> {
  const formData = new FormData();

  formData.append('name', payload.name);
  formData.append('description', payload.description);
  formData.append('category', payload.category);
  formData.append('capacity', payload.capacity.toString());
  formData.append('bedCount', payload.bedCount.toString());
  formData.append('bedType', payload.bedType);
  formData.append('pricePerNight', payload.pricePerNight.toString());

  formData.append(
    'requiresAdvancePayment',
    String(payload.requiresAdvancePayment)
  );

  payload.images.forEach((img, index) => {
    if (img.id !== null && img.id !== undefined) {
      formData.append(`images[${index}].id`, img.id.toString());
    }

    formData.append(`images[${index}].isPrimary`, String(img.isPrimary));

    if (img.file) {
      formData.append(`images[${index}].file`, img.file, img.file.name);
    }
  });

  if (payload.advancePaymentPercentage != null) {
    formData.append(
      'advancePaymentPercentage',
      payload.advancePaymentPercentage.toString()
    );
  }

  payload.amenities.forEach((amenity) => {
    formData.append('amenities', amenity);
  });

  const response = await apiClient.put<RoomTypeResponse>(
    `/establishments/${establishmentId}/room-types/${roomTypeId}`,
    formData,
    {
      headers: {
        'Content-Type': undefined
      }
    }
  );
  return response.data;
}

export async function deleteRoomType(roomTypeId: number): Promise<void> {
  await apiClient.delete(`/room-types/${roomTypeId}`);
}

export async function restoreRoomType(roomTypeId: number): Promise<void> {
  await apiClient.patch(`/room-types/${roomTypeId}/restore`);
}
