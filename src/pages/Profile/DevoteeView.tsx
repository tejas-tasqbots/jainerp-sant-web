import type { MaharajProfile } from '../../types';

/**
 * Everything a devotee can read about this ascetic that this portal could not.
 *
 * ── WHY IT EXISTS ───────────────────────────────────────────────────────────
 * Compared field by field against the devotee app, 22 columns were rendered on
 * the public profile and nowhere here. An ascetic's own representative — the
 * person answerable for what the profile says — could not see the biography,
 * the parents' names, the brahmacharya record, the acharya pad, the lineage,
 * the varshayog, the photographs or the sources that every devotee could.
 *
 * `bio_en` and `bio_hi` are the worst of it: they hold the life, 1,876
 * profiles carry one, and this portal showed none of them. The API had not
 * even selected the columns — which is precisely the failure its own comment
 * warns about a few lines above the select: "a column that is written but
 * never read is worse than one that is missing: it looks like data loss."
 *
 * ── WHY IT IS READ-ONLY ─────────────────────────────────────────────────────
 * These came from the directory scrape and are curated by the Super Admin, the
 * same as the names. A rep who finds one wrong raises a change request — the
 * control for that is directly above this block — rather than editing a
 * scraped record in place, which would silently diverge from the source it is
 * credited to.
 *
 * ── IT IS NO LONGER "WHAT DEVOTEES SEE" ─────────────────────────────────────
 * Four of these left the devotee profile in 2026-09 (see
 * doc-v2/Sant_Data_Governance.md §4): the parampara, the sangh, Updates and the
 * sources. They are STILL SHOWN HERE, and deliberately.
 *
 * A representative is the person answerable for what the record says, and the
 * scraped text is exactly where the errors are — `updates_text` was rendering
 * raw WordPress shortcodes on 26 profiles, which is the kind of thing only
 * somebody who knows the ascetic will spot and report. Hiding the record from
 * the one person able to correct it, because devotees stopped seeing it, would
 * be the wrong half of the change.
 *
 * What did have to change is the CLAIM. This block used to promise "everything
 * a devotee can read", and rows that are no longer public now say so.
 */
export function DevoteeView({ profile }: { profile: MaharajProfile }) {
  const p = profile as MaharajProfile & Record<string, unknown>;
  const str = (k: string) => {
    const v = p[k];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  const num = (k: string) => (typeof p[k] === 'number' ? String(p[k]) : null);

  const facts: Array<[string, string | null]> = [
    ['Name before diksha', str('name_before_diksha')],
    ["Father's name", str('fathers_name')],
    ["Mother's name", str('mothers_name')],
    ['Family who took diksha', str('family_initiated')],
    ['Birth date (Indian calendar)', str('birth_date_indian')],
    ['Brahmacharya year', num('brahmacharya_year')],
    ['Brahmacharya place', str('brahmacharya_place')],
    ['Brahmacharya guru', str('brahmacharya_guru')],
    ['Acharya pad date', str('acharya_pad_date')?.slice(0, 10) ?? null],
    ['Acharya pad place', str('acharya_pad_place')],
    ['Acharya pad conferred by', str('acharya_pad_by')],
    ['Sallekhana place', str('sallekhana_place')],
  ].filter(([, v]) => v) as Array<[string, string]>;

  // "(not shown to devotees)" on the three the 2026-09 governance pass removed
  // from the public profile. Without it a representative reads this block as a
  // preview of the devotee app and reports a bug that is the intended state.
  const notPublic = ' (not shown to devotees)';
  const texts: Array<[string, string | null]> = [
    ['The life (English)', str('bio_en')],
    ['The life (Hindi)', str('bio_hi')],
    [`Lineage (parampara)${notPublic}`, str('sangh_text')],
    ['Chaturmas (varshayog)', str('chaturmas_text')],
    [`Updates${notPublic}`, str('updates_text')],
  ].filter(([, v]) => v) as Array<[string, string]>;

  const gallery = Array.isArray(p.gallery_urls)
    ? (p.gallery_urls as unknown[]).map(String).filter((u) => u.startsWith('http'))
    : [];
  const sourceUrl = str('source_url');
  const sourceCredit = str('source_credit');
  const sourceRefs = str('source_references');

  if (!facts.length && !texts.length && !gallery.length && !sourceUrl && !sourceCredit) {
    return null;
  }

  return (
    <div className="card mt-4 p-4">
      <h2 className="text-base font-semibold text-navy-900">The full record</h2>
      <p className="mb-3 mt-0.5 text-xs text-slate-500">
        Curated by the JainERP team from the published directory. If anything here is
        wrong, raise a correction above rather than editing the record — it is credited
        to its source.
      </p>

      {facts.length > 0 && (
        <dl className="divide-y divide-slate-100">
          {facts.map(([label, value]) => (
            <div key={label} className="flex gap-3 py-1.5">
              <dt className="w-52 flex-none text-xs text-slate-500">{label}</dt>
              <dd className="min-w-0 flex-1 text-sm text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {texts.map(([label, value]) => (
        <details key={label} className="mt-2 rounded-lg border border-slate-200 p-2">
          <summary className="cursor-pointer text-xs font-medium text-slate-600">
            {label}
          </summary>
          {/* Shown as the source wrote it. The devotee app parses these into a
              lineage tree, a varshayog table and paragraphs; here the point is
              to let a rep check the words, so the raw text is the honest view. */}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {value}
          </p>
        </details>
      ))}

      {gallery.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-slate-500">Photographs ({gallery.length})</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {gallery.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="flex-none">
                <img
                  src={u}
                  alt=""
                  loading="lazy"
                  className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {(sourceUrl || sourceCredit || sourceRefs) && (
        <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
          {sourceCredit}
          {sourceRefs && <span> · {sourceRefs}</span>}
          {sourceUrl && (
            <>
              {' '}
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                source
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
