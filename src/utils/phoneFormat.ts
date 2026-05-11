/**
 * Formats a raw phone input string into the Philippine mobile format: +63 9XX XXX XXXX
 * Handles pasted values in any common form: 09XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX, 9XXXXXXXXX
 */
export function formatPHPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');

  if (digits.startsWith('63')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  digits = digits.slice(0, 10);

  if (!digits) return '';

  let out = '+63 ' + digits.slice(0, 3);
  if (digits.length > 3) out += ' ' + digits.slice(3, 6);
  if (digits.length > 6) out += ' ' + digits.slice(6, 10);

  return out;
}
