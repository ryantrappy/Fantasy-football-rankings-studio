import { it, expect } from 'vitest';
import { season } from './fixtures.test-support';
import { historicalEras } from './eras';
export const titleSeason = (year: number, winner = 'a') => {
  const r = season(year, [[100, 90, 80, 70]]);
  r.data.results = r.data.teams.map((t) => ({
    teamId: t.teamId,
    champion: t.teamId === winner,
    playoff: null,
    finish: null,
    lastPlace: null,
  }));
  return r;
};
it('identifies calendar title windows and sustained regular success', () => {
  const x = historicalEras([titleSeason(2022), titleSeason(2023, 'b'), titleSeason(2024)]);
  expect(x.eras.find((e) => e.kind === 'Title dynasty')).toMatchObject({
    key: 'a',
    years: [2022, 2023, 2024],
  });
  expect(x.eras.some((e) => e.kind === 'Sustained regular success' && e.key === 'a')).toBe(true);
  expect(
    historicalEras([titleSeason(2022), titleSeason(2023, 'b'), titleSeason(2024)], {
      span: 3,
      titles: 3,
      winRate: 1,
    }).eras.some((e) => e.kind === 'Title dynasty'),
  ).toBe(false);
});
it('never bridges missing years or unknown champions', () => {
  expect(
    historicalEras([titleSeason(2022), titleSeason(2024), titleSeason(2025)]).eras,
  ).toHaveLength(0);
  const r = titleSeason(2023);
  r.data.results![1].champion = null;
  expect(
    historicalEras([titleSeason(2022), r, titleSeason(2024)]).eras.some(
      (e) => e.kind === 'Title dynasty',
    ),
  ).toBe(false);
});
