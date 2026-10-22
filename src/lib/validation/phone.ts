const SEPARATORS = /[\s().-]/g;

export function normalizeBulgarianPhone(input: string): string | null {
  const stripped = input.trim().replace(SEPARATORS, "");
  if (!/^\+?\d+$/.test(stripped)) return null;

  let national = "";
  if (stripped.startsWith("+359")) national = stripped.slice(4);
  else if (stripped.startsWith("00359")) national = stripped.slice(5);
  else if (stripped.startsWith("359")) national = stripped.slice(3);
  else if (stripped.startsWith("0")) national = stripped.slice(1);
  else return null;

  if (!/^\d{8,9}$/.test(national) || national.startsWith("0")) return null;
  return `+359${national}`;
}

export function isBulgarianPhone(input: string): boolean {
  return normalizeBulgarianPhone(input) !== null;
}
