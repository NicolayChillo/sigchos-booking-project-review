export type BookingStatus =
  | 'PENDING'
  | 'ADVANCE_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELED';

export interface BookingResponse {
  id: number;
  userId: number;
  establishmentId: number;
  roomTypeId: number;
  roomTypeName: string;
  roomUnitId: number;
  roomUnitCode: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: BookingStatus;
  advancePaymentPercentage: number;
  advancePaymentAmount: number;
  totalAmount: number;
  cancellationPolicy: string;
  cancelPenaltyWindowHours: 24 | 48 | 72 | null;
  cancelPenaltyAfterEnabled: boolean;
  cancelPenaltyAfterPercentage: number | null;
  createdAt: string;
  updatedAt: string;
  canceledAt: string | null;
  isGatewayPaymentAllowed: boolean;
  bankName: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
  bankAccountOwnerName: string | null;
  bankAccountOwnerId: string | null;
}

export interface BookingCreateRequest {
  roomUnitId: number;
  checkInDate: string;
  checkOutDate: string;
}

export interface BookingRescheduleRequest {
  checkInDate: string;
  checkOutDate: string;
}

export const BOOKING_STATUS_OPTIONS: Array<{
  label: string;
  value: BookingStatus | 'ALL';
}> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Anticipo confirmado', value: 'ADVANCE_CONFIRMED' },
  { label: 'Completada', value: 'COMPLETED' },
  { label: 'Cancelada', value: 'CANCELED' }
];
