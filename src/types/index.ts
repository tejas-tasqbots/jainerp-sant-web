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
  name: string;
  /** Canonical rank. The honorific ("Maharaj Ji") is `type_display`. */
  type: 'muni' | 'aryika' | 'kshullak' | 'kshullika' | 'ailak';
  /** Rendered honorific from the API — prefer this over mapping locally. */
  type_display?: string;
  /** Community (Oswal, Porwal…), NOT the sect. */
  samuday: string;
  /** Sampradaya, and the panth/gaccha within it. */
  sect?: 'digambar' | 'shwetambar';
  sect_display?: string;
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
