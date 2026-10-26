import { describe, it, expect } from 'vitest'
import { getEnumLabel } from '../enum.utils'

describe('getEnumLabel', () => {
  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendiente',
    ADVANCE_CONFIRMED: 'Anticipo confirmado',
    COMPLETED: 'Completada',
    CANCELED: 'Cancelada',
  }

  it('Debe retornar el label correcto cuando la clave existe en el enum', () => {
    expect(getEnumLabel(STATUS_LABELS, 'PENDING')).toBe('Pendiente')
    expect(getEnumLabel(STATUS_LABELS, 'ADVANCE_CONFIRMED')).toBe('Anticipo confirmado')
    expect(getEnumLabel(STATUS_LABELS, 'COMPLETED')).toBe('Completada')
    expect(getEnumLabel(STATUS_LABELS, 'CANCELED')).toBe('Cancelada')
  })

  it('Debe retornar el valor original cuando la clave NO existe en el enum (fallback)', () => {
    expect(getEnumLabel(STATUS_LABELS, 'UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS')
  })

  it('Debe retornar el valor original para un enum vacío (fallback)', () => {
    expect(getEnumLabel({}, 'PENDING')).toBe('PENDING')
  })
})
