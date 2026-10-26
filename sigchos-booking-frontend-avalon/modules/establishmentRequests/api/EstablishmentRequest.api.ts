import { apiClient } from "@/lib/http/apiClient";
import type {
  EstablishmentRequestCreate,
  EstablishmentRequestResponse,
  EstablishmentRequestReview,
} from "../dto/EstablishmentRequest";
import type { EstablishmentRequestStatusFilter } from "../enum/EstablishmentRequestStatusFilter";

export class EstablishmentRequestApi {
  private static readonly endpoint = "/establishment-requests";

  public static findAll(filter: EstablishmentRequestStatusFilter) {
    return apiClient.get<EstablishmentRequestResponse[]>(this.endpoint, {
      params: {
        filter,
      },
    });
  }

  public static create(dto: EstablishmentRequestCreate) {
    const formData = new FormData();
    formData.append("name", dto.name);
    formData.append("address", dto.address);
    formData.append("certificateFile", dto.certificateFile);
    return apiClient.post<EstablishmentRequestResponse>(
      this.endpoint,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      },
    );
  }

  public static review(id: number, dto: EstablishmentRequestReview) {
    return apiClient.patch<EstablishmentRequestResponse>(
      `${this.endpoint}/${id}`,
      dto,
    );
  }
}
