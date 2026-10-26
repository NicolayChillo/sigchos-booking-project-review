import type { UserSummary } from "../../users/types";
import type { EstablishmentRequestResponse } from "../dto/EstablishmentRequest";
import { EstablishmentRequest } from "../model/EstablishmentRequest";

export class EstablishmentRequestMapper {
  public static toEntity(
    dto: EstablishmentRequestResponse,
  ): EstablishmentRequest {
    const requester: UserSummary = dto.requestedBy;
    const reviewer: UserSummary | null = dto.reviewedBy
      ? dto.reviewedBy
      : null;

    return new EstablishmentRequest({
      id: dto.id,
      address: dto.address,
      name: dto.name,
      certificateUrl: dto.certificateUrl,
      status: dto.status,
      reviewNote: dto.reviewNote,
      requestedBy: requester,
      reviewedAt: dto.reviewedAt ? new Date(dto.reviewedAt) : null,
      createdAt: new Date(dto.createdAt),
      reviewedBy: reviewer,
    });
  }
}
