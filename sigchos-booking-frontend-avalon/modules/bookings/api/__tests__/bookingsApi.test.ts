import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosResponse } from 'axios'

// ─── Mock del módulo apiClient ────────────────────────────────────────────────
vi.mock('@/lib/http/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from '@/lib/http/apiClient'
import {
  listVisibleBookings,
  listBookingHistory,
  getBookingById,
  createBooking,
  cancelBooking,
  confirmBooking,
  rescheduleBooking,
} from '../bookingsApi'
import type { BookingResponse, BookingCreateRequest, BookingRescheduleRequest } from '../../types'

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPatch = vi.mocked(apiClient.patch)

// ─── Fixture de BookingResponse ───────────────────────────────────────────────

const mockBooking: BookingResponse = {
  id: 1,
  userId: 10,
  establishmentId: 5,
  roomTypeId: 2,
  roomTypeName: 'Suite Deluxe',
  roomUnitId: 3,
  roomUnitCode: 'R-101',
  checkInDate: '2026-08-01',
  checkOutDate: '2026-08-03',
  nights: 2,
  status: 'PENDING',
  advancePaymentPercentage: 30,
  advancePaymentAmount: 60,
  totalAmount: 200,
  cancellationPolicy: 'Sin cancelación',
  cancelPenaltyWindowHours: 48,
  cancelPenaltyAfterEnabled: false,
  cancelPenaltyAfterPercentage: null,
  createdAt: '2026-07-01T10:00:00',
  updatedAt: '2026-07-01T10:00:00',
  canceledAt: null,
  isGatewayPaymentAllowed: true,
  bankName: null,
  bankAccountType: null,
  bankAccountNumber: null,
  bankAccountOwnerName: null,
  bankAccountOwnerId: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('bookingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listVisibleBookings()', () => {
    it('Sin filtro: debe llamar a GET /bookings sin parámetros', async () => {
      mockedGet.mockResolvedValueOnce({ data: [mockBooking] } as AxiosResponse)

      const result = await listVisibleBookings()

      expect(mockedGet).toHaveBeenCalledWith('/bookings', { params: undefined })
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('PENDING')
    })

    it('Con filtro PENDING: debe llamar a GET /bookings con params { status: "PENDING" }', async () => {
      mockedGet.mockResolvedValueOnce({ data: [mockBooking] } as AxiosResponse)

      const result = await listVisibleBookings('PENDING')

      expect(mockedGet).toHaveBeenCalledWith('/bookings', { params: { status: 'PENDING' } })
      expect(result[0].status).toBe('PENDING')
    })

    it('Con filtro CANCELED: debe pasar el status correcto', async () => {
      const canceledBooking = { ...mockBooking, status: 'CANCELED' as const }
      mockedGet.mockResolvedValueOnce({ data: [canceledBooking] } as AxiosResponse)

      const result = await listVisibleBookings('CANCELED')

      expect(mockedGet).toHaveBeenCalledWith('/bookings', { params: { status: 'CANCELED' } })
      expect(result[0].status).toBe('CANCELED')
    })
  })

  describe('listBookingHistory()', () => {
    it('Debe llamar a GET /bookings/history', async () => {
      mockedGet.mockResolvedValueOnce({ data: [mockBooking] } as AxiosResponse)

      const result = await listBookingHistory()

      expect(mockedGet).toHaveBeenCalledWith('/bookings/history')
      expect(result).toHaveLength(1)
    })
  })

  describe('getBookingById()', () => {
    it('Debe llamar a GET /bookings/:id y retornar la reserva', async () => {
      mockedGet.mockResolvedValueOnce({ data: mockBooking } as AxiosResponse)

      const result = await getBookingById(1)

      expect(mockedGet).toHaveBeenCalledWith('/bookings/1')
      expect(result.id).toBe(1)
    })
  })

  describe('createBooking()', () => {
    it('Debe llamar a POST /bookings con el payload correcto y retornar la reserva creada', async () => {
      const payload: BookingCreateRequest = {
        roomUnitId: 3,
        checkInDate: '2026-08-01',
        checkOutDate: '2026-08-03',
      }
      mockedPost.mockResolvedValueOnce({ data: mockBooking } as AxiosResponse)

      const result = await createBooking(payload)

      expect(mockedPost).toHaveBeenCalledWith('/bookings', payload)
      expect(result.roomUnitId).toBe(3)
      expect(result.totalAmount).toBe(200)
    })
  })

  describe('cancelBooking()', () => {
    it('Debe llamar a PATCH /bookings/:id/cancel y retornar la reserva actualizada', async () => {
      const canceled = { ...mockBooking, status: 'CANCELED' as const }
      mockedPatch.mockResolvedValueOnce({ data: canceled } as AxiosResponse)

      const result = await cancelBooking(1)

      expect(mockedPatch).toHaveBeenCalledWith('/bookings/1/cancel')
      expect(result.status).toBe('CANCELED')
    })
  })

  describe('confirmBooking()', () => {
    it('Debe llamar a PATCH /bookings/:id/confirm y retornar la reserva con estado ADVANCE_CONFIRMED', async () => {
      const confirmed = { ...mockBooking, status: 'ADVANCE_CONFIRMED' as const }
      mockedPatch.mockResolvedValueOnce({ data: confirmed } as AxiosResponse)

      const result = await confirmBooking(1)

      expect(mockedPatch).toHaveBeenCalledWith('/bookings/1/confirm')
      expect(result.status).toBe('ADVANCE_CONFIRMED')
    })
  })

  describe('rescheduleBooking()', () => {
    it('Debe llamar a PATCH /bookings/:id/reschedule con el payload y retornar la reserva reprogramada', async () => {
      const payload: BookingRescheduleRequest = {
        checkInDate: '2026-09-01',
        checkOutDate: '2026-09-03',
      }
      const rescheduled = { ...mockBooking, checkInDate: '2026-09-01', checkOutDate: '2026-09-03' }
      mockedPatch.mockResolvedValueOnce({ data: rescheduled } as AxiosResponse)

      const result = await rescheduleBooking(1, payload)

      expect(mockedPatch).toHaveBeenCalledWith('/bookings/1/reschedule', payload)
      expect(result.checkInDate).toBe('2026-09-01')
    })
  })
})
