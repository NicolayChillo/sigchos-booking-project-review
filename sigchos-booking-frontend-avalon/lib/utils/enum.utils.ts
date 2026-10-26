export function getEnumLabel(enumObj: Record<string, string>, value: string): string {
  return enumObj[value] ?? value;
}
