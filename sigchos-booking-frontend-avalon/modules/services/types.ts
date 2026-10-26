export type ServiceCategory =
  | 'WIFI'
  | 'PARKING'
  | 'ROOM_SERVICE'
  | 'RESTAURANT'
  | 'POOL'
  | 'TRANSPORT'
  | 'LAUNDRY'
  | 'OTHER'

export interface EstablishmentServiceResponse {
  id: number
  establishmentId: number
  category: ServiceCategory
  name: string
  description: string
  hasAdditionalCost: boolean
  additionalCost: number
  isActive: boolean
}

export interface EstablishmentServicesRequest {
  establishmentId: number
  category: ServiceCategory
  name: string
  description: string
  hasAdditionalCost: boolean
  additionalCost?: number | null
}

export const SERVICE_CATEGORIES: Array<{ label: string; value: ServiceCategory }> = [
  { label: 'WiFi', value: 'WIFI' },
  { label: 'Parqueadero', value: 'PARKING' },
  { label: 'Room Service', value: 'ROOM_SERVICE' },
  { label: 'Restaurante', value: 'RESTAURANT' },
  { label: 'Piscina', value: 'POOL' },
  { label: 'Transporte', value: 'TRANSPORT' },
  { label: 'Lavanderia', value: 'LAUNDRY' },
  { label: 'Otro', value: 'OTHER' },
]
