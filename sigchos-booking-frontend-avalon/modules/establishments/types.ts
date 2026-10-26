import {
  EstablishmentImageResponse,
  EstablishmentImageUpdateRequest
} from '../establishmentImages/types';

export interface EstablishmentResponse {
  id: number;
  userId: number;
  name: string;
  description: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  advancePaymentPolicy: string;
  cancellationPolicy: string;
  cancelPenaltyWindowHours: 24 | 48 | 72 | null;
  cancelPenaltyAfterEnabled: boolean;
  cancelPenaltyAfterPercentage: number | null;
  childrenPolicy: string;
  ageRestrictionPolicy: string;
  petsPolicy: string;
  otherPolicies: string[];
  parish: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  payphoneToken: string | null;
  payphoneStoreId: string | null;
  hasGatewayAvailable: boolean;
  bankName: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
  bankAccountOwnerName: string | null;
  bankAccountOwnerId: string | null;
  images: EstablishmentImageResponse[];
}

export interface EstablishmentRequest {
  userId: number;
  name: string;
  description: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  advancePaymentPolicy: string;
  cancellationPolicy: string;
  cancelPenaltyWindowHours: 24 | 48 | 72 | null;
  cancelPenaltyAfterEnabled: boolean;
  cancelPenaltyAfterPercentage: number | null;
  childrenPolicy: string;
  ageRestrictionPolicy: string;
  petsPolicy: string;
  parish: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface EstablishmentUpdateRequest {
  userId: number;
  name: string;
  description: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  advancePaymentPolicy: string;
  cancellationPolicy: string;
  cancelPenaltyWindowHours: 24 | 48 | 72 | null;
  cancelPenaltyAfterEnabled: boolean;
  cancelPenaltyAfterPercentage: number | null;
  childrenPolicy: string;
  ageRestrictionPolicy: string;
  petsPolicy: string;
  otherPolicies: string[];
  parish: string | null;
  latitude: number | null;
  longitude: number | null;
  payphoneToken: string | null;
  payphoneStoreId: string | null;
  bankName: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
  bankAccountOwnerName: string | null;
  bankAccountOwnerId: string | null;
  images: EstablishmentImageUpdateRequest[];
}
