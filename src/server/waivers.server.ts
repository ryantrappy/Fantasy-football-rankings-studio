import type { League } from './interfaces/league.interface';
import type { EspnAccess } from './providers/espn.provider';
import type { LivePlayer } from '../live-matchups';
import { verifiedUnowned, type WaiverPool } from '../waivers';
import { loadLiveLeague } from './live-matchups.server';
import SleeperProvider from './providers/sleeper.provider';
import { sleeperNames } from './insights/load.server';
import { nflRemaining, sleeperLiveProjections } from './live-projections.server';
import { enrichPlayerProjections } from './combined-projections.server';
import { sleeperProjectionRules } from '../combined-projections';
export async function loadWaiverPool(
  league: League,
  teamId: string,
  access: EspnAccess,
): Promise<WaiverPool> {
  const result: WaiverPool = {
    capturedAt: new Date().toISOString(),
    week: null,
    candidates: [],
    notices: [
      'Unowned players may be on waivers, not immediately addable. Claim timing, FAAB, transaction permissions, undroppable lists and provider-specific restrictions are not verified. No transactions are submitted.',
      'Drops are limited to the same position in your active roster to preserve roster size and positional counts. Reserve/taxi activation is not simulated. Current-week streaming only; future recovery and acquisitions are not forecast.',
    ],
  };
  if (league.leagueType !== 0)
    return {
      ...result,
      unavailable:
        'ESPN available-player pool coverage is unsupported. No free-agent availability is claimed.',
    };
  const provider = new SleeperProvider();
  const live = await loadLiveLeague(league, access);
  result.week = live.week;
  result.slots = live.lineupSlots;
  result.team = live.matchups
    .flatMap((matchup) => [matchup.home, ...(matchup.away ? [matchup.away] : [])])
    .find((team) => team.teamId === teamId);
  if (!result.team)
    return { ...result, unavailable: 'Your team roster is unavailable for this week.' };
  const season = await provider.resolveSeason(
    league.providerLeagueId ?? league.leagueId,
    league.seasonId,
  );
  const [rosters, catalog, projections, remaining] = await Promise.all([
    provider.get<{ roster_id: number; players?: string[]; reserve?: string[]; taxi?: string[] }[]>(
      `${season.league_id}/rosters`,
    ),
    sleeperNames(),
    sleeperLiveProjections(league.seasonId, live.week),
    nflRemaining(league.seasonId, live.week).catch(() => undefined),
  ]);
  result.ownership = { covered: rosters.length, expected: season.total_rosters };
  const ids = verifiedUnowned(rosters, season.total_rosters, Object.keys(catalog.positions));
  if (!ids)
    return {
      ...result,
      unavailable: 'Roster ownership coverage is incomplete. Available players cannot be verified.',
    };
  const ownRoster = rosters.find((roster) => String(roster.roster_id) === teamId);
  if (!ownRoster)
    return { ...result, unavailable: 'Your current roster ownership is unavailable.' };
  const ownedIds = new Set([
    ...(ownRoster.players ?? []),
    ...(ownRoster.reserve ?? []),
    ...(ownRoster.taxi ?? []),
  ]);
  result.team.players = result.team.players.filter((player) => ownedIds.has(player.id));
  const projection = new Map(
    projections.filter((row) => row.player_id).map((row) => [row.player_id!, row.stats]),
  );
  result.candidates = ids
    .map((id): LivePlayer => {
      const stats = projection.get(id);
      const scoring = season.scoring_settings ?? {};
      const covered =
        stats &&
        Object.entries(stats).some(
          ([key, value]) => Number.isFinite(value) && Number.isFinite(scoring[key]),
        );
      const proTeam = catalog.teams[id];
      return {
        id,
        name: catalog.names[id] ?? id,
        position: catalog.positions[id],
        starter: false,
        points: null,
        projectedPoints: covered
          ? Object.entries(stats).reduce(
              (sum, [key, value]) =>
                sum +
                (Number.isFinite(value) && Number.isFinite(scoring[key])
                  ? value * scoring[key]
                  : 0),
              0,
            )
          : undefined,
        availability: catalog.availability[id],
        bye: remaining && proTeam ? !remaining.has(proTeam) : undefined,
        locked:
          remaining && proTeam && Number.isFinite(remaining.get(proTeam))
            ? remaining.get(proTeam)! < 1
            : undefined,
      };
    })
    .filter((player) => !!catalog.teams[player.id])
    .sort(
      (a, b) =>
        (b.projectedPoints ?? -Infinity) - (a.projectedPoints ?? -Infinity) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 300);
  result.notices.push(
    `Showing up to 300 projected unowned players with NFL teams. ${ids.length} unowned catalog entries were checked; projection gaps are unavailable, not zero.`,
  );
  const compared = await enrichPlayerProjections(
    result.candidates.slice(0, 30),
    'Sleeper',
    league.seasonId,
    live.week,
    () => sleeperProjectionRules(season.scoring_settings ?? {}),
  );
  const comparisonById = new Map(compared.map((player) => [player.id, player]));
  result.candidates = result.candidates.map((player) => comparisonById.get(player.id) ?? player);
  result.notices.push(
    'Cross-source forecasts are checked for the top 30 native-projected candidates. Remaining candidates retain Sleeper projections. Ownership remains verified from your league, not the other source.',
  );
  return result;
}
