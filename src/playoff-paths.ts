import type { SeasonInsights } from './insights';
import type { FixedOutcome, PlayoffForecast } from './playoff-forecast';

export interface PathFixture {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
}

export const fixtureKey = (fixture: PathFixture) =>
  `${fixture.week}|${fixture.homeTeamId}|${fixture.awayTeamId}`;

// Remaining regular-season fixtures with known opponents, earliest first.
export function remainingFixtures(data: SeasonInsights, regularSeasonEnd: number): PathFixture[] {
  return (data.forecastSchedule ?? [])
    .filter((fixture) => fixture.week > data.completedWeek && fixture.week <= regularSeasonEnd)
    .map((fixture) => ({
      week: fixture.week,
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId,
    }))
    .sort(
      (a, b) =>
        a.week - b.week ||
        a.homeTeamId.localeCompare(b.homeTeamId) ||
        a.awayTeamId.localeCompare(b.awayTeamId),
    );
}

// Projected weekly points for a team, preferring the per-week rows and falling
// back to the single-week snapshot when it covers the requested week.
export function projectedPointsForWeek(
  data: SeasonInsights,
  week: number,
): Record<string, number> | undefined {
  const weekly = data.playoffProjection?.weekly?.find((row) => row.week === week);
  if (weekly) return weekly.teamPoints;
  const snapshot = data.playoffProjection;
  if (snapshot && snapshot.week === week) return snapshot.teamPoints;
  return undefined;
}

// Fill each remaining fixture with the higher projected points winner. A
// fixture is left unset when either team lacks a projection for that week or
// the projections tie. Nothing here runs automatically; callers invoke it
// only from the prefill button.
export function prefillFromProjections(
  data: SeasonInsights,
  fixtures: PathFixture[],
): Record<string, string> {
  const picks: Record<string, string> = {};
  for (const fixture of fixtures) {
    const points = projectedPointsForWeek(data, fixture.week);
    if (!points) continue;
    const home = points[fixture.homeTeamId];
    const away = points[fixture.awayTeamId];
    if (!Number.isFinite(home) || !Number.isFinite(away) || home === away) continue;
    picks[fixtureKey(fixture)] = home > away ? fixture.homeTeamId : fixture.awayTeamId;
  }
  return picks;
}

export function picksToFixedOutcomes(
  picks: Record<string, string>,
  fixtures: PathFixture[],
): FixedOutcome[] {
  return fixtures
    .filter((fixture) => picks[fixtureKey(fixture)])
    .map((fixture) => ({ ...fixture, winnerTeamId: picks[fixtureKey(fixture)] }));
}

export interface LeverageRow {
  fixture: PathFixture;
  homeChance: number;
  awayChance: number;
  swing: number;
}

// Rank remaining fixtures by how much each outcome moves the selected team
// playoff chance, using the conditional chances from a single leverage run.
export function rankLeverage(forecast: PlayoffForecast | undefined, teamId: string): LeverageRow[] {
  if (!forecast?.leverage) return [];
  const rows: LeverageRow[] = [];
  for (const entry of forecast.leverage) {
    const homeOutcome = entry.outcomes.find((o) => o.winnerTeamId === entry.homeTeamId);
    const awayOutcome = entry.outcomes.find((o) => o.winnerTeamId === entry.awayTeamId);
    if (!homeOutcome || !awayOutcome) continue;
    const homeChance = homeOutcome.chances.find((c) => c.teamId === teamId)?.playoff ?? 0;
    const awayChance = awayOutcome.chances.find((c) => c.teamId === teamId)?.playoff ?? 0;
    rows.push({
      fixture: {
        week: entry.week,
        homeTeamId: entry.homeTeamId,
        awayTeamId: entry.awayTeamId,
      },
      homeChance,
      awayChance,
      swing: Math.abs(homeChance - awayChance),
    });
  }
  return rows.sort((a, b) => b.swing - a.swing);
}

// The team with the best current combined record, used when no managed team
// is available (shared links, or a managed team that needs reselection).
export function defaultTeamId(data: SeasonInsights | undefined): string | undefined {
  if (!data) return undefined;
  return [...data.teams].sort(
    (a, b) =>
      (b.combinedWins ?? 0) - (a.combinedWins ?? 0) ||
      (b.average ?? 0) - (a.average ?? 0) ||
      a.teamId.localeCompare(b.teamId),
  )[0]?.teamId;
}
