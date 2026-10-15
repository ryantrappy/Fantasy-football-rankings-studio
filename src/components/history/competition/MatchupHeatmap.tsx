import { createContext, useContext, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { pairRecord, type Game } from '../../../history/competition/games';
import { DataTable, type DataColumn } from '../../DataTable';

type HeatmapRow = {
  key: string;
  name: string;
  cells: Map<string, ReturnType<typeof pairRecord>>;
};

const winRate = (rate: number) =>
  `${(rate * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
const pairId = (manager: string, opponent: string) => JSON.stringify([manager, opponent]);

const HeatmapInteraction = createContext<{
  selected: string;
  focus: string;
  minimum: number;
  setFocused: (pair: string) => void;
  onInspect: (manager: string, opponent: string) => void;
  move: (event: KeyboardEvent<HTMLButtonElement>) => void;
} | null>(null);

function HeatmapCell({ row, opponent }: { row: HeatmapRow; opponent: HeatmapRow }) {
  const { selected, focus, minimum, setFocused, onInspect, move } = useContext(HeatmapInteraction)!;

  if (row.key === opponent.key)
    return (
      <span className="history-heatmap-self">
        —<small>Same manager</small>
      </span>
    );
  const record = row.cells.get(opponent.key)!;
  const rate = record.rate;
  const color =
    rate === null ? 'unavailable' : rate > 0.5 ? 'win' : rate < 0.5 ? 'loss' : 'balanced';
  const identity = pairId(row.key, opponent.key);
  return (
    <button
      type="button"
      className={`history-heatmap-cell history-heatmap-${color}`}
      aria-label={`Inspect ${row.name} versus ${opponent.name}: ${record.games ? `${record.wins}-${record.losses}-${record.ties} ${record.games} games · ${winRate(rate!)}${record.games < minimum ? ' Low sample' : ''}; wins with ties counted half` : 'Unavailable 0 games; no verified games'}`}
      aria-pressed={identity === selected}
      tabIndex={identity === focus ? 0 : -1}
      onFocus={() => setFocused(identity)}
      onKeyDown={move}
      onClick={() => onInspect(row.key, opponent.key)}
    >
      <strong>
        {record.games ? `${record.wins}-${record.losses}-${record.ties}` : 'Unavailable'}
      </strong>{' '}
      <small>
        {record.games} games{rate === null ? '' : ` · ${winRate(rate)}`}
      </small>
      {record.games > 0 && record.games < minimum && (
        <>
          {' '}
          <small>Low sample</small>
        </>
      )}
    </button>
  );
}

export function MatchupHeatmap({
  games,
  managers,
  managerKey,
  opponentKey,
  minimum,
  onInspect,
}: {
  games: Game[];
  managers: Map<string, string>;
  managerKey: string;
  opponentKey?: string;
  minimum: number;
  onInspect: (manager: string, opponent: string) => void;
}) {
  const instructions = useId();
  const [focused, setFocused] = useState({ selection: '', pair: '' });
  const rows = useMemo(() => {
    // Bucket once: each verified game is visited twice, rather than scanned for every cell.
    const pairs = new Map<string, Map<string, Game[]>>();
    for (const game of games) {
      for (const [manager, opponent] of [
        [game.a.key, game.b.key],
        [game.b.key, game.a.key],
      ]) {
        if (manager === opponent) continue;
        if (!pairs.has(manager)) pairs.set(manager, new Map());
        const opponents = pairs.get(manager)!;
        if (!opponents.has(opponent)) opponents.set(opponent, []);
        opponents.get(opponent)!.push(game);
      }
    }
    const entries = [...managers].sort(
      (a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]),
    );
    const counts = new Map<string, number>();
    const seen = new Map<string, number>();
    for (const [, name] of entries) counts.set(name, (counts.get(name) ?? 0) + 1);
    return entries.map(([key, name]): HeatmapRow => {
      seen.set(name, (seen.get(name) ?? 0) + 1);
      return {
        key,
        name: counts.get(name)! > 1 ? `${name} (ownership group ${seen.get(name)})` : name,
        cells: new Map(
          entries
            .filter(([other]) => other !== key)
            .map(([other]) => [other, pairRecord(pairs.get(key)?.get(other) ?? [], key, other)]),
        ),
      };
    });
  }, [games, managers]);
  const selected = opponentKey ? pairId(managerKey, opponentKey) : '';
  const pairIds = useMemo(
    () =>
      new Set(rows.flatMap((row) => [...row.cells.keys()].map((other) => pairId(row.key, other)))),
    [rows],
  );
  const firstOpponent = rows[0]?.cells.keys().next().value;
  const focus =
    focused.selection === selected && pairIds.has(focused.pair)
      ? focused.pair
      : pairIds.has(selected)
        ? selected
        : firstOpponent
          ? pairId(rows[0].key, firstOpponent)
          : '';

  function move(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
      return;
    const cell = event.currentTarget.closest('td');
    const row = cell?.parentElement as HTMLTableRowElement | null;
    const body = row?.parentElement;
    if (!cell || !row || !body) return;
    const visibleRows = [...body.children] as HTMLTableRowElement[];
    let y = visibleRows.indexOf(row);
    let x = cell.cellIndex;
    const width = row.cells.length - 1;
    const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (event.key === 'Home') x = 0;
    if (event.key === 'End') x = width + 1;
    const step = event.key === 'Home' ? 1 : event.key === 'End' ? -1 : dx;
    event.preventDefault();
    for (let attempt = 0; attempt < Math.max(width, visibleRows.length); attempt++) {
      x = ((x - 1 + step + width) % width) + 1;
      y = (y + dy + visibleRows.length) % visibleRows.length;
      const button = visibleRows[y].cells[x]?.querySelector<HTMLButtonElement>('button');
      if (button) {
        button.focus();
        return;
      }
    }
  }

  const columns = useMemo<DataColumn<HeatmapRow>[]>(
    () => [
      {
        id: 'manager',
        header: 'Row manager / opponent',
        rowHeader: true,
        value: (row) => row.name,
        cell: (row) => row.name,
      },
      ...rows.map((opponent) => ({
        id: `opponent-${opponent.key}`,
        header: opponent.name,
        value: (row: HeatmapRow) => row.cells.get(opponent.key)?.rate,
        exportValue: (row: HeatmapRow) => {
          if (row.key === opponent.key) return 'Not applicable: same manager';
          const record = row.cells.get(opponent.key)!;
          return record.games
            ? `${record.wins}-${record.losses}-${record.ties}; ${record.games} games; ${winRate(record.rate!)}${record.games < minimum ? '; Low sample' : ''}`
            : 'Unavailable; 0 verified games';
        },
        cell: (row: HeatmapRow) => <HeatmapCell row={row} opponent={opponent} />,
      })),
    ],
    [rows, minimum],
  );
  return (
    <section className="history-matchup-heatmap-view" aria-label="Matchup heatmap overview">
      <p id={instructions}>
        Each row manager’s record against the column manager. Color uses (wins + half of ties) /
        games. All ownership groups are included, including former managers; matching names do not
        merge identities. Use arrow keys to move between matchups; Enter or Space opens the pair’s
        record evidence.
      </p>
      <ul className="history-heatmap-legend" aria-label="Matchup heatmap color legend">
        <li>
          <span className="history-heatmap-win" />
          More wins
        </li>
        <li>
          <span className="history-heatmap-balanced" />
          Balanced (50%)
        </li>
        <li>
          <span className="history-heatmap-loss" />
          More losses
        </li>
        <li>
          <span className="history-heatmap-unavailable" />
          No verified games
        </li>
      </ul>
      <section
        className="history-matchup-heatmap-scroll"
        aria-label="Scrollable matchup heatmap"
        aria-describedby={instructions}
        // This bounded scroll region must remain reachable by keyboard even without game cells.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <HeatmapInteraction.Provider
          value={{
            selected,
            focus,
            minimum,
            setFocused: (pair) => setFocused({ selection: selected, pair }),
            onInspect,
            move,
          }}
        >
          <DataTable<HeatmapRow>
            label="All-manager matchup heatmap"
            className="insight-table history-matchup-heatmap"
            data={rows}
            getRowId={(row) => row.key}
            initialSorting={[{ id: 'manager', desc: false }]}
            columns={columns}
          />
        </HeatmapInteraction.Provider>
      </section>
      {rows.length < 2 && <p>At least two manager identities are needed for a matchup overview.</p>}
    </section>
  );
}
