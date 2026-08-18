import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { CalendarDays, Trash2, XCircle } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { EmptyState, ErrorPanel, PageHeader, SkeletonList, useToast } from '../../components/kit';
import type { SantEvent } from '../../types';

/**
 * Events a Sadhu-Sadhvi is holding — pravachan series, panchkalyanak,
 * pratishtha, shibir.
 *
 * Not anniversaries: diksha jayanti and punya tithi are derived from the
 * profile's own dates on the devotee side, so recording them here would create
 * a second copy that goes stale the moment a date is corrected.
 */

const EVENT_TYPES = [
  'pravachan', 'panchkalyanak', 'pratishtha', 'diksha',
  'vidhan', 'shibir', 'chaturmas_sthapana', 'other',
] as const;

const EMPTY = {
  title: '', type: 'pravachan', description: '', place: '', city: '', state: '',
  starts_on: '', ends_on: '', starts_at_time: '', tithi_note: '',
};

/** Formats a Postgres YYYY-MM-DD without a timezone round-trip (see below). */
function formatDate(d?: string | null) {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  if (!y || !m || !day) return d;
  // `new Date('2026-09-14')` parses as UTC midnight and renders in local time,
  // which prints the previous day west of Greenwich. Build from local parts.
  return new Date(y, m - 1, day).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function EventsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<SantEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...EMPTY });
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    api.get(`/sant/${id}/events`)
      .then((data: any) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Optional fields are omitted rather than sent as '': the DTO validates
      // dates and enums, and an empty string reaches the validator as a value.
      const created = await api.post(`/sant/${id}/events`, {
        title: form.title,
        type: form.type,
        starts_on: form.starts_on,
        description: form.description || undefined,
        place: form.place || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        ends_on: form.ends_on || undefined,
        starts_at_time: form.starts_at_time || undefined,
        tithi_note: form.tithi_note || undefined,
      }) as SantEvent;
      setEvents((prev) => [...prev, created].sort((a, b) => a.starts_on.localeCompare(b.starts_on)));
      setForm({ ...EMPTY });
      toast.show('Event added — followers have been notified.');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  /**
   * Cancelling keeps the event visible with a cancelled marker. Devotees may
   * already have travelled for it, so silently removing it from their calendar
   * is worse than showing that it is off.
   */
  async function cancelEvent(eventId: string) {
    try {
      const updated = await api.patch(`/sant/${id}/events/${eventId}`, { status: 'cancelled' }) as SantEvent;
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
      toast.show('Event marked as cancelled.');
    } catch (err) {
      toast.show(apiError(err), 'bad');
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm(t('ui.deleteEventConfirm'))) return;
    try {
      await api.delete(`/sant/${id}/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.show('Event deleted.');
    } catch (err) {
      toast.show(apiError(err), 'bad');
    }
  }

  return (
    <div>
      {toast.node}
      <PageHeader title={t('ui.eventsTitle')} subtitle={t('ui.eventsHelp')} />

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-800 mb-4">{t('ui.addEvent')}</h2>
        <form onSubmit={addEvent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-title" className="label">{t('ui.titleReq')}</label>
              <input id="ev-title" className="input" required value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ev-type" className="label">{t('ui.eventType')}</label>
              <select id="ev-type" className="input" value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {EVENT_TYPES.map((v) => (
                  <option key={v} value={v}>{t(`eventType.${v}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="ev-from" className="label">{t('ui.startsOn')}</label>
              <input id="ev-from" className="input" type="date" required value={form.starts_on}
                onChange={(e) => setForm((f) => ({ ...f, starts_on: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ev-to" className="label">{t('ui.endsOn')}</label>
              <input id="ev-to" className="input" type="date" value={form.ends_on}
                min={form.starts_on || undefined}
                onChange={(e) => setForm((f) => ({ ...f, ends_on: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ev-time" className="label">{t('ui.startTime')}</label>
              <input id="ev-time" className="input" value={form.starts_at_time}
                placeholder={t('ui.startTimePh')}
                onChange={(e) => setForm((f) => ({ ...f, starts_at_time: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="ev-place" className="label">{t('ui.place')}</label>
              <input id="ev-place" className="input" value={form.place}
                onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ev-city" className="label">{t('ui.city')}</label>
              <input id="ev-city" className="input" value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ev-state" className="label">{t('ui.state')}</label>
              <input id="ev-state" className="input" value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
            </div>
          </div>

          <div>
            <label htmlFor="ev-tithi" className="label">{t('ui.tithiNote')}</label>
            <input id="ev-tithi" className="input" value={form.tithi_note}
              placeholder={t('ui.tithiNotePh')}
              onChange={(e) => setForm((f) => ({ ...f, tithi_note: e.target.value }))} />
          </div>

          <div>
            <label htmlFor="ev-desc" className="label">{t('ui.description')}</label>
            <textarea id="ev-desc" className="input" rows={3} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          {error && <ErrorPanel message={error} />}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('ui.saving') : t('ui.addEvent')}
          </button>
          <p className="text-xs text-slate-400">{t('ui.eventNotifyNote')}</p>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy-800 mb-4">{t('ui.allEvents')}</h2>
        {loading ? (
          <SkeletonList rows={3} />
        ) : events.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t('ui.noEvents')} hint={t('ui.noEventsHint')} />
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-medium ${e.status === 'cancelled'
                      ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {e.title}
                    </p>
                    <span className="badge">{e.type_display ?? t(`eventType.${e.type}`)}</span>
                    {e.status === 'cancelled' && (
                      <span className="badge badge-red">{t('ui.cancelled')}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(e.starts_on)}
                    {e.ends_on ? ` – ${formatDate(e.ends_on)}` : ''}
                    {e.starts_at_time ? ` · ${e.starts_at_time}` : ''}
                  </p>
                  {(e.place || e.city) && (
                    <p className="text-xs text-slate-400">
                      {[e.place, e.city, e.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {e.tithi_note && <p className="text-xs text-slate-400">{e.tithi_note}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {e.status !== 'cancelled' && (
                    <button onClick={() => cancelEvent(e.id)} title={t('ui.cancelEvent')}
                      aria-label={t('ui.cancelEvent')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded">
                      <XCircle size={16} />
                    </button>
                  )}
                  <button onClick={() => deleteEvent(e.id)} title={t('ui.delete')}
                    aria-label={t('ui.delete')} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
