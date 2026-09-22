import { cn } from "@/lib/utils";

/**
 * The chrome the dashboard's sheets share, inside a <Modal>: a header with an
 * optional mark, the title and a line under it, room for an action, and the
 * close button; then a body that scrolls on its own. The Modal decides where it
 * sits — up from the bottom on a phone, centred on a desktop.
 */
export function SheetFrame({
  titleId,
  title,
  subtitle,
  lead,
  action,
  tint,
  onClose,
  closeLabel = "Close",
  bodyClassName,
  children,
}: {
  titleId: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** A logo or headshot in front of the title. */
  lead?: React.ReactNode;
  /** A control between the title and the close button. */
  action?: React.ReactNode;
  /** A team colour to wash the header with. */
  tint?: string;
  onClose: () => void;
  closeLabel?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-xl border border-line/70 bg-surface shadow-2xl sm:rounded-xl">
      <div className="relative flex items-center gap-3 border-b border-line-soft/70 px-5 py-4">
        {tint && (
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background: `linear-gradient(105deg, color-mix(in oklab, ${tint} 22%, transparent), transparent 60%)`,
            }}
          />
        )}
        {lead && <div className="relative shrink-0">{lead}</div>}
        <div className="relative min-w-0 flex-1">
          <h2 id={titleId} className="truncate font-display text-[16px] font-extrabold text-ink">
            {title}
          </h2>
          {subtitle && <p className="truncate text-[12px] text-faint">{subtitle}</p>}
        </div>
        {action && <div className="relative shrink-0">{action}</div>}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-[transform,background-color,color] duration-150 hover:bg-surface-2 hover:text-ink active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>{children}</div>
    </div>
  );
}
