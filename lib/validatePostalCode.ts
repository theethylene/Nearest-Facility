/**
 * Validates a Singapore postal code: exactly 6 digits, numeric only.
 * Trims surrounding whitespace before checking so a pasted value with
 * leading/trailing spaces isn't rejected unnecessarily.
 */
export function validatePostalCode(input: string): { valid: true; value: string } | { valid: false; reason: string } {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'Please enter a postal code.' };
  }

  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, reason: 'Please enter a valid 6-digit Singapore postal code.' };
  }

  return { valid: true, value: trimmed };
}
