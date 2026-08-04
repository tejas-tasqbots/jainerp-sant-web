import { useEffect, useState } from 'react';
import { BookOpen, ImagePlus, Link2, Plus, Trash2, X } from 'lucide-react';
import api, { apiError } from '../lib/api';
import { compressImage } from '../lib/imageCompress';

interface ProfileLink { id: string; kind: string; label?: string | null; url: string }
interface Publication {
  id: string;
  title: string;
  kind: string;
  language?: string | null;
  year?: number | null;
  publisher?: string | null;
  description?: string | null;
  url?: string | null;
}

const LINK_KINDS = [
  'website', 'youtube', 'facebook', 'instagram', 'x', 'whatsapp',
  'telegram', 'linkedin', 'email', 'phone', 'other',
];
const PUB_KINDS = ['book', 'article', 'discourse', 'commentary', 'translation', 'other'];

/**
 * Links and published works on a Sadhu-Sadhvi's public profile.
 *
 * Backed by the same `profile_links` / `profile_publications` tables the mandir
 * side writes to (migration 034), through the same service — a book is a book
 * whoever wrote it, and one implementation means the two can never disagree
 * about validation or ordering.
 *
 * Every call carries the profile id, and the API re-checks ownership on each:
 * a rep may represent several ascetics and must never be able to publish under
 * the wrong name by changing the id in a URL.
 */
