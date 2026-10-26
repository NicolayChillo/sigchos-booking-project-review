import React from "react";
import type { UserRole } from "@/lib/auth/types";
import {
  EstablishmentRequestStatus,
  EstablishmentRequestStatusLabel,
} from "../enum/EstablishmentRequestStatus";
import { EstablishmentRequest } from "../model/EstablishmentRequest";
import type { EstablishmentRequestReview } from "../dto/EstablishmentRequest";

import { useForm, useWatch } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";

interface Props {
  data: EstablishmentRequest;
  role: UserRole | undefined;
  loading?: boolean;
  error?: Error | null;
  disabled?: boolean;
  onReview?: (id: number, dto: EstablishmentRequestReview) => Promise<void>;
}

const validationSchema = z
  .object({
    status: z.enum(
      [
        EstablishmentRequestStatus.APPROVED,
        EstablishmentRequestStatus.REJECTED,
      ],
      "Seleccione una opción de validación"
    ),
    reviewNote: z.string("Este campo es obligatorio").optional(),
  })
  .refine(
    (data) => {
      if (
        data.status === EstablishmentRequestStatus.REJECTED &&
        !data.reviewNote?.trim().length
      )
        return false;

      return true;
    },
    {
      message: "Es obligatorio el motivo de rechazo",
      path: ["reviewNote"],
    }
  )
  .transform((data) => {
    if (data.status === EstablishmentRequestStatus.APPROVED) {
      return {
        ...data,
        reviewNote: undefined,
      };
    }

    return {
      ...data,
    };
  });

export function EstablishmentRequestCard({
  data,
  role,
  loading,
  error,
  disabled,
  onReview,
}: Props) {
  const isReviewer = role === "SYSTEM_ADMIN";
  const isReviewed = data.status !== EstablishmentRequestStatus.PENDING;

  const getBadgeSeverity = (status: EstablishmentRequestStatus) => {
    switch (status) {
      case EstablishmentRequestStatus.APPROVED:
        return "success";
      case EstablishmentRequestStatus.REJECTED:
        return "danger";
      case EstablishmentRequestStatus.PENDING:
        return "warning";
      default:
        return null;
    }
  };

  const {
    register,
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      reviewNote: undefined,
      status: undefined as unknown as ("APPROVED" | "REJECTED"),
    },
  });

  const onSubmit = async (values: z.infer<typeof validationSchema>) => {
    if (!data.id) return;

    try {
      await onReview?.(data.id, {
        reviewNote: values.reviewNote ?? null,
        status: values.status,
      });
    } finally {
      reset();
    }
  };

  const onCancel = () => {
    reset();
  };

  const statusField = useWatch({
    control,
    name: "status",
  });

  const header = (
    <div className="flex justify-content-between align-items-center mb-3">
      <div className="flex align-items-center gap-3">
        <h3 className="m-0 text-xl font-semibold text-900">{data.name}</h3>
        <Tag
          value={EstablishmentRequestStatusLabel[data.status]}
          severity={getBadgeSeverity(data.status)}
        />
      </div>
      {!isReviewed && isReviewer && !statusField && (
        <div className="flex gap-2">
          <Button
            type="button"
            label="Aprobar"
            icon="pi pi-check"
            severity="success"
            outlined
            size="small"
            onClick={() => setValue("status", EstablishmentRequestStatus.APPROVED)}
            disabled={disabled || loading}
          />
          <Button
            type="button"
            label="Rechazar"
            icon="pi pi-times"
            severity="danger"
            outlined
            size="small"
            onClick={() => setValue("status", EstablishmentRequestStatus.REJECTED)}
            disabled={disabled || loading}
          />
        </div>
      )}
    </div>
  );

  return (
    <Card className="shadow-none border-1 surface-border mb-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        {header}
        
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-4">
          <div className="flex flex-column gap-2 text-700 text-sm">
            <div>
              <span className="font-semibold text-900">Dirección:</span>{" "}
              {data.address}
            </div>
            <div>
              <span className="font-semibold text-900">Realizada por:</span>{" "}
              {`${data.requestedBy.firstName} ${data.requestedBy.lastName}`}
            </div>
            <div>
              <span className="font-semibold text-900">Fecha de creación:</span>{" "}
              {data.createdAt ? data.createdAt.toLocaleDateString() : "Sin revisar"}
            </div>
            <div>
              <span className="font-semibold text-900">Revisado por:</span>{" "}
              {data.reviewedBy
                ? `${data.reviewedBy.firstName} ${data.reviewedBy.lastName}`
                : "Sin revisar"}
            </div>
            <div>
              <span className="font-semibold text-900">Fecha de revisión:</span>{" "}
              {data.reviewedAt ? data.reviewedAt.toLocaleDateString() : "Sin revisar"}
            </div>
            {data.reviewNote && (
              <div>
                <span className="font-semibold text-900">Motivo de rechazo:</span>{" "}
                <span className="text-red-500">{data.reviewNote}</span>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <a
              className="flex flex-column gap-2 align-items-center justify-content-center p-3 border-round border-1 surface-border surface-50 hover:surface-100 transition-colors text-700 text-decoration-none"
              href={data.certificateUrl}
              title="Descargar certificado"
              target="_blank"
              rel="noopener noreferrer"
              style={{ minWidth: '100px' }}
            >
              <i className="pi pi-file-pdf text-3xl text-red-500" />
              <span className="text-sm font-medium">Certificado</span>
            </a>
          </div>
        </div>

        {!isReviewed && isReviewer && !!statusField && (
          <div className="mt-4 pt-4 border-top-1 surface-border flex flex-column md:flex-row justify-content-between align-items-start md:align-items-end gap-4">
            {statusField === EstablishmentRequestStatus.REJECTED ? (
              <div className="flex flex-column gap-2 flex-grow-1 w-full md:w-auto">
                <label className="font-semibold text-900 text-sm" htmlFor="reviewNote">
                  Motivo de rechazo
                </label>
                <InputText
                  id="reviewNote"
                  {...register("reviewNote")}
                  className={classNames("w-full", { "p-invalid": errors.reviewNote })}
                  placeholder="Explique el motivo del rechazo..."
                />
              </div>
            ) : (
              <div className="flex-grow-1" />
            )}
            <div className="flex gap-2 w-full md:w-auto justify-content-end">
              <Button
                type="button"
                label="Cancelar"
                icon="pi pi-times"
                severity="secondary"
                text
                onClick={onCancel}
                disabled={disabled || loading}
              />
              <Button
                type="submit"
                label="Aceptar"
                icon={loading ? "pi pi-spinner pi-spin" : "pi pi-check"}
                severity={statusField === EstablishmentRequestStatus.APPROVED ? "success" : "danger"}
                disabled={disabled || loading}
              />
            </div>
          </div>
        )}

        {(error || errors.status || errors.reviewNote) && (
          <div className="mt-3">
            <Message
              severity="error"
              text={
                error?.message ??
                errors.status?.message ??
                (errors.reviewNote?.message as string)
              }
              className="w-full justify-content-start"
            />
          </div>
        )}
      </form>
    </Card>
  );
}
