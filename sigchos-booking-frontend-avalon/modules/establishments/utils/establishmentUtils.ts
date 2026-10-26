import type { EstablishmentResponse } from '../types';

interface MissingField {
  key: string;
  label: string;
}

const REQUIRED_FIELDS: MissingField[] = [
  { key: 'description', label: 'Descripción' },
  { key: 'checkInTime', label: 'Hora de check-in' },
  { key: 'checkOutTime', label: 'Hora de check-out' },
  { key: 'advancePaymentPolicy', label: 'Política de pagos anticipados' },
  { key: 'cancellationPolicy', label: 'Política de cancelación' },
  { key: 'childrenPolicy', label: 'Condiciones para estancias de niños' },
  { key: 'ageRestrictionPolicy', label: 'Restricción por edad' },
  { key: 'petsPolicy', label: 'Política de mascotas' },
  { key: 'parish', label: 'Parroquia' },
  { key: 'latitude', label: 'Ubicación en el mapa' },
];

function hasCompletePayphone(establishment: EstablishmentResponse): boolean {
  return (
    !!establishment.payphoneToken?.trim() &&
    !!establishment.payphoneStoreId?.trim()
  );
}

function hasCompleteBankTransfer(establishment: EstablishmentResponse): boolean {
  return (
    !!establishment.bankName?.trim() &&
    !!establishment.bankAccountType?.trim() &&
    !!establishment.bankAccountNumber?.trim() &&
    !!establishment.bankAccountOwnerName?.trim() &&
    !!establishment.bankAccountOwnerId?.trim()
  );
}

export function hasPaymentMethod(establishment: EstablishmentResponse): boolean {
  return hasCompletePayphone(establishment) || hasCompleteBankTransfer(establishment);
}

export function isEstablishmentIncomplete(establishment: EstablishmentResponse): boolean {
  return getMissingFields(establishment).length > 0;
}

export function getMissingFields(establishment: EstablishmentResponse): string[] {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = establishment[field.key as keyof EstablishmentResponse];
    return value === null || value === undefined || value === '';
  }).map((field) => field.label);

  if (!hasPaymentMethod(establishment)) {
    missing.push('Método de pago (Payphone completo o transferencia bancaria completa)');
  }

  return missing;
}

