import { HttpStatusCode } from "axios";
import { apiHandler } from "@/lib/http/apiHandler";
import { EstablishmentRequestApi } from "../api/EstablishmentRequest.api";
import type {
  EstablishmentRequestCreate,
  EstablishmentRequestReview,
} from "../dto/EstablishmentRequest";
import type { EstablishmentRequestStatusFilter } from "../enum/EstablishmentRequestStatusFilter";
import { EstablishmentRequestMapper } from "../mapper/EstablishmenRequest.mapper";

export class EstablishmentRequestService {
  public static async findAll(filter: EstablishmentRequestStatusFilter) {
    const { data } = await apiHandler(() =>
      EstablishmentRequestApi.findAll(filter),
    );

    return data.map(EstablishmentRequestMapper.toEntity);
  }

  public static async create(dto: EstablishmentRequestCreate) {
    const errorMapper = {
      [HttpStatusCode.Conflict]:
        "Ya tiene un establecimiento con el mismo nombre o tienes peticiones pendientes",
      [HttpStatusCode.BadRequest]:
        "Certificado no valido. Solo se acepta pdf (tamaño máximo: 5MB)",
    };

    const { data } = await apiHandler(
      () => EstablishmentRequestApi.create(dto),
      errorMapper,
    );

    return EstablishmentRequestMapper.toEntity(data);
  }

  public static async review(id: number, dto: EstablishmentRequestReview) {
    const errorMapper = {
      [HttpStatusCode.NotFound]: "La solicitud no existe",
      [HttpStatusCode.BadRequest]: "Nota de revisión es requerida",
      [HttpStatusCode.Conflict]: "La solicitud ya ha sido revisada",
    };

    const { data } = await apiHandler(
      () => EstablishmentRequestApi.review(id, dto),
      errorMapper,
    );

    return EstablishmentRequestMapper.toEntity(data);
  }
}
