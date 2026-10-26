import axios from 'axios'
import { API_BASE_URL } from '../config/env'
import { clearAuthToken, getAuthToken } from './tokenStorage'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'))
      }
    }

    return Promise.reject(error)
  },
)
