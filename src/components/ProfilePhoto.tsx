import { useState } from 'react';

/**
 * An ascetic's photograph, falling back to the initial.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 * Three places in this portal wrote the same `<img src={photo_base64 ||
 * photo_url}>` by hand and none of them handled a failure. Two escaped notice
 * because they passed `alt=""`; the profile header passed the ascetic's name,
 * so when the image failed the browser painted that name inside the round
 * frame — the ascetic's own name in broken letters where their face should be.
 *
 * A failure is not rare. `photo_url` points at a third-party WordPress site
 * that rate-limits bursts, and until migration 071 the inline copy was stored
 * as BARE base64 with no `data:` prefix, which made it a relative URL that
 * 404s — every inline photograph in the directory failed that way.
 *
 * `alt` is empty on purpose: every caller prints the name beside or below the
 * avatar already, so alt text here is a duplicate when it works and a
 * disfigurement when it does not.
 */
export function ProfilePhoto({
  src,
  name,
  className = 'w-11 h-11',
  textClassName = '',
}: {
  /** `photo_base64 || photo_url` — a data: URI or an external URL. */
  src?: string | null;
  /** Used only for the initial. */
  name?: string | null;
  /** Sizing for the circle, e.g. "w-20 h-20". */
  className?: string;
  /** Extra classes for the initial, for headers on a dark background. */
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const usable = !failed && src ? src : null;
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?';

  if (usable) {
    return (
      <img
        src={usable}
        alt=""
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <span
      className={`${className} ${textClassName || 'bg-navy-100 text-navy-800'} rounded-full font-bold flex items-center justify-center flex-shrink-0`}
    >
      {initial}
    </span>
  );
}
