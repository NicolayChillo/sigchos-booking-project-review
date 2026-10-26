import {
  RoomTypeImageRequest,
  RoomTypeImageResponse,
  RoomTypeImageUpdateRequest
} from '../roomTypeImages/types';

export type StatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

export type RoomCategory =
  | 'HOTEL_ROOM'
  | 'HOSTEL_BED'
  | 'APARTMENT'
  | 'VILLA'
  | 'GLAMPING_UNIT';

export type RoomBedType =
  | 'BUNK'
  | 'SINGLE'
  | 'DOUBLE'
  | 'QUEEN'
  | 'KING'
  | 'SOFA_BED';

export type RoomAmenity =
  | 'AIR_CONDITIONING_OR_HEATING'
  | 'FAN'
  | 'TV_SMART_OR_CABLE'
  | 'IN_ROOM_WIFI'
  | 'SHOWER_OR_BATHTUB'
  | 'HOT_WATER'
  | 'HAIR_DRYER'
  | 'COFFEE_OR_TEA_MAKER'
  | 'MINIBAR_OR_REFRIGERATOR'
  | 'MICROWAVE'
  | 'SAFE_BOX'
  | 'JACUZZI'
  | 'DIRECT_ROOM_SERVICE'
  | 'SPEAKERS';

export type RoomUnitStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'OUT_OF_ORDER';

export interface RoomTypeResponse {
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
  isActive: boolean;
  images: RoomTypeImageResponse[];
}

export interface RoomTypeRequest {
  name: string;
  description: string;
  category: RoomCategory;
  capacity: number;
  bedCount: number;
  bedType: RoomBedType;
  amenities: RoomAmenity[];
  pricePerNight: number;
  requiresAdvancePayment: boolean;
  advancePaymentPercentage?: number | null;
  images: RoomTypeImageRequest[];
}

export interface RoomTypeUpdateRequest {
  name: string;
  description: string;
  category: RoomCategory;
  capacity: number;
  bedCount: number;
  bedType: RoomBedType;
  amenities: RoomAmenity[];
  pricePerNight: number;
  requiresAdvancePayment: boolean;
  advancePaymentPercentage?: number | null;
  images: RoomTypeImageUpdateRequest[];
}

export interface RoomUnitResponse {
  id: number;
  roomTypeId: number;
  code: string;
  status: RoomUnitStatus;
  isActive: boolean;
}

export interface RoomUnitRequest {
  code: string;
}

export interface RoomUnitUpdateStatusRequest {
  status: RoomUnitStatus;
}

export const ROOM_CATEGORY_OPTIONS: Array<{
  value: RoomCategory;
  label: string;
}> = [
  { value: 'HOTEL_ROOM', label: 'Habitacion de hotel' },
  { value: 'HOSTEL_BED', label: 'Cama de hostel' },
  { value: 'APARTMENT', label: 'Apartamento' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'GLAMPING_UNIT', label: 'Glamping' }
];

export const ROOM_BED_TYPE_OPTIONS: Array<{
  value: RoomBedType;
  label: string;
}> = [
  { value: 'BUNK', label: 'Litera' },
  { value: 'SINGLE', label: 'Individual' },
  { value: 'DOUBLE', label: 'Doble' },
  { value: 'QUEEN', label: 'Queen' },
  { value: 'KING', label: 'King' },
  { value: 'SOFA_BED', label: 'Sofa cama' }
];

export const ROOM_AMENITY_GROUPS: Array<{
  key:
    | 'COMFORT'
    | 'TECHNOLOGY'
    | 'PRIVATE_BATHROOM'
    | 'EXTRAS'
    | 'PREMIUM_EXTRAS';
  label: string;
  options: Array<{ value: RoomAmenity; label: string }>;
}> = [
  {
    key: 'COMFORT',
    label: 'Confort',
    options: [
      {
        value: 'AIR_CONDITIONING_OR_HEATING',
        label: 'Aire acondicionado o calefaccion'
      },
      { value: 'FAN', label: 'Ventilador' }
    ]
  },
  {
    key: 'TECHNOLOGY',
    label: 'Tecnologia',
    options: [
      { value: 'TV_SMART_OR_CABLE', label: 'TV (smart TV o cable)' },
      { value: 'IN_ROOM_WIFI', label: 'WiFi en la habitacion' }
    ]
  },
  {
    key: 'PRIVATE_BATHROOM',
    label: 'Bano privado',
    options: [
      { value: 'SHOWER_OR_BATHTUB', label: 'Ducha o bañera' },
      { value: 'HOT_WATER', label: 'Agua caliente' },
      { value: 'HAIR_DRYER', label: 'Secador de cabello' }
    ]
  },
  {
    key: 'EXTRAS',
    label: 'Extras',
    options: [
      { value: 'COFFEE_OR_TEA_MAKER', label: 'Cafetera o tetera' },
      { value: 'MINIBAR_OR_REFRIGERATOR', label: 'Minibar o refrigerador' },
      { value: 'MICROWAVE', label: 'Microondas' },
      { value: 'SAFE_BOX', label: 'Caja fuerte' }
    ]
  },
  {
    key: 'PREMIUM_EXTRAS',
    label: 'Extras premium',
    options: [
      { value: 'JACUZZI', label: 'Jacuzzi' },
      { value: 'DIRECT_ROOM_SERVICE', label: 'Servicio de habitacion directo' },
      { value: 'SPEAKERS', label: 'Altavoces' }
    ]
  }
];

export const ROOM_UNIT_STATUS_OPTIONS: Array<{
  value: RoomUnitStatus;
  label: string;
}> = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'OCCUPIED', label: 'Ocupada' },
  { value: 'RESERVED', label: 'Reservada' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'OUT_OF_ORDER', label: 'Fuera de servicio' }
];
