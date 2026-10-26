import type { UserSummary } from "../../users/types";
import type { EstablishmentRequestStatus } from "../enum/EstablishmentRequestStatus";

export class EstablishmentRequest {
  id?: number;
  requestedBy: UserSummary;
  name: string;
  address: string;
  certificateUrl?: string;
  status: EstablishmentRequestStatus;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: UserSummary | null;

  constructor(init: {
    id?: number;
    requestedBy: UserSummary;
    name: string;
    address: string;
    certificateUrl?: string;
    status: EstablishmentRequestStatus;
    reviewNote: string | null;
    createdAt?: Date;
    reviewedAt: Date | null;
    reviewedBy: UserSummary | null;
  }) {
    this.id = init.id;
    this.requestedBy = init.requestedBy;
    this.name = init.name;
    this.address = init.address;
    this.certificateUrl = init.certificateUrl;
    this.status = init.status;
    this.reviewNote = init.reviewNote;
    this.createdAt = init.createdAt ?? new Date(Date.now());
    this.reviewedAt = init.reviewedAt;
    this.reviewedBy = init.reviewedBy;
  }
}
