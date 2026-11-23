import type { LiveLeague, LiveMatchup, LivePlayer, LiveTeam } from './live-matchups';
import type { WaiverPool } from './waivers';

export type ProjectionProvider = 'Sleeper' | 'ESPN';
export type ProjectionSource = 'Combined' | ProjectionProvider;

export function selectPlayerProjection(
  player: LivePlayer,
  source: ProjectionSource,
  provider: ProjectionProvider,
  capturedAt?: string,
): LivePlayer {
  if (source === 'Combined') return player;
  const match = player.projectionSources?.find((entry) => entry.provider === source);
  const native =
    player.nativeProjection?.provider === source
      ? player.nativeProjection.points
      : source === provider &&
          !player.nativeProjection &&
          (player.projectionMethod === undefined || player.projectionMethod === 'native')
        ? player.projectedPoints
        : undefined;
  const bye = player.nflSchedule?.status === 'bye' ? player.nflSchedule : undefined;
  const estimate = bye
    ? {
        provider: source,
        playerId: match?.playerId ?? (source === provider ? player.id : ''),
        points: 0,
        capturedAt: bye.capturedAt,
        basis: 'confirmed-bye' as const,
      }
    : native !== undefined && Number.isFinite(native)
      ? {
          provider: source,
          playerId: player.id,
          points: native,
          capturedAt: match?.capturedAt ?? capturedAt ?? 'Unavailable',
        }
      : match && Number.isFinite(match.points)
        ? match
        : undefined;
  const partial = estimate && 'scope' in estimate && estimate.scope === 'shared-stats';
  const confirmedBye = estimate && 'basis' in estimate && estimate.basis === 'confirmed-bye';
  return {
    ...player,
    projectedPoints: partial ? undefined : estimate?.points,
    projectionSubtotal: partial ? estimate?.points : undefined,
    projectionSources: estimate?.playerId ? [estimate] : [],
    projectionMethod:
      estimate && !partial ? (source === provider ? 'native' : 'single-source') : undefined,
    projectionSpread: undefined,
    projectionNote: confirmedBye
      ? 'The confirmed NFL bye sets this projection to zero.'
      : partial
        ? `${source} covers shared stats. The full league-scored projection is unavailable.`
        : estimate
          ? `${source}-only projection.`
          : `${source} projection unavailable.`,
  };
}

function teamProjection(
  team: LiveTeam,
  source: ProjectionSource,
  provider: ProjectionProvider,
  capturedAt?: string,
) {
  return {
    ...team,
    players: team.players.map((player) =>
      selectPlayerProjection(player, source, provider, capturedAt),
    ),
  };
}

export function matchupProjections(
  matchup: LiveMatchup,
  source: ProjectionSource,
  provider: ProjectionProvider,
  capturedAt?: string,
): LiveMatchup {
  if (source === 'Combined') return matchup;
  return {
    ...matchup,
    home: teamProjection(matchup.home, source, provider, capturedAt),
    away: matchup.away ? teamProjection(matchup.away, source, provider, capturedAt) : null,
  };
}

export function leagueProjections(league: LiveLeague, source: ProjectionSource): LiveLeague {
  if (source === 'Combined') return league;
  return {
    ...league,
    matchups: league.matchups.map((matchup) =>
      matchupProjections(matchup, source, league.provider, league.capturedAt),
    ),
  };
}

export function waiverProjections(pool: WaiverPool, source: ProjectionSource): WaiverPool {
  if (source === 'Combined') return pool;
  return {
    ...pool,
    team: pool.team && teamProjection(pool.team, source, 'Sleeper', pool.capturedAt),
    candidates: pool.candidates.map((player) =>
      selectPlayerProjection(player, source, 'Sleeper', pool.capturedAt),
    ),
  };
}

export function projectionText(points?: number, subtotal?: number, unavailable = 'Unavailable') {
  return (
    points?.toFixed(2) ??
    (subtotal === undefined ? unavailable : `${subtotal.toFixed(2)} (partial)`)
  );
}
