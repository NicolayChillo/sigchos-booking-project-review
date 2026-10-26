import { apiClient } from '@/lib/http/apiClient';
import type {
  RoomUnitRequest,
  RoomUnitResponse,
  RoomUnitUpdateStatusRequest,
  StatusFilter,
} from '../types';

export async function listRoomUnitsByRoomType(
  roomTypeId: number,
  status: StatusFilter = 'ALL',
): Promise<RoomUnitResponse[]> {
  const response = await apiClient.get<RoomUnitResponse[]>(
    `/room-types/${roomTypeId}/room-units`,
    { params: { status } },
  );
  return response.data;
}

export async function getRoomUnitById(roomUnitId: number): Promise<RoomUnitResponse> {
  const response = await apiClient.get<RoomUnitResponse>(`/room-units/${roomUnitId}`);
  return response.data;
}

export async function createRoomUnitInRoomType(
  roomTypeId: number,
  payload: RoomUnitRequest,
): Promise<RoomUnitResponse> {
  const response = await apiClient.post<RoomUnitResponse>(
    `/room-types/${roomTypeId}/room-units`,
    payload,
  );
  return response.data;
}

export async function updateRoomUnitInRoomType(
  roomTypeId: number,
  roomUnitId: number,
  payload: RoomUnitRequest,
): Promise<RoomUnitResponse> {
  const response = await apiClient.put<RoomUnitResponse>(
    `/room-types/${roomTypeId}/room-units/${roomUnitId}`,
    payload,
  );
  return response.data;
}

export async function deleteRoomUnit(roomUnitId: number): Promise<void> {
  await apiClient.delete(`/room-units/${roomUnitId}`);
}

export async function restoreRoomUnit(roomUnitId: number): Promise<void> {
  await apiClient.patch(`/room-units/${roomUnitId}/restore`);
}

export async function updateRoomUnitStatus(
  roomUnitId: number,
  payload: RoomUnitUpdateStatusRequest,
): Promise<void> {
  await apiClient.patch(`/room-units/${roomUnitId}/status`, payload);
}
