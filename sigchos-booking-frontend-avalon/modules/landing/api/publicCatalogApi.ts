import { apiClient } from '@/lib/http/apiClient';
import type { EstablishmentResponse } from '@/modules/establishments/types';
import type {
  RoomAmenity,
  RoomBedType,
  RoomCategory
} from '@/modules/rooms/types';
import { RoomTypeImageResponse } from '@/modules/roomTypeImages/types';
import type { EstablishmentServiceResponse } from '@/modules/services/types';

export interface PublicRoomTypeResponse {
  id: number;
  establishmentId: number;
  name: string;
  description: string;
  category: RoomCategory;
  capacity: number;
  bedCount: number;
  bedType: RoomBedType;
  amenities: RoomAmenity[];
  pricePerNight: number;
  requiresAdvancePayment: boolean;
  advancePaymentPercentage: number;
  hasVacancy: boolean;
  images: RoomTypeImageResponse[];
}

export interface PublicRoomUnitResponse {
  id: number;
  roomTypeId: number;
  code: string;
}

export async function listPublicEstablishments(): Promise<
  EstablishmentResponse[]
> {
  const response = await apiClient.get<EstablishmentResponse[]>(
    '/public/establishments'
  );
  return response.data;
}

export async function getPublicEstablishmentById(
  id: number
): Promise<EstablishmentResponse> {
  const response = await apiClient.get<EstablishmentResponse>(
    `/public/establishments/${id}`
  );
  return response.data;
}

export async function listPublicServicesByEstablishment(
  id: number
): Promise<EstablishmentServiceResponse[]> {
  const response = await apiClient.get<EstablishmentServiceResponse[]>(
    `/public/establishments/${id}/services`
  );
  return response.data;
}

export async function listPublicRoomTypesByEstablishment(
  id: number
): Promise<PublicRoomTypeResponse[]> {
  const response = await apiClient.get<PublicRoomTypeResponse[]>(
    `/public/establishments/${id}/room-types`
  );
  return response.data;
}

export async function listPublicAvailableRoomUnitsByRoomType(
  establishmentId: number,
  roomTypeId: number,
  checkInDate?: string,
  checkOutDate?: string
): Promise<PublicRoomUnitResponse[]> {
  const response = await apiClient.get<PublicRoomUnitResponse[]>(
    `/public/establishments/${establishmentId}/room-types/${roomTypeId}/room-units`,
    {
      params:
        checkInDate && checkOutDate
          ? {
              checkInDate,
              checkOutDate
            }
          : undefined
    }
  );
  return response.data;
}
