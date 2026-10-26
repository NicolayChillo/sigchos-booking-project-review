import type { UserSummary as UserSummaryResponse } from "../../users/types";
import type { EstablishmentRequestStatus } from "../enum/EstablishmentRequestStatus";

export interface EstablishmentRequestResponse {
  id: number;
  requestedBy: UserSummaryResponse;
  name: string;
  address: string;
  certificateUrl: string;
  status: EstablishmentRequestStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: UserSummaryResponse | null;
}

export interface EstablishmentRequestCreate {
  name: string;
  address: string;
  certificateFile: File;
}

export interface EstablishmentRequestReview {
  status: EstablishmentRequestStatus;
  reviewNote: string | null;
}
