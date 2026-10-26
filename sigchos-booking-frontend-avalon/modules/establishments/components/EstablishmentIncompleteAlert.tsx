import React from 'react';
import Link from 'next/link';

interface Props {
  missingFields: string[];
  establishmentId?: number;
  /** When provided, shows a "missing room inventory" item and a link to manage rooms */
  roomsPath?: string;
}

export function EstablishmentIncompleteAlert({
  missingFields,
  establishmentId,
  roomsPath,
}: Props) {
  const hasRoomWarning = Boolean(roomsPath);
  const totalItems = missingFields.length + (hasRoomWarning ? 1 : 0);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="p-4 mb-4 border-round surface-100 border-1 border-yellow-500">
      <div className="flex align-items-start gap-3">
        <i className="pi pi-exclamation-triangle text-yellow-600 text-2xl mt-1"></i>
        <div className="flex flex-column gap-2 w-full">
          <h4 className="m-0 text-900 font-semibold">Información pendiente por completar</h4>
          <p className="m-0 text-700">Tu establecimiento fue aprobado pero necesita que completes la siguiente información para que esté disponible en el catálogo público.</p>
          <ul className="m-0 pl-3 text-700 mt-2">
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
            {hasRoomWarning && (
              <li>Al menos un tipo de habitación activo con al menos una unidad de habitación activa</li>
            )}
          </ul>
          <div className="flex flex-wrap gap-2 mt-3">
            {establishmentId !== undefined && missingFields.length > 0 && (
              <Link href={`/establishments/${establishmentId}/edit`}>
                <span className="p-button p-button-warning p-button-outlined p-component">
                  <span className="p-button-label">Completar información</span>
                </span>
              </Link>
            )}
            {roomsPath && (
              <Link href={roomsPath}>
                <span className="p-button p-button-warning p-button-outlined p-component">
                  <span className="p-button-label">Gestionar habitaciones</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
