/**
 * Canonical ascetic ranks, posts and sects — mirrors
 * `apps/maharaj-api/src/profiles/ascetic.ts`, which is the source of truth.
 *
 * The API stores the **rank** (`muni`, `aryika`, …). "Maharaj Ji" and "Mataji"
 * are honorifics, so they belong in the display layer only. Prefer the server's
 * `type_display` / `type_display_hi` when a response carries them; these
 * constants exist for the edit pickers, which have no server value to read yet.
 *
 * TWO THINGS THIS FILE HAD WRONG UNTIL MIGRATION 044:
 *
 *   1. The Shwetambar ranks were missing. Migration 040 added `sadhu` and
 *      `sadhvi` to the database and to sant-api, but not here — so opening a
 *      Sadhvi's profile showed a rank picker that did not contain her own rank,
 *      and the select silently fell back to its first option. Saving would have
 *      re-filed a Shwetambar ascetic as a Digambara Muni.
 *   2. Nothing was translated. The app renders in five languages but printed
 *      "Maharaj Ji · Digambar" in Latin letters beside a Devanagari name.
 */

export const ASCETIC_TYPES = [
  // Digambara
  { value: 'muni', title: 'Maharaj Ji', titleHi: 'महाराज जी', rank: 'Muni Shri', rankHi: 'मुनि श्री', sect: 'digambar' },
  { value: 'aryika', title: 'Mataji', titleHi: 'माताजी', rank: 'Aryika Shri', rankHi: 'आर्यिका श्री', sect: 'digambar' },
  { value: 'kshullak', title: 'Kshullak Ji', titleHi: 'क्षुल्लक जी', rank: 'Kshullak Shri', rankHi: 'क्षुल्लक श्री', sect: 'digambar' },
  { value: 'kshullika', title: 'Kshullika Ji', titleHi: 'क्षुल्लिका जी', rank: 'Kshullika Shri', rankHi: 'क्षुल्लिका श्री', sect: 'digambar' },
  { value: 'ailak', title: 'Ailak Ji', titleHi: 'ऐलक जी', rank: 'Ailak Shri', rankHi: 'ऐलक श्री', sect: 'digambar' },
  // Shwetambar (migration 040). "Maharaj Saheb", not the Digambara "Maharaj Ji".
  { value: 'sadhu', title: 'Maharaj Saheb', titleHi: 'महाराज साहेब', rank: 'Sadhu Shri', rankHi: 'साधु श्री', sect: 'shwetambar' },
  { value: 'sadhvi', title: 'Sadhviji', titleHi: 'साध्वीजी', rank: 'Sadhvi Shri', rankHi: 'साध्वी श्री', sect: 'shwetambar' },
] as const;

/** Falls back to the raw value so an unknown rank never renders blank. */
export function asceticTitle(type?: string | null, lang?: string): string {
  if (!type) return '';
  const found = ASCETIC_TYPES.find((t) => t.value === type);
  if (!found) return type;
  return lang === 'hi' ? found.titleHi : found.title;
}

export function asceticRank(type?: string | null, lang?: string): string {
  if (!type) return '';
  const found = ASCETIC_TYPES.find((t) => t.value === type);
  if (!found) return type;
  return lang === 'hi' ? found.rankHi : found.rank;
}

/**
 * Only the ranks of one tradition. A single flat list is how a Shwetambar
 * Sadhvi came to be stored as `muni` and addressed as "Maharaj Ji"; the API
 * refuses the mismatch (TYPE_SECT_MISMATCH), and filtering here means the rep
 * never discovers that rule by being rejected.
 */
export function typesForSect(sect?: string | null): readonly (typeof ASCETIC_TYPES)[number][] {
  const key = sectKey(sect);
  if (!key) return ASCETIC_TYPES;
  return ASCETIC_TYPES.filter((t) => t.sect === key);
}

/**
 * Posts (pad) an ascetic may hold — migration 039, widened by 044.
 *
 * A POST, not a rank: an Acharya is a Muni who leads a sangh and does not stop
 * being a Muni, which is why this is separate from ASCETIC_TYPES. 'none' is a
 * real answer (most ascetics hold no post), not a missing one.
 *
 * The Shwetambar half — Panyas, Gani, Pravartak, Pravartini, Mahattara, Sadhvi
 * Pramukha — arrived with 044. Before that the whole hierarchy had to be filed
 * as 'none' with the post buried in free-text `honours`.
 */
