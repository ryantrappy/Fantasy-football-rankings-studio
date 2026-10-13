import type { SeasonRecord } from '../../../league-summary';
import { draftOverlap } from '../../../history/personalities/draft-overlap';
export function DraftOverlap({ records }: { records: SeasonRecord[] }) {
  const result = draftOverlap(records);
  return (
    <details>
      <summary>Fantasy soulmate draft overlap</summary>
      <p>
        Overlap compares unique provider player IDs drafted across selected seasons within the same
        known format. Shared targets describe actual selections, without inferring queue intent.
        Draft steals: unsupported — providers supply no explicit queue evidence. Different or
        unknown formats are not compared.
      </p>
      {result.unsupported.map((note) => (
        <p key={note}>{note}</p>
      ))}
      {result.rows.map((row) => (
        <article key={`${row.a}:${row.b}:${row.format}`}>
          <h3>
            {row.a} + {row.b}
          </h3>
          <p>
            {row.format}: {row.overlap} shared targets / {row.union} combined unique players
          </p>
          <ul>
            {row.players.map((player) => (
              <li key={player.id}>
                {player.name} ({player.id}) — first manager: {player.aYears.join(', ')}; second:{' '}
                {player.bYears.join(', ')}
              </li>
            ))}
          </ul>
        </article>
      ))}
      {!result.rows.length && <p>No comparable draft pairs available.</p>}
    </details>
  );
}
