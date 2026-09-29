import '@tanstack/react-start/server-only';
import type { InsightsSource, SeasonInsights } from '../../insights';
import { forecastPlayoffs, PLAYOFF_FORECAST_MODEL_VERSION } from '../../playoff-forecast';
import { defaultSeason } from '../../util/rankings';
import type { League } from '../interfaces/league.interface';
import { connectDatabase } from '../database.server';
import { playoffForecastArchiveModel } from '../models/playoff-forecast-archive.model';

// One immutable observation per scoring cutoff. Revised provider projections belong to the next cutoff.
export async function archivePlayoffForecast(
  league: League,
  season: number,
  source: InsightsSource,
  report: SeasonInsights,
) {
  const settings = source.playoffSettings;
  if (
    season !== defaultSeason() ||
    !settings ||
    source.completedWeek < 1 ||
    source.completedWeek >= settings.regularSeasonEnd ||
    !source.rosterSnapshot ||
    !source.playoffProjection?.weekly?.length
  )
    return;

  const provider = league.leagueType === 0 ? 'Sleeper' : 'ESPN';
  const providerLeagueId = league.providerLeagueId ?? league.leagueId;
  const key = { provider, providerLeagueId, season, completedWeek: source.completedWeek };
  await connectDatabase();
  await playoffForecastArchiveModel.init();
  if (await playoffForecastArchiveModel.exists(key)) return;

  const forecast = forecastPlayoffs(report, settings, source.completedWeek);
  if (forecast.reason || !forecast.projection.used || !forecast.rows.length) return;

  const ownedPlayerIds = new Set(
    source.rosterSnapshot.teams.flatMap((team) => [...team.starters, ...team.bench]),
  );
  const archive = {
    ...key,
    capturedAt: new Date(),
    schemaVersion: 1,
    modelVersion: PLAYOFF_FORECAST_MODEL_VERSION,
    inputs: {
      playoffSettings: settings,
      teams: source.teams.map(({ teamId, teamName }) => ({ teamId, teamName })),
      scores: source.scores
        .filter(({ week }) => week <= source.completedWeek)
        .map(({ teamId, week, actual, opponentTeamId }) => ({
          teamId,
          week,
          actual,
          opponentTeamId,
        })),
      forecastSchedule: source.forecastSchedule ?? [],
      rosterSnapshot: source.rosterSnapshot,
      rosterSlots: source.forecastContext?.rosterSlots,
      injuryStatuses: source.forecastContext?.injuryStatuses ?? {},
      byeWeeks: source.forecastContext?.byeWeeks ?? {},
      playerPositions: Object.fromEntries(
        Object.entries(source.playerPositions || {}).filter(([id]) => ownedPlayerIds.has(id)),
      ),
      // The weekly array contains the first week; omit the duplicated top-level copy.
      providerProjections: {
        provider: source.playoffProjection.provider,
        capturedAt: source.playoffProjection.capturedAt,
        weekly: source.playoffProjection.weekly,
      },
    },
    forecast: {
      simulations: forecast.simulations,
      samplingMargin: forecast.samplingMargin,
      rows: forecast.rows,
      rounds: forecast.rounds,
      projectionCoverage: forecast.projection.weeks,
    },
  };

  try {
    await playoffForecastArchiveModel.updateOne(key, { $setOnInsert: archive }, { upsert: true });
  } catch (error) {
    // Concurrent first reads can race at the unique index; the first immutable capture wins.
    if (!(typeof error === 'object' && error && 'code' in error && error.code === 11000))
      throw error;
  }
}
