import { safeWeek, weekChoices } from './week-options';

it('merges supported weeks with historical saved editions', () => {
  expect(
    weekChoices(
      [2, 3, 4],
      [
        { year: 2025, week: 1 },
        { year: 2025, week: 3 },
        { year: 2024, week: 18 },
      ],
      2025,
    ),
  ).toEqual([
    { week: 1, savedOnly: true },
    { week: 2, savedOnly: false },
    { week: 3, savedOnly: false },
    { week: 4, savedOnly: false },
  ]);
});

it('keeps a valid selection and otherwise moves to the first safe week', () => {
  const choices = weekChoices([3, 4], [], 2026);
  expect(safeWeek(4, choices)).toBe(4);
  expect(safeWeek(1, choices)).toBe(3);
  expect(safeWeek(1, [])).toBeUndefined();
});
