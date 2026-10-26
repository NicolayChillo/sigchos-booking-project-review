export interface EstablishmentImageResponse {
  id: number;
  establishmentId: number;
  url: string;
  isPrimary: boolean;
}

export type EstablishmentImageUpdateRequest =
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