export function PublicProfileEditor({ profileId }: { profileId: string }) {
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [newLink, setNewLink] = useState({ kind: 'website', label: '', url: '' });
  const [newPub, setNewPub] = useState({
    title: '', kind: 'book', language: '', year: '', publisher: '', description: '', url: '',
  });
  /**
   * Cover art, compressed in the browser to a data: URI. The API stores it
   * inline (so covers survive redeploys and land in DB backups) and caps the
   * payload at ~1 MB — 600px is ample for a thumbnail beside a title, and a
   * camera original would blow that ceiling.
   */
  const [cover, setCover] = useState<{ dataUri: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void load(); }, [profileId]);

  async function load() {
    try {
      const [l, p] = await Promise.all([
        api.get(`/sant/${profileId}/links`),
        api.get(`/sant/${profileId}/publications`),
      ]);
      setLinks((l as any) ?? []);
      setPubs((p as any) ?? []);
    } catch {
      // A profile with nothing published is the normal case, not an error.
    }
  }

  async function addLink() {
    if (!newLink.url.trim()) { setError('A link needs a URL'); return; }
    setBusy(true); setError('');
    try {
      await api.post(`/sant/${profileId}/links`, {
        kind: newLink.kind,
        label: newLink.label.trim() || undefined,
        url: newLink.url.trim(),
      });
      setNewLink({ kind: 'website', label: '', url: '' });
      await load();
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  }

  async function removeLink(id: string) {
    try { await api.delete(`/sant/${profileId}/links/${id}`); await load(); }
    catch (e) { setError(apiError(e)); }
  }

  async function pickCover(file: File) {
    setError('');
    try {
      const dataUri = await compressImage(file, { maxDim: 600, maxBytes: 250_000 });
      setCover({ dataUri, name: file.name });
    } catch {
      setError('Could not read that image. Try a JPEG or PNG.');
    }
  }

  async function addPub() {
    if (!newPub.title.trim()) { setError('A publication needs a title'); return; }
    setBusy(true); setError('');
    try {
      await api.post(`/sant/${profileId}/publications`, {
        title: newPub.title.trim(),
        kind: newPub.kind,
        language: newPub.language.trim() || undefined,
        year: newPub.year === '' ? undefined : Number(newPub.year),
        publisher: newPub.publisher.trim() || undefined,
        description: newPub.description.trim() || undefined,
        url: newPub.url.trim() || undefined,
        cover_base64: cover?.dataUri,
        cover_mime: cover ? cover.dataUri.slice(5, cover.dataUri.indexOf(';')) : undefined,
      });
      setNewPub({ title: '', kind: 'book', language: '', year: '', publisher: '', description: '', url: '' });
      setCover(null);
      await load();
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  }

  async function removePub(id: string) {
    try { await api.delete(`/sant/${profileId}/publications/${id}`); await load(); }
    catch (e) { setError(apiError(e)); }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* ── links ──────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Link2 size={16} /> Links
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          One account per platform — adding a second replaces the first.
        </p>

        <div className="mt-3 space-y-2">
          {links.map(l => (
            <div key={l.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <span className="w-24 shrink-0 text-xs font-medium capitalize text-slate-500">{l.kind}</span>
              <a href={l.url} target="_blank" rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-amber-700 hover:underline">
                {l.label || l.url}
              </a>
              <button onClick={() => removeLink(l.id)} aria-label="Remove link"
                className="p-1 text-slate-400 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {links.length === 0 && <p className="text-sm text-slate-400">No links yet.</p>}
        </div>

        <div className="mt-3 grid grid-cols-12 gap-2">
          <select className="col-span-3 rounded-lg border border-slate-200 px-2 py-2 text-sm"
            value={newLink.kind} onChange={e => setNewLink(l => ({ ...l, kind: e.target.value }))}>
            {LINK_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <input className="col-span-3 rounded-lg border border-slate-200 px-2 py-2 text-sm"
            placeholder="Label (optional)" value={newLink.label}
            onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} />
          <input className="col-span-4 rounded-lg border border-slate-200 px-2 py-2 text-sm"
            placeholder="youtube.com/@channel" value={newLink.url}
            onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addLink()} />
          <button onClick={addLink} disabled={busy}
            className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50">
            <Plus size={15} /> Add
          </button>
        </div>
      </section>

      {/* ── publications ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BookOpen size={16} /> Published works
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Books, commentaries, translations and pravachan series.
        </p>

        <div className="mt-3 space-y-2">
          {pubs.map(p => (
            <div key={p.id} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{p.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[p.kind, p.language, p.year, p.publisher].filter(Boolean).join(' · ')}
                </p>
                {p.description && <p className="mt-1 text-xs text-slate-500">{p.description}</p>}
              </div>
              <button onClick={() => removePub(p.id)} aria-label="Remove publication"
                className="p-1 text-slate-400 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {pubs.length === 0 && <p className="text-sm text-slate-400">Nothing published yet.</p>}
        </div>

        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-12 gap-2">
            <input className="col-span-6 rounded-lg border border-slate-200 px-2 py-2 text-sm"
              placeholder="Title *" value={newPub.title}
              onChange={e => setNewPub(p => ({ ...p, title: e.target.value }))} />
            <select className="col-span-3 rounded-lg border border-slate-200 px-2 py-2 text-sm"
              value={newPub.kind} onChange={e => setNewPub(p => ({ ...p, kind: e.target.value }))}>
              {PUB_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <input className="col-span-3 rounded-lg border border-slate-200 px-2 py-2 text-sm"
              type="number" placeholder="Year" value={newPub.year}
              onChange={e => setNewPub(p => ({ ...p, year: e.target.value }))} />
          </div>
          <div className="grid grid-cols-12 gap-2">
            <input className="col-span-3 rounded-lg border border-slate-200 px-2 py-2 text-sm"
              placeholder="Language" value={newPub.language}
              onChange={e => setNewPub(p => ({ ...p, language: e.target.value }))} />
            <input className="col-span-4 rounded-lg border border-slate-200 px-2 py-2 text-sm"
              placeholder="Publisher" value={newPub.publisher}
              onChange={e => setNewPub(p => ({ ...p, publisher: e.target.value }))} />
            <input className="col-span-5 rounded-lg border border-slate-200 px-2 py-2 text-sm"
              placeholder="Link (optional)" value={newPub.url}
              onChange={e => setNewPub(p => ({ ...p, url: e.target.value }))} />
          </div>
          <textarea className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" rows={2}
            placeholder="Short description" value={newPub.description}
            onChange={e => setNewPub(p => ({ ...p, description: e.target.value }))} />

          <div className="flex items-center gap-3">
            {cover ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <img src={cover.dataUri} alt="" className="h-10 w-8 rounded object-cover" />
                <span className="max-w-[12rem] truncate text-xs text-slate-600">{cover.name}</span>
                <button onClick={() => setCover(null)} aria-label="Remove cover"
                  className="p-0.5 text-slate-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <ImagePlus size={15} /> Cover image
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) void pickCover(f); e.target.value = ''; }} />
              </label>
            )}
            <button onClick={addPub} disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50">
              <Plus size={15} /> Add publication
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
