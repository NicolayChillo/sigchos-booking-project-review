import { http, HttpResponse } from 'msw'
import { AuthResponse } from '@/lib/auth/types'

// Define the API URL based on environment variables or fallback to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export const handlers = [
  // Intercept POST /auth/login (cualquier host/prefijo)
  http.post(new RegExp('.*/auth/login'), async ({ request }) => {
    const data = await request.json() as any

    // Simulate invalid credentials
    if (data.email === 'invalid@test.com') {
      return HttpResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Simulate successful login
    const response: AuthResponse = {
      token: 'fake-jwt-token-from-msw',
      user: {
        id: 1,
        firstName: 'Usuario',
        lastName: 'Prueba',
        email: data.email,
        phone: '0999999999',
        role: 'CLIENT',
        active: true,
        profileCompleted: true,
        mustChangePassword: false,
        hasPassword: true,
        birthDate: '1990-01-01',
      },
    }

    return HttpResponse.json(response, { status: 200 })
  }),

  // Intercept POST /auth/register
  http.post(new RegExp('.*/auth/register'), async ({ request }) => {
    return HttpResponse.json({
      id: 2,
      email: 'nuevo@test.com',
      firstName: 'Juan',
      lastName: 'Perez',
      role: 'CLIENT',
    }, { status: 200 })
  }),
]
