import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Configura un servidor Mock de MSW con los handlers definidos
export const server = setupServer(...handlers)
