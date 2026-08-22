import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'
import api, { apiError } from '../lib/api';
import { useToast } from './kit';
import { isValidPhone, PhoneInput } from './PhoneInput';

export interface Rep {
  id: string;
  mobile: string;
  name?: string | null;
  linked: boolean;
  /** admin = the Sanghpati admin, who manages this list. rep = everyone else. */
  role: 'admin' | 'rep';
  is_primary: boolean;
  /** True for the signed-in user's own row, so they are never offered "remove me". */
  is_me: boolean;
  /** Null until an invite message actually went out — see migration 043. */
  invite_sent_at?: string | null;
  invite_channel?: string | null;
  invite_error?: string | null;
}

interface RepsData {
  primary: Rep | null;
  co_reps: Rep[];
  all: Rep[];
  /** What the signed-in sangh representative may do — resolved by the API, not guessed here. */
  viewer: {
    role: 'admin' | 'rep' | null;
    rep_id: string | null;
    can_manage_reps: boolean;
    can_request_rep: boolean;
  };
}

interface RepRequest {
  id: string;
  mobile: string;
  name?: string | null;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  requested_by_name?: string | null;
  requested_at: string;
  review_note?: string | null;
}

interface InviteResult {
  invite_sent?: boolean;
  invite_channel?: string | null;
  invite_error?: string | null;
}

