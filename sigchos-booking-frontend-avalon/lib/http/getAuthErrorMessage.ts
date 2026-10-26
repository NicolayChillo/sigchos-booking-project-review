import axios from 'axios'

interface ApiErrorPayload {
  message?: string
  error?: string
  detail?: string
}

/**
 * Extracts a user-friendly error message for authentication flows (login / register).
 * Maps known backend messages and HTTP status codes to clear Spanish descriptions.
 */
export function getLoginErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'No fue posible iniciar sesión. Intenta otra vez.'
  }

  const status = error.response?.status
  const payload = error.response?.data as ApiErrorPayload | string | undefined

  // Extract raw backend message
  let backendMessage = ''
  if (typeof payload === 'string' && payload.trim().length > 0) {
    backendMessage = payload.trim()
  } else if (payload && typeof payload === 'object') {
    backendMessage = (payload.message ?? payload.error ?? payload.detail ?? '').trim()
  }

  // Match known backend messages from UserService.login()
  if (backendMessage.toLowerCase().includes('no existe una cuenta')) {
    return 'No existe una cuenta registrada con ese correo electrónico.'
  }
  if (backendMessage.toLowerCase().includes('usuario inactivo') || backendMessage.toLowerCase().includes('suspended')) {
    return 'Usuario inactivo. Contacta con el administrador del sistema.'
  }
  if (backendMessage.toLowerCase().includes('contraseña incorrecta') || backendMessage.toLowerCase().includes('incorrect')) {
    return 'Contraseña incorrecta. Verifica tus datos e intenta nuevamente.'
  }

  // Fallback by HTTP status
  if (status === 401) return 'Credenciales inválidas. Verifica tu correo y contraseña.'
  if (status === 403) return 'Usuario inactivo. Contacta con el administrador del sistema.'
  if (status === 404) return 'No existe una cuenta con ese correo electrónico.'
  if (status === 429) return 'Demasiados intentos fallidos. Espera unos minutos e intenta nuevamente.'
  if (status === 500) return 'Error interno del servidor. Intenta nuevamente más tarde.'

  // If backend sent something readable, use it
  if (backendMessage.length > 0) return backendMessage

  return 'No fue posible iniciar sesión. Intenta otra vez.'
}

/**
 * Extracts a user-friendly error message for Google sign-in.
 */
export function getGoogleLoginErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'No fue posible iniciar sesión con Google. Intenta otra vez.'
  }

  const status = error.response?.status
  const payload = error.response?.data as ApiErrorPayload | string | undefined

  let backendMessage = ''
  if (typeof payload === 'string' && payload.trim().length > 0) {
    backendMessage = payload.trim()
  } else if (payload && typeof payload === 'object') {
    backendMessage = (payload.message ?? payload.error ?? payload.detail ?? '').trim()
  }

  if (backendMessage.toLowerCase().includes('usuario inactivo') || backendMessage.toLowerCase().includes('suspended')) {
    return 'Usuario inactivo. Contacta con el administrador del sistema.'
  }
  if (backendMessage.toLowerCase().includes('invalid google')) {
    return 'Token de Google inválido. Intenta nuevamente.'
  }

  if (status === 403) return 'Usuario inactivo. Contacta con el administrador del sistema.'
  if (status === 500) return 'Error interno del servidor. Intenta nuevamente más tarde.'

  if (backendMessage.length > 0) return backendMessage

  return 'No fue posible iniciar sesión con Google. Intenta otra vez.'
}

/**
 * Extracts a user-friendly error message for registration.
 */
export function getRegisterErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'No fue posible registrar la cuenta en este momento.'
  }

  const status = error.response?.status
  const payload = error.response?.data as ApiErrorPayload | string | undefined

  let backendMessage = ''
  if (typeof payload === 'string' && payload.trim().length > 0) {
    backendMessage = payload.trim()
  } else if (payload && typeof payload === 'object') {
    backendMessage = (payload.message ?? payload.error ?? payload.detail ?? '').trim()
  }

  if (status === 409 || backendMessage.toLowerCase().includes('already registered') || backendMessage.toLowerCase().includes('already exists')) {
    return 'Ya existe una cuenta registrada con ese correo electrónico. Intenta iniciar sesión.'
  }
  if (status === 400) {
    return backendMessage.length > 0
      ? backendMessage
      : 'Los datos ingresados no son válidos. Revisa el formulario e intenta nuevamente.'
  }
  if (status === 500) return 'Error interno del servidor. Intenta nuevamente más tarde.'

  if (backendMessage.length > 0) return backendMessage

  return 'No fue posible registrar la cuenta en este momento. Intenta otra vez.'
}
