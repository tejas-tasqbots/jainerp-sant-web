import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Small shared building blocks for the Sadhu-Sadhvi portal, so pages stop
 * hand-rolling their own spinners, empty states and stat boxes.
 */

export { PageHeader } from './PageHeader'

/** Centered loading state. Pages used to inline a bare spinner div. */
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" role="status" aria-live="polite">
      <div className="w-8 h-8 border-2 border-navy-200 border-t-navy-700 rounded-full animate-spin" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  )
}

/**
 * Skeleton rows. Preferred over a spinner for lists: the page doesn't jump
 * when the data lands.
 */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** "Nothing here yet" with an optional call to action. */
export function EmptyState({
  icon: Icon, title, hint, action,
}: {
  icon?: LucideIcon
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="card py-14 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Icon size={22} />
        </div>
      )}
      <p className="text-navy-900 font-semibold">{title}</p>
      {hint && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** One number with a label — used in a responsive grid at the top of a page. */
export function StatTile({
  label, value, hint, icon: Icon, tone = 'default',
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: 'default' | 'good' | 'warn'
}) {
  const valueTone =
    tone === 'good' ? 'text-brand-green' : tone === 'warn' ? 'text-cta' : 'text-navy-900'
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`text-xl font-bold mt-1 ${valueTone}`}>{value}</p>
          {hint && <p className="text-xs text-slate-400 mt-0.5 truncate">{hint}</p>}
        </div>
        {Icon && <Icon size={18} className="text-slate-300 flex-shrink-0 mt-0.5" />}
      </div>
    </div>
  )
}

/** Inline error panel with a consistent look. */
export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="card border-danger-bg bg-danger-bg text-sm text-danger px-4 py-3" role="alert">
      {message}
    </div>
  )
}

/** Status pill. */
export function Pill({
  children, tone = 'slate',
}: { children: React.ReactNode; tone?: 'slate' | 'green' | 'red' | 'gold' | 'navy' }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-brand-green-light text-brand-green-dark',
    red: 'bg-brand-red-light text-brand-red-dark',
    gold: 'bg-brand-gold-light text-brand-gold-dark',
    navy: 'bg-navy-100 text-navy-800',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

/**
 * A short confirmation that an action worked.
 *
 * Every form in this portal reported failures (a red panel, an alert) and said
 * nothing whatsoever on success — a rep who edited their profile or added an
 * event was left to guess whether it had saved. Errors were loud, success was
 * silent, so the portal felt broken even when it wasn't.
 *
 * Fixed to the viewport rather than inline: several of these forms are long
 * enough that a banner at the top would appear off-screen, which is the same
 * as not showing it at all.
 */
export function useToast() {
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  function show(text: string, tone: 'ok' | 'bad' = 'ok') {
    setToast({ text, tone })
    if (timer.current) clearTimeout(timer.current)
    // A failure gets longer on screen because it usually names a reason the
    // reader has to act on.
    timer.current = setTimeout(() => setToast(null), tone === 'bad' ? 7000 : 4000)
  }

  const node = toast ? (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 max-w-sm flex items-start gap-2 rounded-xl px-4 py-3 text-sm shadow-lg border ${
        toast.tone === 'ok'
          ? 'bg-brand-green-light border-brand-green text-brand-green-dark'
          : 'bg-danger-bg border-danger text-danger'
      }`}
    >
      {toast.tone === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
      <span>{toast.text}</span>
    </div>
  ) : null

  return { show, node }
}
