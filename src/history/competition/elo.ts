import type { SeasonRecord } from '../../league-summary';
import { competitionGames, result } from './games';
export function historicalElo(records: SeasonRecord[]) {
  const { games, managers } = competitionGames(records);
  const ratings = new Map([...managers.keys()].map((k) => [k, 1500]));
  const movements: {
    id: string;
    key: string;
    year: number;
    week: number;
    opponent: string;
    before: number;
    after: number;
    delta: number;
    expected: number;
    actual: number;
  }[] = [];
  for (const g of games) {
    const ra = ratings.get(g.a.key)!,
      rb = ratings.get(g.b.key)!;
    const expected = 1 / (1 + 10 ** ((rb - ra) / 400));
    const actual = result(g.a.points, g.b.points);
    const delta = 32 * (actual - expected);
    ratings.set(g.a.key, ra + delta);
    ratings.set(g.b.key, rb - delta);
    for (const [a, b, before, change, p, score] of [
      [g.a, g.b, ra, delta, expected, actual],
      [g.b, g.a, rb, -delta, 1 - expected, 1 - actual],
    ] as const) {
      movements.push({
        id: g.id,
        key: a.key,
        opponent: b.name,
        year: g.year,
        week: g.week,
        before,
        after: before + change,
        delta: change,
        expected: p,
        actual: score,
      });
    }
  }
  return {
    rankings: [...ratings]
      .map(([key, rating]) => ({
        key,
        name: managers.get(key)!,
        rating,
        games: movements.filter((m) => m.key === key).length,
        lastDelta: movements.filter((m) => m.key === key).at(-1)?.delta ?? null,
      }))
      .sort((a, b) => b.rating - a.rating || a.key.localeCompare(b.key)),
    movements,
  };
}
