import { useState } from 'react';
import { historicalEras } from '../../../history/competition/eras';
import type { CompetitionProps } from './CompetitionHistory';
export function ErasHistory({ records }: CompetitionProps) {
  const [span, setSpan] = useState(3),
    [titles, setTitles] = useState(2),
    [rate, setRate] = useState(70);
  const { eras, excluded } = historicalEras(records, { span, titles, winRate: rate / 100 });
  return (
    <details>
      <summary>Dynasties and competitive eras</summary>
      <label>
        Era span (calendar seasons){' '}
        <input
          type="number"
          min={2}
          max={10}
          value={span}
          onChange={(e) =>
            setSpan(Math.max(2, Math.min(10, Math.floor(Number(e.target.value) || 3))))
          }
        />
      </label>
      <label>
        Titles required{' '}
        <input
          type="number"
          min={1}
          max={span}
          value={titles}
          onChange={(e) =>
            setTitles(Math.max(1, Math.min(span, Math.floor(Number(e.target.value) || 2))))
          }
        />
      </label>
      <label>
        Sustained win percentage{' '}
        <input
          type="number"
          min={0}
          max={100}
          value={rate}
          onChange={(e) => setRate(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
        />
      </label>
      <p>
        Title dynasty: at least {titles} titles in {span} consecutive calendar seasons with all
        league championship outcomes known and exactly one champion per season. Sustained success:
        at least {rate}% combined regular wins in the same span, with full league scoring and
        regular-game coverage for the manager in every season. Overlapping qualifying windows are
        shown separately. Unknown seasons cannot bridge a run.
      </p>
      <ul>
        {eras.map((e) => (
          <li key={e.id}>
            {e.name} — {e.kind}: {e.years.join(', ')}. {e.evidence}
          </li>
        ))}
      </ul>
      {!eras.length && <p>No qualifying eras with available evidence.</p>}
      <details>
        <summary>Era coverage exclusions ({excluded.length})</summary>
        <ul>
          {excluded.map((e) => (
            <li key={`${e.start}:${e.reason}`}>
              {e.start}: {e.reason}
            </li>
          ))}
        </ul>
      </details>
    </details>
  );
}
