/**
 * Consistent page opening: teal eyebrow, a short rule, display title, lede.
 * Mirrors the Landing hero's vertical rhythm so moving from the hero into the
 * app feels continuous rather than like crossing into a different product.
 */
export default function PageHeader({ eyebrow, title, lede, actions }) {
  return (
    <header className="flex items-start justify-between gap-6 flex-wrap">
      <div className="min-w-0">
        {eyebrow && (
          <>
            <p className="eyebrow">{eyebrow}</p>
            <div className="rule-teal w-24 mt-2" />
          </>
        )}
        <h1 className="page-title mt-3">{title}</h1>
        {lede && <p className="mt-3 text-white/55 max-w-xl leading-relaxed">{lede}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  );
}
