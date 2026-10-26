/**
 * Archivo de setup de Vitest.
 * Se ejecuta ANTES de cada archivo de test.
 */
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Establecer un mock de MSW globalmente para todas las pruebas
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Limpiar los handlers entre pruebas para que no interfieran
afterEach(() => server.resetHandlers())

// Apagar el servidor al final
afterAll(() => server.close())

