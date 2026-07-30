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

/**
 * Canonical sect key for a stored value.
 *
 * `public.maharaj_profiles.samuday` is free text and really does hold both
 * `digamber` (e) and `Shwetambar` (capitalised), so exact `===` matching fell
 * through and rendered the raw column value. Normalise on a prefix so both
 * transliterations of each sampradaya resolve to one key.
 */
export function sectKey(sect?: string | null): 'digambar' | 'shwetambar' | null {
  const s = (sect ?? '').toLowerCase().trim();
  if (!s) return null;
  if (s.startsWith('digamb')) return 'digambar';
  if (s.startsWith('shwetamb') || s.startsWith('shvetamb') || s.startsWith('svetamb')) {
    return 'shwetambar';
  }
  return null;
}

export const isDigambar = (sect?: string | null): boolean => sectKey(sect) === 'digambar';

export function sectLabel(sect?: string | null): string {
  if (!sect) return '';
  return SECTS.find((s) => s.value === sectKey(sect))?.label ?? sect;
}

export function subSectsFor(sect?: string | null): readonly string[] {
  return SECTS.find((s) => s.value === sectKey(sect))?.subSects ?? [];
}

/**
 * Alms-round terminology differs by sect and both words are in the DB enum:
 * Digambara say **Aahar / Aahar Charya**, Shwetambar say **Gochari**. Showing
 * a Digambar profile "Gochari" (or vice versa) is simply the wrong word — see
 * doc-v2/Glossary_And_Naming.md §3.2.
 *
 * `chuka` is the stored value for the cooked-meal request; it is labelled by
 * the same rule so the two never appear as unrelated options.
 */
export function almsLabel(type: string, sect?: string | null): string {
  const digambar = isDigambar(sect);
  if (type === 'gochari') return digambar ? 'Aahar Charya' : 'Gochari';
  if (type === 'chuka') return digambar ? 'Aahar (Chuka)' : 'Chuka';
  return '';
}
