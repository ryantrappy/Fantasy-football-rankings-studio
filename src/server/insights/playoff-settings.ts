import type { PlayoffSettings } from '../../playoff-forecast';
import type { PlayoffRules, SeedingTiebreaker } from '../../playoff-rules';
import type { EspnResultsData } from './results';

export function espnPlayoffSettings(
  data: EspnResultsData,
  year: number,
): PlayoffSettings | undefined {
  const schedule = data.settings?.scheduleSettings;
  const end = schedule?.matchupPeriodCount,
    size = schedule?.playoffTeamCount;
  if (!end || !size) return undefined;
  const first = schedule.playoffSeedingRule;
  const tiebreakers: SeedingTiebreaker[] =
    first === 'H2H_RECORD'
      ? ['head-to-head', 'points-for', 'division-record', 'points-against']
      : first === 'TOTAL_POINTS_SCORED'
        ? ['points-for', 'head-to-head', 'division-record', 'points-against']
        : [];
  const divisions = schedule.divisions || [];
  const rules: PlayoffRules = {
    provider: 'ESPN',
    season: year,
    tiebreakers,
    divisionByTeam: Object.fromEntries(
      (data.teams || [])
        .filter((t) => t.divisionId != null)
        .map((t) => [String(t.id), String(t.divisionId)]),
    ),
    divisionWinnersFirst: divisions.length > 1,
    roundWeeks: Array.from({ length: Math.ceil(Math.log2(size)) }, (_, i) => {
      const published = schedule.matchupPeriods?.[String(end + i + 1)];
      if (published) return [...published];
      // Only a specified uniform round length can substitute for omitted period mappings.
      const length = schedule.playoffMatchupPeriodLength;
      return !schedule.variablePlayoffMatchupPeriodLength &&
        length &&
        Number.isInteger(length) &&
        length > 0
        ? Array.from({ length }, (_, w) => end + i * length + w + 1)
        : [];
    }),
    reseed: schedule.playoffReseed === true,
  };
  if (
    !tiebreakers.length ||
    (schedule.playoffSeedingRuleBy != null && schedule.playoffSeedingRuleBy !== 0)
  )
    rules.unsupportedReason = `ESPN ${year} playoff tiebreaker ${first ?? '(missing)'} is unavailable or unsupported.`;
  if (schedule.matchupPeriodLength !== 1)
    rules.unsupportedReason =
      'Multi-week regular-season matchups are not supported by this forecast.';
  if (
    data.settings?.scoringSettings?.scoringType &&
    data.settings.scoringSettings.scoringType !== 'H2H_POINTS'
  )
    rules.unsupportedReason = 'This forecast requires head-to-head points scoring.';
  if (data.status?.isPlayoffMatchupEdited)
    rules.unsupportedReason = `ESPN ${year} reports manually edited playoffs; the override cannot be reconstructed from season rules.`;
  if (
    rules.divisionWinnersFirst &&
    (data.teams || []).some((t) => !divisions.some((d) => d.id === t.divisionId))
  )
    rules.unsupportedReason = `ESPN ${year} historical division assignments are incomplete.`;
  return { regularSeasonEnd: end, playoffTeams: size, rules };
}

export interface SleeperPlayoffSettingsData {
  playoff_week_start?: number;
  playoff_teams?: number;
  divisions?: number;
  playoff_round_type?: number;
  playoff_seed_type?: number;
  league_average_match?: number;
  start_week?: number;
}
export function sleeperPlayoffSettings(
  settings: SleeperPlayoffSettingsData | undefined,
  teams: { teamId: string; divisionId?: string }[],
  year: number,
): PlayoffSettings | undefined {
  if (!settings?.playoff_week_start || !settings.playoff_teams) return undefined;
  const end = settings.playoff_week_start - 1,
    size = settings.playoff_teams;
  const rounds = Math.ceil(Math.log2(size));
  const rules: PlayoffRules = {
    provider: 'Sleeper',
    season: year,
    tiebreakers: ['points-for', 'points-against'],
    divisionByTeam: Object.fromEntries(
      teams.filter((t) => t.divisionId != null).map((t) => [t.teamId, t.divisionId!]),
    ),
    divisionWinnersFirst: (settings.divisions ?? 0) > 1,
    // Sleeper's published client: 0 = one week, 1 = two-week final, 2 = all two-week rounds.
    roundWeeks: Array.from({ length: rounds }, (_, i) =>
      settings.playoff_round_type === 2
        ? [end + 2 * i + 1, end + 2 * i + 2]
        : settings.playoff_round_type === 1 && i === rounds - 1
          ? [end + i + 1, end + i + 2]
          : [end + i + 1],
    ),
    reseed: settings.playoff_seed_type === 1,
  };
  // Undocumented enum values must not silently select a different bracket.
  if (
    ![0, 1, 2].includes(settings.playoff_round_type ?? -1) ||
    ![0, 1].includes(settings.playoff_seed_type ?? -1)
  )
    rules.unsupportedReason = `Sleeper ${year} playoff round or reseeding settings are unavailable or unsupported.`;
  if (settings.league_average_match)
    rules.unsupportedReason = 'League-median extra wins are not supported by this forecast.';
  if (settings.start_week && settings.start_week !== 1)
    rules.unsupportedReason =
      'A regular season starting after week 1 is not supported by this forecast.';
  if (
    rules.divisionWinnersFirst &&
    new Set(teams.map((t) => t.divisionId)).size !== settings.divisions
  )
    rules.unsupportedReason = `Sleeper ${year} historical division assignments are incomplete.`;
  return { regularSeasonEnd: end, playoffTeams: size, rules };
}
