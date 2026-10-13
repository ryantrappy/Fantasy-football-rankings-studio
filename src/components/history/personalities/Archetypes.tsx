import type { SeasonRecord } from '../../../league-summary';
import { managerArchetypes } from '../../../history/personalities/archetypes';
export function Archetypes({ records }: { records: SeasonRecord[] }) {
  return (
    <details>
      <summary>Evidence-based manager archetypes</summary>
      <p>
        Playful profiles can overlap. No label is assigned when minimum samples or thresholds are
        unmet. These describe observed league history, not personality.
      </p>
      {managerArchetypes(records).map((row) => (
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
    </details>
  );
}
