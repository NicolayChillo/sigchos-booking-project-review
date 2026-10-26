import { describe, it, expect } from 'vitest'
import { validateEcuadorRuc } from '../validateEcuadorRuc'

describe('validateEcuadorRuc — Validador de RUC ecuatoriano', () => {

  // ─── Formato básico ───────────────────────────────────────────────────────

  describe('Formato general', () => {
    it('Debe retornar false si tiene menos de 13 dígitos', () => {
      expect(validateEcuadorRuc('123456789012')).toBe(false)
    })

    it('Debe retornar false si tiene más de 13 dígitos', () => {
      expect(validateEcuadorRuc('12345678901234')).toBe(false)
    })

    it('Debe retornar false si contiene letras', () => {
      expect(validateEcuadorRuc('170123456789A')).toBe(false)
    })

    it('Debe retornar false si está vacío', () => {
      expect(validateEcuadorRuc('')).toBe(false)
    })
  })

  // ─── Código de provincia ─────────────────────────────────────────────────

  describe('Código de provincia', () => {
    it('Debe retornar false si la provincia es 00', () => {
      // Construimos un número de 13 dígitos con provincia 00
      expect(validateEcuadorRuc('0001234567001')).toBe(false)
    })

    it('Debe retornar false si la provincia es 25 (no existe)', () => {
      expect(validateEcuadorRuc('2501234567001')).toBe(false)
    })

    it('Debe retornar true con provincia 01 válida', () => {
      // RUC válido de persona natural provincia 01 (verificado con algoritmo real)
      // Usamos un RUC de la SRI público de dominio común para tests
      expect(validateEcuadorRuc('0101000180001')).toBe(true)
    })
  })

  // ─── Tercer dígito inválido ───────────────────────────────────────────────

  describe('Tercer dígito', () => {
    it('Debe retornar false si el tercer dígito es 7 (tipo no reconocido)', () => {
      expect(validateEcuadorRuc('0171234567001')).toBe(false)
    })

    it('Debe retornar false si el tercer dígito es 8 (tipo no reconocido)', () => {
      expect(validateEcuadorRuc('0181234567001')).toBe(false)
    })
  })

  // ─── Persona natural (tercer dígito 0-5) ─────────────────────────────────

  describe('Persona natural', () => {
    it('RUC válido de persona natural (tercer dígito ≤ 5) → true', () => {
      // RUC: 1704559895001 — checksum Modulo 10 verificado (verif=5)
      expect(validateEcuadorRuc('1704559895001')).toBe(true)
    })

    it('RUC con checksum incorrecto → false', () => {
      // Mismo base, dígito verificador cambiado de 5 a 6
      expect(validateEcuadorRuc('1704559896001')).toBe(false)
    })

    it('RUC con sufijo 000 (establecimiento inválido) → false', () => {
      expect(validateEcuadorRuc('1704559895000')).toBe(false)
    })
  })

  // ─── Entidad pública (tercer dígito = 6) ─────────────────────────────────

  describe('Entidad pública', () => {
    it('RUC válido de entidad pública → true', () => {
      // RUC: 1760001550001 — checksum Modulo 11 verificado (verif=5)
      expect(validateEcuadorRuc('1760001550001')).toBe(true)
    })

    it('RUC de entidad pública con checksum incorrecto → false', () => {
      // Base 17600016, verif correcto=3, cambiado a 4 para hacerlo incorrecto
      expect(validateEcuadorRuc('1760001640001')).toBe(false)
    })

    it('RUC de entidad pública con sufijo 0000 → false', () => {
      expect(validateEcuadorRuc('1760001550000')).toBe(false)
    })
  })

  // ─── Entidad jurídica (tercer dígito = 9) ────────────────────────────────

  describe('Entidad jurídica (privada)', () => {
    it('RUC válido de entidad jurídica → true', () => {
      expect(validateEcuadorRuc('1791251237001')).toBe(true)
    })

    it('RUC de entidad jurídica con checksum incorrecto → false', () => {
      expect(validateEcuadorRuc('1791251238001')).toBe(false)
    })

    it('RUC de entidad jurídica con sufijo 000 → false', () => {
      expect(validateEcuadorRuc('1791251237000')).toBe(false)
    })
  })
})
