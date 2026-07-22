/**
 * Canonical ascetic ranks and sects — mirrors
 * `apps/maharaj-api/src/profiles/ascetic.ts`.
 *
 * The API stores the **rank** (`muni`, `aryika`, …). "Maharaj Ji" and "Mataji"
 * are honorifics, so they belong in the UI layer only. Prefer the server's
 * `type_display` when a response carries it; these constants exist for the
 * create/edit pickers, which have no server value to read yet.
 */

export const ASCETIC_TYPES = [
  { value: 'muni', title: 'Maharaj Ji', rank: 'Muni Shri' },
  { value: 'aryika', title: 'Mataji', rank: 'Aryika Shri' },
  { value: 'kshullak', title: 'Kshullak Ji', rank: 'Kshullak Shri' },
  { value: 'kshullika', title: 'Kshullika Ji', rank: 'Kshullika Shri' },
  { value: 'ailak', title: 'Ailak Ji', rank: 'Ailak Shri' },
] as const;

/** Falls back to the raw value so an unknown rank never renders blank. */
export function asceticTitle(type?: string | null): string {
  if (!type) return '';
  return ASCETIC_TYPES.find((t) => t.value === type)?.title ?? type;
}

export const SECTS = [
  { value: 'digambar', label: 'Digambar', subSects: ['Terapanth', 'Bisapanth', 'Taran Panth'] },
  { value: 'shwetambar', label: 'Shwetambar', subSects: ['Murtipujak', 'Sthanakvasi', 'Terapanth'] },
] as const;

export function sectLabel(sect?: string | null): string {
  if (!sect) return '';
  return SECTS.find((s) => s.value === sect)?.label ?? sect;
}

export function subSectsFor(sect?: string | null): readonly string[] {
  return SECTS.find((s) => s.value === sect)?.subSects ?? [];
}
