import { it, expect } from 'vitest';
import { season } from './fixtures.test-support';
import { historicalHonors } from './honors';
it('excludes unknown results from weighted metrics and exposes known title/finish', () => {
  const r = season();
  r.data.results = [
    { teamId: 'a', champion: true, playoff: true, finish: 1, lastPlace: false },
    { teamId: 'b', champion: null, playoff: null, finish: null, lastPlace: null },
  ];
  const x = historicalHonors([r]);
  expect(x.rankings.find((r) => r.key === 'a')).toMatchObject({
    titleKnown: 1,
    titles: 1,
    playoffKnown: 1,
  });
  expect(x.rankings.find((r) => r.key === 'b')?.metrics.titles).toBeNull();
});
it('backs streak, low score, collapse and full-season worst records with evidence', () => {
  const r = season(2024, [
    [100, 90, 80, 70],
    [100, 90, 80, 70],
    [50, 90, 80, 70],
    [50, 90, 80, 70],
  ]);
  const x = historicalHonors([r]);
  expect(x.shame.find((s) => s.kind === 'Biggest collapse' && s.key === 'a')).toMatchObject({
    value: 1,
    sample: 4,
  });
  expect(x.shame.find((s) => s.kind === 'Losing streak' && s.key === 'a')).toMatchObject({
    value: 2,
  });
  expect(x.shame.find((s) => s.kind === 'Lowest score' && s.key === 'a')?.evidence).toContain(
    'week 3',
  );
  r.data.scores = r.data.scores.filter((s) => s.week !== 2);
  expect(historicalHonors([r]).shame.some((s) => s.kind === 'Biggest collapse')).toBe(false);
});
