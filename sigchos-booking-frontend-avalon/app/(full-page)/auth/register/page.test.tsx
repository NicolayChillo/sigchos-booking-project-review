import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterPage from './page'

// Mock de next/navigation
const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock de AuthContext
vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
  }),
}))

// Mock de GoogleSignInButton
vi.mock('@/modules/auth/components/GoogleSignInButton', () => ({
  GoogleSignInButton: () => <div data-testid="google-button">Google Sign In</div>,
}))

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

describe('RegisterPage (Pruebas de Integración con MSW)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Muestra mensajes de error si se envía el formulario vacío', async () => {
    renderWithProviders(<RegisterPage />)
    const user = userEvent.setup()

    const submitBtn = screen.getByRole('button', { name: /crear cuenta/i })
    await user.click(submitBtn)

    expect(await screen.findByText('Ingresa tu nombre.')).toBeInTheDocument()
    expect(await screen.findByText('Ingresa un correo válido.')).toBeInTheDocument()
    
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('Registra exitosamente y redirige a login', async () => {
    renderWithProviders(<RegisterPage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/nombre/i), 'Juan')
    await user.type(screen.getByLabelText(/apellido/i), 'Perez')
    await user.type(screen.getByLabelText(/correo/i), 'nuevo@test.com')
    await user.type(screen.getByLabelText(/teléfono/i), '0999999999')
    await user.type(screen.getByLabelText(/fecha de nacimiento/i), '1990-01-01')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!')
    await user.type(screen.getByLabelText(/^confirmar contraseña$/i), 'Password123!')
    
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      // asume que MSW devuelve un 200 en la ruta mockeada
      expect(mockReplace).toHaveBeenCalledWith('/auth/login?fromRegister=true&email=nuevo%40test.com')
    })
  })
})
