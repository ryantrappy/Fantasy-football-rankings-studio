// @vitest-environment node
import { it, expect } from 'vitest';
import { enrichPlayerProjections } from '../combined-projections.server';
import { sleeperProjectionRules } from '../../combined-projections';
it.skipIf(process.env.RUN_DUAL_SOURCE_CONTRACT !== '1')(
  'reads the same public NFL player from both live sources',
  async () => {
    const rules = () =>
      sleeperProjectionRules({
        pass_yd: 0.04,
        pass_td: 4,
        pass_int: -2,
        rush_yd: 0.1,
        rush_td: 6,
        rec: 1,
        rec_yd: 0.1,
        rec_td: 6,
      });
    for (const [provider, id] of [
      ['Sleeper', '4984'],
      ['ESPN', '3918298'],
    ] as const) {
      const [player] = await enrichPlayerProjections(
        [{ id, name: 'Josh Allen', position: 'QB', starter: true, points: null }],
        provider,
        2026,
        4,
        rules,
      );
      expect(player.projectionSources?.map((source) => source.provider)).toEqual([
        'ESPN',
        'Sleeper',
      ]);
      expect(player.projectedPoints).toBeGreaterThan(0);
      expect(player.projectionMethod).toBe('mean');
    }
  },
  40000,
);
