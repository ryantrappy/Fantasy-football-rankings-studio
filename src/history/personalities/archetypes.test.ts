import { fixture } from './activity.test';
import { managerArchetypes } from './archetypes';
it('assigns multiple measured profiles and none for small samples', () => {
  const records = [2023, 2024, 2025].map((year) => {
    const record = fixture({
      results: [{ teamId: '1', finish: 2, champion: false }],
      pickups: Array.from({ length: 4 }, (_, id) => ({
        teamId: '1',
        id: String(id),
        lift: 1,
        comparisonWeeks: [1],
      })),
    });
    record.year = year;
    return record;
  });
  expect(
    managerArchetypes(records)
      .find((r) => r.key === 'a')
      ?.profiles.map((p) => p.label),
  ).toEqual(['Waiver Hawk', 'Eternal Runner-Up']);
  expect(managerArchetypes(records.slice(0, 1)).find((r) => r.key === 'a')?.profiles).toEqual([]);
});
