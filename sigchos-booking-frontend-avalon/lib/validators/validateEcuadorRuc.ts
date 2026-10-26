/**
 * Validates an Ecuadorian RUC (Registro Único de Contribuyentes).
 *
 * Rules:
 * - Must be exactly 13 digits
 * - First 2 digits = province code (01–24)
 * - Third digit determines entity type:
 *   0–5 → natural person  (verifier at position 9, suffix > 000)
 *   6   → public entity   (verifier at position 8, suffix > 0000)
 *   9   → legal entity    (verifier at position 9, suffix > 000)
 *
 * Verification uses Módulo 11.
 */
export function validateEcuadorRuc(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc)) return false

  const province = parseInt(ruc.slice(0, 2), 10)
  if (province < 1 || province > 24) return false

  const thirdDigit = parseInt(ruc[2], 10)

  if (thirdDigit >= 0 && thirdDigit <= 5) {
    // Natural person — Módulo 10
    return validateNaturalPerson(ruc)
  } else if (thirdDigit === 6) {
    // Public entity — Módulo 11 (public)
    return validatePublicEntity(ruc)
  } else if (thirdDigit === 9) {
    // Legal entity — Módulo 11 (private)
    return validateLegalEntity(ruc)
  }

  return false
}

/** Natural person: uses Módulo 10 on first 9 digits */
function validateNaturalPerson(ruc: string): boolean {
  if (ruc.slice(10) === '000') return false

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  const digits = ruc.slice(0, 9).split('').map(Number)
  const verifier = parseInt(ruc[9], 10)

  const total = digits.reduce((sum, d, i) => {
    let product = d * coefficients[i]
    if (product >= 10) product -= 9
    return sum + product
  }, 0)

  const remainder = total % 10
  const computed = remainder === 0 ? 0 : 10 - remainder
  return computed === verifier
}

/** Public entity: uses Módulo 11 on first 8 digits, verifier at position 8 */
function validatePublicEntity(ruc: string): boolean {
  if (ruc.slice(9) === '0000') return false

  const coefficients = [3, 2, 7, 6, 5, 4, 3, 2]
  const digits = ruc.slice(0, 8).split('').map(Number)
  const verifier = parseInt(ruc[8], 10)

  const total = digits.reduce((sum, d, i) => sum + d * coefficients[i], 0)
  const remainder = total % 11
  const computed = remainder === 0 ? 0 : 11 - remainder
  return computed === verifier
}

/** Legal entity (private): uses Módulo 11 on first 9 digits, verifier at position 9 */
function validateLegalEntity(ruc: string): boolean {
  if (ruc.slice(10) === '000') return false

  const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2]
  const digits = ruc.slice(0, 9).split('').map(Number)
  const verifier = parseInt(ruc[9], 10)

  const total = digits.reduce((sum, d, i) => sum + d * coefficients[i], 0)
  const remainder = total % 11
  const computed = remainder === 0 ? 0 : 11 - remainder
  return computed === verifier
}