export const PADS = [
  { value: 'none', label: '—', labelHi: '—', sects: ['digambar', 'shwetambar'] },
  { value: 'acharya', label: 'Acharya', labelHi: 'आचार्य', sects: ['digambar', 'shwetambar'] },
  { value: 'upadhyaya', label: 'Upadhyaya', labelHi: 'उपाध्याय', sects: ['digambar', 'shwetambar'] },
  { value: 'elacharya', label: 'Elacharya', labelHi: 'ऐलाचार्य', sects: ['digambar'] },
  { value: 'ganini', label: 'Ganini', labelHi: 'गणिनी', sects: ['digambar'] },
  { value: 'bhattarak', label: 'Bhattarak', labelHi: 'भट्टारक', sects: ['digambar'] },
  { value: 'panyas', label: 'Panyas', labelHi: 'पंन्यास', sects: ['shwetambar'] },
  { value: 'gani', label: 'Gani', labelHi: 'गणि', sects: ['shwetambar'] },
  { value: 'pravartak', label: 'Pravartak', labelHi: 'प्रवर्तक', sects: ['shwetambar'] },
  { value: 'pravartini', label: 'Pravartini', labelHi: 'प्रवर्तिनी', sects: ['shwetambar'] },
  { value: 'mahattara', label: 'Mahattara', labelHi: 'महत्तरा', sects: ['shwetambar'] },
  { value: 'sadhvi_pramukha', label: 'Sadhvi Pramukha', labelHi: 'साध्वी प्रमुखा', sects: ['shwetambar'] },
] as const;

export function padLabel(pad?: string | null, lang?: string): string {
  if (!pad || pad === 'none') return '';
  const found = PADS.find((p) => p.value === pad);
  if (!found) return pad;
  return lang === 'hi' ? found.labelHi : found.label;
}

/** Posts held only by female ascetics, mirroring the API's own rule. */
const FEMALE_PADS = ['ganini', 'pravartini', 'mahattara', 'sadhvi_pramukha'];
const FEMALE_TYPES = ['aryika', 'sadhvi'];

/**
 * Which posts a given rank may hold, within its own tradition.
 *
 * Ganini pairs with an Aryika ("Ganini Aryika"); Pravartini, Mahattara and
 * Sadhvi Pramukha with a Sadhvi; the rest with male ascetics who can lead a
 * sangh. Kshullak and Kshullika are junior ranks and hold none. The API
 * enforces this too (PAD_TYPE_MISMATCH) — filtering the picker means the rep
 * never has to discover the rule by being rejected.
 */
export function padsForType(
  type?: string | null,
  sect?: string | null,
): readonly (typeof PADS)[number][] {
  const key = sectKey(sect) ?? sectForType(type);
  const inTradition = key ? PADS.filter((p) => (p.sects as readonly string[]).includes(key)) : PADS;
  if (!type) return inTradition;
  if (FEMALE_TYPES.includes(type)) {
    return inTradition.filter((p) => p.value === 'none' || FEMALE_PADS.includes(p.value));
  }
  if (type === 'muni' || type === 'ailak' || type === 'sadhu') {
    return inTradition.filter((p) => !FEMALE_PADS.includes(p.value));
  }
  // Kshullak/Kshullika hold no post at all.
  return PADS.filter((p) => p.value === 'none');
}

export const SECTS = [
  { value: 'digambar', label: 'Digambar', labelHi: 'दिगंबर', subSects: ['Terapanth', 'Bisapanth', 'Taran Panth'] },
  { value: 'shwetambar', label: 'Shwetambar', labelHi: 'श्वेतांबर', subSects: ['Murtipujak', 'Sthanakvasi', 'Terapanth'] },
] as const;

/** The tradition a rank belongs to, or null when the rank is unknown. */
export function sectForType(type?: string | null): 'digambar' | 'shwetambar' | null {
  return (ASCETIC_TYPES.find((t) => t.value === type)?.sect as 'digambar' | 'shwetambar') ?? null;
}

/**
 * Canonical sect key for a stored value.
 *
 * `public.sant_profiles.samuday` is free text and really does hold both
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

export function sectLabel(sect?: string | null, lang?: string): string {
  if (!sect) return '';
  const found = SECTS.find((s) => s.value === sectKey(sect));
  if (!found) return sect;
  return lang === 'hi' ? found.labelHi : found.label;
}

export function subSectsFor(sect?: string | null): readonly string[] {
  return SECTS.find((s) => s.value === sectKey(sect))?.subSects ?? [];
}

/**
 * The name to show, given the reader's language (migration 044).
 *
 * Falls back rather than blanking: a profile curated only in Devanagari must
 * still show something to a reader in English, and vice versa. `name` — the
 * pre-044 single column — is the last resort and is never empty.
 */
export function displayName(
  p: { name?: string | null; name_en?: string | null; name_hi?: string | null } | null | undefined,
  lang?: string,
): string {
  if (!p) return '';
  const hi = (p.name_hi ?? '').trim();
  const en = (p.name_en ?? '').trim();
  const legacy = (p.name ?? '').trim();
  if (lang === 'hi') return hi || en || legacy;
  return en || legacy || hi;
}

/**
 * The name in the OTHER script, when it differs from what is being shown.
 *
 * Rendered as a secondary line under the primary name. Empty when the profile
 * is curated in one script only, or when the two happen to be identical —
 * printing the same string twice reads as a rendering bug.
 */
export function secondaryName(
  p: { name?: string | null; name_en?: string | null; name_hi?: string | null } | null | undefined,
  lang?: string,
): string {
  if (!p) return '';
  const primary = displayName(p, lang);
  const other = lang === 'hi' ? (p.name_en ?? '').trim() : (p.name_hi ?? '').trim();
  return other && other !== primary ? other : '';
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
