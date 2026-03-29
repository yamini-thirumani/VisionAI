/** Placeholder for missing numeric or text fields (avoid em dash, which was confused with minus). */
export const NA = 'n/a';

export function cell(value, fallback = NA) {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}
