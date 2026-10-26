import { apiClient } from '@/lib/http/apiClient';
import type {
  BookingCreateRequest,
  BookingRescheduleRequest,
  BookingResponse,
  BookingStatus,
} from '../types';

export async function listVisibleBookings(status?: BookingStatus): Promise<BookingResponse[]> {
  const response = await apiClient.get<BookingResponse[]>('/bookings', {
    params: status ? { status } : undefined,
  });

  return response.data;
}

export async function listBookingHistory(): Promise<BookingResponse[]> {
  const response = await apiClient.get<BookingResponse[]>('/bookings/history');
  return response.data;
}

export async function getBookingById(id: number): Promise<BookingResponse> {
  const response = await apiClient.get<BookingResponse>(`/bookings/${id}`);
  return response.data;
}

export async function createBooking(payload: BookingCreateRequest): Promise<BookingResponse> {
  const response = await apiClient.post<BookingResponse>('/bookings', payload);
  return response.data;
}

export async function cancelBooking(id: number): Promise<BookingResponse> {
  const response = await apiClient.patch<BookingResponse>(`/bookings/${id}/cancel`);
  return response.data;
}

export async function confirmBooking(id: number): Promise<BookingResponse> {
  const response = await apiClient.patch<BookingResponse>(`/bookings/${id}/confirm`);
  return response.data;
}

export async function rescheduleBooking(
  id: number,
  payload: BookingRescheduleRequest,
): Promise<BookingResponse> {
  const response = await apiClient.patch<BookingResponse>(`/bookings/${id}/reschedule`, payload);
  return response.data;
}

export async function listPaymentsForBooking(bookingId: number, status?: string): Promise<any[]> {
  const response = await apiClient.get(`/bookings/${bookingId}/payments`, {
    params: status && status !== 'ALL' ? { status } : undefined,
  });
  return response.data;
}
