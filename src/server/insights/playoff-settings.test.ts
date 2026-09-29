import { espnPlayoffSettings, sleeperPlayoffSettings } from './playoff-settings';
import { playoffRulesReason } from '../../playoff-rules';
import type { EspnResultsData } from './results';

const espn = (): EspnResultsData => ({
  teams: [
    { id: 1, divisionId: 0 },
    { id: 2, divisionId: 1 },
  ],
  settings: {
    scheduleSettings: {
      matchupPeriodCount: 13,
      matchupPeriodLength: 1,
      playoffTeamCount: 2,
      playoffSeedingRule: 'H2H_RECORD',
      playoffReseed: false,
      divisions: [{ id: 0 }, { id: 1 }],
      matchupPeriods: { '14': [14, 15] },
    },
  },
});
it('reads each season’s tiebreakers, divisions, round length and reseeding independently', () => {
  const old = espn();
  const current = espn();
  Object.assign(current.settings!.scheduleSettings!, {
    playoffSeedingRule: 'TOTAL_POINTS_SCORED',
    playoffReseed: true,
    divisions: [],
    matchupPeriods: { '14': [14] },
  });
  current.teams![0].divisionId = 1;
  const a = espnPlayoffSettings(old, 2024)!;
  const b = espnPlayoffSettings(current, 2025)!;
  expect(a.rules).toMatchObject({
    season: 2024,
    divisionWinnersFirst: true,
    tiebreakers: ['head-to-head', 'points-for', 'division-record', 'points-against'],
    roundWeeks: [[14, 15]],
    reseed: false,
    divisionByTeam: { '1': '0', '2': '1' },
  });
  expect(b.rules).toMatchObject({
    season: 2025,
    divisionWinnersFirst: false,
    tiebreakers: ['points-for', 'head-to-head', 'division-record', 'points-against'],
    roundWeeks: [[14]],
    reseed: true,
  });
  expect(playoffRulesReason(['1', '2'], 2, 13, a.rules)).toBeUndefined();
});
it('uses published variable playoff periods and rejects missing or custom seeding rules', () => {
  const data = espn();
  Object.assign(data.settings!.scheduleSettings!, {
    playoffTeamCount: 4,
    variablePlayoffMatchupPeriodLength: true,
    matchupPeriods: { '14': [14], '15': [15, 16] },
  });
  expect(espnPlayoffSettings(data, 2023)?.rules?.roundWeeks).toEqual([[14], [15, 16]]);
  data.settings!.scheduleSettings!.playoffSeedingRule = 'UNKNOWN';
  expect(espnPlayoffSettings(data, 2023)?.rules?.unsupportedReason).toMatch(/UNKNOWN/);
  data.status = { isPlayoffMatchupEdited: true };
  expect(espnPlayoffSettings(data, 2023)?.rules?.unsupportedReason).toMatch(/manually edited/);
});
it('uses historical Sleeper roster divisions and the season’s two-week final setting', () => {
  const settings = {
    playoff_week_start: 15,
    playoff_teams: 4,
    divisions: 2,
    playoff_round_type: 1,
    playoff_seed_type: 0,
  };
  const teams = [
    { teamId: '1', divisionId: '1' },
    { teamId: '2', divisionId: '2' },
  ];
  expect(sleeperPlayoffSettings(settings, teams, 2023)?.rules).toMatchObject({
    season: 2023,
    divisionWinnersFirst: true,
    divisionByTeam: { '1': '1', '2': '2' },
    roundWeeks: [[15], [16, 17]],
    tiebreakers: ['points-for', 'points-against'],
  });
  const next = sleeperPlayoffSettings(
    { ...settings, playoff_round_type: 0, divisions: 0 },
    teams,
    2024,
  );
  expect(next?.rules).toMatchObject({ divisionWinnersFirst: false, roundWeeks: [[15], [16]] });
  expect(
    sleeperPlayoffSettings(
      { ...settings, playoff_week_start: 14, playoff_round_type: 2, playoff_seed_type: 1 },
      teams,
      2022,
    )?.rules,
  ).toMatchObject({
    roundWeeks: [
      [14, 15],
      [16, 17],
    ],
    reseed: true,
  });
  expect(
    sleeperPlayoffSettings({ ...settings, playoff_seed_type: 99 }, teams, 2024)?.rules
      ?.unsupportedReason,
  ).toMatch(/unsupported/);
  expect(
    sleeperPlayoffSettings({ ...settings, league_average_match: 1 }, teams, 2024)?.rules
      ?.unsupportedReason,
  ).toMatch(/median/);
});
