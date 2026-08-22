export interface SantRepUser {
  id: string;
  mobile: string;
  name: string | null;
  sant_ids: string[];
}

export interface AuthState {
  user: SantRepUser | null;
  access_token: string | null;
  refresh_token: string | null;
  sant_ids: string[];
}

export interface MaharajProfile {
  /** Long-form public profile (migration 034) — what a devotee reads. */
  about?: string | null;
  diksha_place?: string | null;
  education?: string | null;
  /** Conferred titles. Never the canonical `type` rank. */
  honours?: string | null;
  lineage?: string | null;
  id: string;
  /**
   * The canonical display name. Kept as the value every reader falls back to;
   * `name_en` / `name_hi` (migration 044) are the per-script ones.
   *
   * All three are **read-only in this portal** — only the Super Admin writes
   * them. A rep corrects a spelling through a change request.
   */
  name: string;
  name_en?: string | null;
  name_hi?: string | null;
  /** Canonical rank. The honorific ("Maharaj Ji") is `type_display`. */
  type: 'muni' | 'aryika' | 'kshullak' | 'kshullika' | 'ailak' | 'sadhu' | 'sadhvi';
  /** Rendered honorific from the API — prefer this over mapping locally. */
  type_display?: string;
  /** The same, in Devanagari. Both are returned; the client picks by locale. */
  type_display_hi?: string;
  /**
   * POST held (migration 039, widened by 044), distinct from the rank above:
   * an Acharya is still a Muni. 'none' is a real answer, not a missing one.
   */
  pad?: 'acharya' | 'upadhyaya' | 'elacharya' | 'ganini' | 'bhattarak'
      | 'panyas' | 'gani' | 'pravartak' | 'pravartini' | 'mahattara' | 'sadhvi_pramukha'
      | 'none';
  /** "Acharya", "Ganini", … Empty string when the post is 'none'. */
  pad_display?: string;
  pad_display_hi?: string;
  /**
   * Derived from `samadhi_date` by the API. A samadhistha profile is a record:
   * it stays fully visible, but has no representatives and nothing to update.
   */
  is_samadhistha?: boolean;
  /**
   * Anniversary dates (migration 039). Nullable, and `null` clears the field on
   * save — `diksha_year` stays authoritative when only the year is known.
   */
  birth_date?: string | null;
  diksha_date?: string | null;
  /** Set once the ascetic has attained samadhi; the profile becomes historical. */
  samadhi_date?: string | null;
  /** The observed tithi in words — observance follows the tithi, not the date. */
  tithi_note?: string | null;
  /** Community (Oswal, Porwal…), NOT the sect. */
  samuday: string;
  /** Sampradaya, and the panth/gaccha within it. */
  sect?: 'digambar' | 'shwetambar';
  sect_display?: string;
  sect_display_hi?: string;
  sub_sect?: string;
  diksha_year?: number;
  guru_name?: string;
  bio?: string;
  languages?: string[];
  photo_url?: string;
  /** Inline photo (data: URI). Takes precedence over photo_url — see doc-v2/Images_And_Photos.md. */
  photo_base64?: string;
  photo_mime?: string;
  verified: boolean;
  verified_at?: string;
  followers_count: number;
  place?: string;
  current_city?: string;
  current_state?: string;
  created_at: string;
}

export interface Location {
  id: string;
  place: string;
  city: string;
  state: string;
  from_date?: string;
  to_date?: string;
  chaturmas?: boolean;
  /**
   * Varshayog year (migration 039), derived from `from_date` when the chaturmas
   * flag is set. It is what the devotee-facing chaturmas directory groups by —
   * a flagged row without one cannot appear there at all.
   */
  chaturmas_year?: number | null;
  notes?: string;
  lat?: number;
  lng?: number;
  is_current: boolean;
  created_at: string;
}

export interface ViharEntry {
  id: string;
  expected_from: string;
  expected_to?: string;
  place: string;
  city?: string;
  state: string;
  notes?: string;
  created_at: string;
}

export interface Requirement {
  id: string;
  type: 'chuka' | 'gochari' | 'medical' | 'stay' | 'travel_support' | 'other';
  description: string;
  needed_on?: string;
  city?: string;
  visibility?: string;
  status: 'open' | 'in_progress' | 'fulfilled';
  fulfilled_by?: string;
  created_at: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  created_at: string;
}

export interface Follower {
  devotee_id: string;
  name?: string;
  mobile: string;
  followed_at: string;
}

/**
 * An event this Sadhu-Sadhvi is holding (migration 039).
 *
 * Anniversaries (diksha/janma jayanti, punya tithi) are NOT events: they are
 * derived from the profile's own dates at read time, so a corrected date never
 * leaves a stale row behind. Only things with their own facts live here.
 */
export interface SantEvent {
  id: string;
  title: string;
  type: 'pravachan' | 'panchkalyanak' | 'pratishtha' | 'diksha'
      | 'vidhan' | 'shibir' | 'chaturmas_sthapana' | 'other';
  /** Rendered label from the API — prefer it over mapping locally. */
  type_display?: string;
  description?: string | null;
  place?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
  starts_on: string;
  ends_on?: string | null;
  /** Free text: programmes start "after aahar" as often as at a clock time. */
  starts_at_time?: string | null;
  tithi_note?: string | null;
  visibility?: 'public' | 'followers_and_temples' | 'followers';
  /** Cancel rather than delete once announced — devotees may have travelled. */
  status: 'scheduled' | 'cancelled' | 'completed';
  tenant_id?: string | null;
  tenant_name?: string | null;
  created_at?: string;
}
