export interface RoomTypeImageResponse {
  id: number;
  roomTypeId: number;
  url: string;
  isPrimary: boolean;
}

export interface RoomTypeImageRequest {
  file: File;
  isPrimary: boolean;
}

export type RoomTypeImageUpdateRequest =
  | {
      id: null;
      file: File;
      isPrimary: boolean;
    }
  | {
      id: number;
      file: File | null;
      isPrimary: boolean;
    };
