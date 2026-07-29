import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Standard page heading for the Sadhu-Sadhvi portal.
 *
 * Every page previously hand-rolled a `← Back` text link plus an <h1>/<p>
 * pair, which drifted (some pages had no way back at all) and gave the user a
 * 6px-tall text target on a phone. This gives one real button, one title
 * scale, and a slot for the page's primary action.
 */
export function PageHeader({
  title, subtitle, back = true, onBack, actions, meta,
}: {
  title: string
  subtitle?: string
  /** Show the back control. */
  back?: boolean
  /** Defaults to history.back(). */
  onBack?: () => void
  /** Primary action(s), right-aligned on desktop, wrapped below on mobile. */
  actions?: React.ReactNode
  /** Small chips under the title (counts, status). */
  meta?: React.ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="mb-6">
      {back && (
        <button
          type="button"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 mb-3 -ml-1 px-1 py-1 rounded hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          {meta && <div className="flex flex-wrap items-center gap-2 mt-2">{meta}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
