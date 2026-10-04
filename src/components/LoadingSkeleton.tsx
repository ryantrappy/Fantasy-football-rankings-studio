export function LoadingSkeleton({ label, description }: { label: string; description?: string }) {
  return (
    <output className="studio-card studio-loading" aria-live="polite">
      <span className="studio-loading-label">{label}</span>
      {description && <span className="studio-loading-description">{description}</span>}
      <div className="studio-skeleton-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </output>
  );
}
