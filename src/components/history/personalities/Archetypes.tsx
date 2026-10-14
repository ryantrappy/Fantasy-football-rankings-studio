import type { SeasonRecord } from '../../../league-summary';
import { managerArchetypes } from '../../../history/personalities/archetypes';
export function Archetypes({
  records,
  managerKey,
  open,
}: {
  records: SeasonRecord[];
  managerKey?: string;
  open?: boolean;
}) {
  const rows = managerArchetypes(records).filter((row) => !managerKey || row.key === managerKey);
  return (
    <details open={open}>
      <summary>Evidence-based manager archetypes</summary>
      <p>
        Playful profiles can overlap. No label is assigned when minimum samples or thresholds are
        unmet. These describe observed league history, not personality.
      </p>
      {rows.map((row) => (
        <article key={row.key}>
          <h3>{row.manager}</h3>
          <p>Observed seasons: {row.seasons.join(', ')}</p>
          {row.profiles.length ? (
            <ul>
              {row.profiles.map((p) => (
                <li key={p.label}>
                  <strong>{p.label}</strong>: {p.evidence}
                </li>
              ))}
            </ul>
          ) : (
            <p>No supported profile: insufficient samples or thresholds not met.</p>
          )}
        </article>
      ))}
      {!rows.length && <p>No manager profiles available for the selected seasons.</p>}
    </details>
  );
}
