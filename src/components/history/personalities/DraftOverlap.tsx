import { RecordEvidence, RecordEvidenceLayout } from '../RecordEvidence';
import type { SeasonRecord } from '../../../league-summary';
import { draftOverlap } from '../../../history/personalities/draft-overlap';
export function DraftOverlap({ records, open }: { records: SeasonRecord[]; open?: boolean }) {
  const result = draftOverlap(records);
  return (
    <RecordEvidenceLayout
      evidence={
        <RecordEvidence
          records={records}
          scope="draft-overlap"
          entries={result.rows.map((row) => ({
            id: `${row.a}:${row.b}:${row.format}`,
            title: `${row.a} + ${row.b}`,
            detail: (
              <>
                <p>
                  {row.overlap} shared targets / {row.union} combined unique players in {row.format}{' '}
                  drafts.
                </p>
                <ul>
                  {row.players.map((player) => (
                    <li key={player.id}>
                      {player.name}: {player.aYears.join(', ')} / {player.bYears.join(', ')}
                    </li>
                  ))}
                </ul>
                <p>Queue evidence is unsupported; overlap does not prove draft steals.</p>
              </>
            ),
          }))}
          empty="No comparable draft pairs. Missing or different draft formats remain unsupported."
        />
      }
    >
      <details open={open}>
        <summary>Fantasy soulmate draft overlap</summary>
        <p>
          Overlap compares unique provider player IDs drafted across selected seasons within the
          same known format. Shared targets describe actual selections, without inferring queue
          intent. Draft steals: unsupported — providers supply no explicit queue evidence. Different
          or unknown formats are not compared.
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
    </RecordEvidenceLayout>
  );
}
