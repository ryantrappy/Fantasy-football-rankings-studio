import { gameRemaining } from '../live-projections.server';
it('keeps scheduled games at full uncertainty and completed games at zero', () => {
  expect(gameRemaining({ status: { type: { state: 'pre' } } })).toBe(1);
  expect(gameRemaining({ status: { type: { completed: true } } })).toBe(0);
  expect(gameRemaining({ status: { type: { state: 'in' }, period: 3, clock: 900 } })).toBe(0.5);
  expect(
    gameRemaining({ status: { type: { state: 'in' }, period: 5, clock: 300 } }),
  ).toBeGreaterThan(0);
  expect(gameRemaining({})).toBeUndefined();
});
