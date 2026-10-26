import axios from 'axios'

interface ApiErrorPayload {
  message?: string
  error?: string
  detail?: string
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'No se pudo completar la solicitud.',
): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const payload = error.response?.data as ApiErrorPayload | string | undefined

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    if (payload.message) {
      return payload.message
    }

    if (payload.error) {
      return payload.error
    }

    if (payload.detail) {
      return payload.detail
    }
  }

  return fallback
}
