import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from './page'

// 1. Mock de next/navigation
const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}))

// 2. Mock del AuthContext
const mockSignIn = vi.fn()
vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}))

// 3. Mock del GoogleSignInButton para simplificar
vi.mock('@/modules/auth/components/GoogleSignInButton', () => ({
  GoogleSignInButton: () => <div data-testid="google-button">Google Sign In</div>,
}))

// Proveedor de React Query para los tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('LoginPage (Pruebas de Integración con MSW)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Muestra mensajes de error si se envía el formulario vacío (validación del cliente)', async () => {
    renderWithProviders(<LoginPage />)
    const user = userEvent.setup()

    const submitBtn = screen.getByRole('button', { name: /entrar al sistema/i })
    await user.click(submitBtn)

    // RTL verifica que el DOM se actualice con los errores de Zod
    expect(await screen.findByText('Ingresa un correo válido.')).toBeInTheDocument()
    expect(await screen.findByText('Ingresa tu contraseña.')).toBeInTheDocument()
    
    // No se llamó al contexto de auth ni al router
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('Muestra error del servidor si las credenciales son inválidas (integración con MSW)', async () => {
    renderWithProviders(<LoginPage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/correo/i), 'invalid@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'WrongPass123!')
    
    await user.click(screen.getByRole('button', { name: /entrar al sistema/i }))

    // MSW interceptará /auth/login y devolverá 401
    // Esperamos que el mensaje de error aparezca en pantalla
    expect(await screen.findByText(/Credenciales inválidas/i)).toBeInTheDocument()
    
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('Inicia sesión exitosamente y redirige al dashboard (flujo feliz)', async () => {
    renderWithProviders(<LoginPage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/correo/i), 'juan@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'Pass123!')
    
    await user.click(screen.getByRole('button', { name: /entrar al sistema/i }))

    // MSW interceptará y devolverá 200 OK con el token y datos del usuario
    await waitFor(() => {
      // Verificamos que se llame al contexto para guardar la sesión
      expect(mockSignIn).toHaveBeenCalledWith(expect.objectContaining({
        token: 'fake-jwt-token-from-msw',
        user: expect.objectContaining({ email: 'juan@test.com' })
      }))
    })

    // Verificamos la redirección
    expect(mockReplace).toHaveBeenCalledWith('/dashboard')
  })
})
