export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    "status" in error
  );
}

export async function apiHandler<T>(
  requestCallback: () => Promise<T>,
  errorMapper?: Record<number, string>,
): Promise<T> {
  try {
    return await requestCallback();
  } catch (e) {
    if (isErrorResponse(e)) {
      const errorStatusMessage = errorMapper?.[e.status];
      throw new Error(errorStatusMessage ?? e.message);
    }

    throw new Error("Error desconocido");
  }
}
