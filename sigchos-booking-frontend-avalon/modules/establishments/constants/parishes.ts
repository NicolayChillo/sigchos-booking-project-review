export const PARISH_OPTIONS = [
  { value: "SIGCHOS", label: "Sigchos cabecera cantonal" },
  { value: "CHUGCHILAN", label: "Chugchilán" },
  { value: "ISINLIVI", label: "Isinliví" },
  { value: "LAS_PAMPAS", label: "Las Pampas" },
  { value: "PALO_QUEMADO", label: "Palo Quemado" },
] as const;

export type ParishValue = (typeof PARISH_OPTIONS)[number]["value"];

export function getParishLabel(value: string | null | undefined): string {
  if (!value) return "-";
  return PARISH_OPTIONS.find((p) => p.value === value)?.label ?? value;
}