function shortDate(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Everyone who can log in and manage this profile, and — since migration 044 —
 * what each of them is allowed to do.
 *
 * THE MODEL. One sangh representative is the **Sanghpati admin**: they add people, remove
 * them, and can hand the role on. Everybody else maintains the profile but
 * cannot hand out access. Before 044 there were no roles and any co-rep could
 * remove any other, including the person who had invited them.
 *
 * A plain sangh representative is NOT shown a disabled button. They get the request
 * form, because the honest answer to "can I add someone?" is "ask the sant
 * admin" and the app should carry that request rather than leaving them to
 * find the admin's phone number. The alternative in practice is people sharing
 * one login, which is what roles exist to prevent.
 *
 * Every row also says whether an invite actually reached that number. It used
 * to say "invited (not logged in yet)" for anyone who had not signed in, which
 * was not true: nothing was ever sent.
 */
export function RepsManager({ maharajId, readOnly }: { maharajId: string; readOnly?: boolean }) {
  const { t } = useTranslation()
  const [data, setData] = useState<RepsData | null>(null);
  const [requests, setRequests] = useState<RepRequest[]>([]);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const toast = useToast();

  const load = useCallback(() => {
    api.get(`/sant/${maharajId}/reps`)
      .then((d: any) => setData(d))
      .catch((e) => setError(apiError(e)));
    // Both roles read this: an admin sees every request to decide, a plain rep
    // sees their own so a submitted request does not vanish from the screen.
    api.get(`/sant/${maharajId}/rep-requests`)
      .then((d: any) => setRequests(Array.isArray(d) ? d : []))
      .catch(() => { /* the list above is the important one; a failure here is not worth an error panel */ });
  }, [maharajId]);
  useEffect(load, [load]);

  const isAdmin = !!data?.viewer.can_manage_reps;
  const canRequest = !!data?.viewer.can_request_rep;
  const pending = requests.filter((r) => r.status === 'pending');

  /** One place deciding how an invite outcome is announced, add or resend. */
  function announce(res: InviteResult | undefined, prefix: string) {
    if (res?.invite_sent) {
      toast.show(t('reps.inviteSent', { prefix, channel: res.invite_channel ?? t('reps.message') }));
    } else {
      toast.show(
        t('reps.inviteFailed', { prefix, reason: res?.invite_error ?? t('reps.unknownReason') }),
        'bad',
      );
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(mobile)) { setError(t('reps.invalidMobile')); return; }
    setBusy(true); setError('');
    try {
      if (isAdmin) {
        const res = await api.post(`/sant/${maharajId}/reps`, { mobile, name: name || undefined }) as InviteResult;
        announce(res, t('reps.added'));
      } else {
        await api.post(`/sant/${maharajId}/rep-requests`, {
          mobile, name: name || undefined, reason: reason || undefined,
        });
        toast.show(t('reps.requestSent'));
      }
      setMobile(''); setName(''); setReason('');
      load();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function resend(rep: Rep) {
    setResending(rep.id);
    try {
      const res = await api.post(`/sant/${maharajId}/reps/${rep.id}/resend-invite`, {}) as InviteResult;
      load();
      announce(res, t('reps.inviteTo', { mobile: rep.mobile }));
    } catch (e) {
      toast.show(apiError(e), 'bad');
    } finally {
      setResending(null);
    }
  }

  async function remove(rep: Rep) {
    // A confirm dialog because it is not undoable from here: re-adding sends a
    // fresh invite and the person has to act on it again.
    if (!confirm(t('reps.confirmRemove', { who: rep.name || rep.mobile }))) return;
    try {
      await api.delete(`/sant/${maharajId}/reps/${rep.id}`);
      load();
      toast.show(t('reps.removed'));
    } catch (e) {
      toast.show(apiError(e), 'bad');
    }
  }

  async function makeAdmin(rep: Rep) {
    // The strongest warning on this screen, because it is the one action that
    // takes something away from the person doing it: after this they can no
    // longer add or remove anybody, and only the new admin can hand it back.
    if (!confirm(t('reps.confirmMakeAdmin', { who: rep.name || rep.mobile }))) return;
    setActing(rep.id);
    try {
      await api.post(`/sant/${maharajId}/reps/${rep.id}/make-admin`, {});
      load();
      toast.show(t('reps.adminTransferred', { who: rep.name || rep.mobile }));
    } catch (e) {
      toast.show(apiError(e), 'bad');
    } finally {
      setActing(null);
    }
  }

  async function decide(req: RepRequest, action: 'approve' | 'reject') {
    setActing(req.id);
    try {
      await api.post(`/sant/${maharajId}/rep-requests/${req.id}/${action}`, {});
      load();
      toast.show(action === 'approve' ? t('reps.requestApproved') : t('reps.requestRejected'));
    } catch (e) {
      toast.show(apiError(e), 'bad');
    } finally {
      setActing(null);
    }
  }

  async function withdraw(req: RepRequest) {
    setActing(req.id);
    try {
      await api.delete(`/sant/${maharajId}/rep-requests/${req.id}`);
      load();
      toast.show(t('reps.requestWithdrawn'));
    } catch (e) {
      toast.show(apiError(e), 'bad');
    } finally {
      setActing(null);
    }
  }

  function statusLine(r: Rep) {
    if (r.linked) return r.mobile;
    if (r.invite_sent_at) {
      return `${r.mobile} · ${t('reps.invitedOn', {
        date: shortDate(r.invite_sent_at),
        channel: r.invite_channel ?? '',
      })}`;
    }
    return r.mobile;
  }

  const rows = data?.all ?? [];

  return (
    <div className="card mb-6">
      {toast.node}
      <h3 className="font-semibold text-navy-800 mb-1">{t('ui.representatives')}</h3>
      <p className="text-xs text-gray-500 mb-4">
        {isAdmin ? t('reps.introAdmin') : t('reps.introRep')}
      </p>

      <div className="space-y-2 mb-4">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              r.role === 'admin' ? 'bg-navy-50 border-navy-100' : 'bg-gray-50 border-gray-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
              r.role === 'admin' ? 'bg-navy-900 text-white' : 'bg-gray-300 text-gray-700'
            }`}>
              {(r.name || r.mobile.replace('+', ''))[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {r.name || (r.role === 'admin' ? t('reps.santAdmin') : t('reps.representative'))}
                {r.is_me && <span className="text-xs text-slate-400 font-normal"> · {t('reps.you')}</span>}
              </p>
              <p className="text-xs text-gray-500">{statusLine(r)}</p>
              {!r.linked && !r.invite_sent_at && (
                <p className="text-xs text-cta mt-0.5">
                  {t('reps.noInviteYet')}
                  {r.invite_error ? ` — ${t('reps.lastAttemptFailed')}` : ''}
                </p>
              )}
            </div>

            <span className={`text-[10px] ${r.role === 'admin' ? 'badge-navy' : 'badge-gray'}`}>
              {r.role === 'admin' ? t('reps.santAdmin') : t('reps.representative')}
            </span>

            {isAdmin && !readOnly && !r.linked && (
              <button
                onClick={() => resend(r)}
                disabled={resending === r.id}
                className="text-xs text-navy-700 hover:text-navy-900 disabled:opacity-50 whitespace-nowrap"
              >
                {resending === r.id ? t('reps.sending') : r.invite_sent_at ? t('reps.resend') : t('reps.sendInvite')}
              </button>
            )}

            {/* Handing over is offered only for OTHER people, and only to the
                admin. Offering it on your own row would read as "promote
                myself", which is not a thing. */}
            {isAdmin && !readOnly && r.role !== 'admin' && (
              <button
                onClick={() => makeAdmin(r)}
                disabled={acting === r.id}
                className="text-xs text-navy-700 hover:text-navy-900 disabled:opacity-50 whitespace-nowrap"
              >
                {acting === r.id ? '…' : t('reps.makeAdmin')}
              </button>
            )}

            {/* The admin's own row has no Remove: the API refuses it
                (409 LAST_ADMIN) and a button that always fails is worse than
                no button. Hand the role over first. */}
            {isAdmin && !readOnly && r.role !== 'admin' && (
              <button onClick={() => remove(r)} className="text-xs text-red-500 hover:text-red-700">
                {t('ui.remove')}
              </button>
            )}
          </div>
        ))}
        {data && rows.length === 0 && (
          <p className="text-xs text-gray-400 px-1">{t('ui.noCoReps')}</p>
        )}
      </div>

      {/* ── requests ──────────────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-900 mb-2">
            {isAdmin ? t('reps.pendingForYou', { count: pending.length }) : t('reps.pendingYours')}
          </p>
          <div className="space-y-2">
            {pending.map((req) => (
              <div key={req.id} className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{req.name || req.mobile}</p>
                  <p className="text-xs text-gray-600">
                    {req.mobile}
                    {req.requested_by_name ? ` · ${t('reps.askedBy', { who: req.requested_by_name })}` : ''}
                    {req.reason ? ` · ${req.reason}` : ''}
                  </p>
                </div>
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => decide(req, 'approve')}
                      disabled={acting === req.id}
                      className="text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-50"
                    >
                      {t('reps.approve')}
                    </button>
                    <button
                      onClick={() => decide(req, 'reject')}
                      disabled={acting === req.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {t('reps.reject')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => withdraw(req)}
                    disabled={acting === req.id}
                    className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
                  >
                    {t('reps.withdraw')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── add / request ─────────────────────────────────────────────────── */}
      {!readOnly && (isAdmin || canRequest) && (
        <form onSubmit={submit} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="label">{t('ui.nameOpt')}</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t('reps.namePh')} />
            </div>
            <div className="flex-1">
              <label className="label">{t('ui.mobileNumber')}</label>
              <PhoneInput value={mobile} onChange={setMobile} />
            </div>
            <button type="submit" disabled={busy} className="btn-primary whitespace-nowrap">
              {busy ? t('reps.working') : isAdmin ? t('reps.addRep') : t('reps.requestAdd')}
            </button>
          </div>
          {/* Only on the request path: the admin is about to read this, so a
              line of context is the difference between an approval and a
              phone call. An admin adding somebody directly needs no reason. */}
          {!isAdmin && (
            <div>
              <label className="label">{t('reps.reasonLabel')}</label>
              <input className="input" value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder={t('reps.reasonPh')} />
            </div>
          )}
        </form>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
