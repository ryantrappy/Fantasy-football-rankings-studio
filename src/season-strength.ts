import type { SeasonInsights } from './insights';

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const round = (value: number) => Math.round(value * 100) / 100;
const standardPositions = ['RB', 'WR', 'QB', 'TE', 'K', 'DEF'];

function currentWeekly(data: SeasonInsights) {
  const snapshot = data.playoffProjection;
  if (!snapshot || snapshot.week !== data.completedWeek + 1) return [];
  const weekly = snapshot.weekly ?? [snapshot];
  return weekly.filter(
    (row) =>
      row.week > data.completedWeek &&
      row.week <= 18 &&
      weekly.filter((other) => other.week === row.week).length === 1,
  );
}

export function positionStrength(data: SeasonInsights) {
  const weekly = currentWeekly(data);
  const end = data.regularSeasonSchedule?.endWeek ?? data.playoffSettings?.regularSeasonEnd;
  const postseason =
    data.playoffSettings?.rules?.roundWeeks.flat() ??
    (data.playoffSettings
      ? Array.from(
          { length: Math.ceil(Math.log2(data.playoffSettings.playoffTeams)) },
          (_, i) => data.playoffSettings!.regularSeasonEnd + i + 1,
        )
      : []);
  const weeks = end
    ? [
        ...new Set([
          ...Array.from(
            { length: Math.max(0, end - data.completedWeek) },
            (_, i) => data.completedWeek + i + 1,
          ),
          ...postseason,
        ]),
      ]
        .filter((week) => week > data.completedWeek && week <= 18)
        .sort((a, b) => a - b)
    : weekly.map((row) => row.week).sort((a, b) => a - b);
  const positionSet = new Set(
    weekly.flatMap((row) =>
      Object.values(row.positionPoints ?? {}).flatMap((points) => Object.keys(points)),
    ),
  );
  const positions = [
    ...standardPositions.filter((p) => positionSet.has(p)),
    ...[...positionSet].filter((p) => !standardPositions.includes(p)).sort(),
  ];
  const rows = data.teams.map((team) => {
    const covered = weeks.flatMap((week) => {
      const row = weekly.find((r) => r.week === week);
      const points = row?.positionPoints?.[team.teamId];
      if (
        !row?.optimizedLineup ||
        !points ||
        !Object.keys(points).length ||
        !Object.values(points).every(finite) ||
        !finite(row.teamPoints[team.teamId])
      )
        return [];
      // Reject inconsistent old or partial snapshots rather than inventing contributions.
      if (
        Math.abs(Object.values(points).reduce((a, b) => a + b, 0) - row.teamPoints[team.teamId]) >
        0.01
      )
        return [];
      return [points];
    });
    const complete = weeks.length > 0 && covered.length === weeks.length;
    const points = Object.fromEntries(
      positions.map((position) => [
        position,
        complete ? round(covered.reduce((sum, row) => sum + (row[position] ?? 0), 0)) : null,
      ]),
    );
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      coveredWeeks: covered.length,
      points,
      total: complete
        ? round(
            covered.reduce((sum, row) => sum + Object.values(row).reduce((a, b) => a + b, 0), 0),
          )
        : null,
      ranks: {} as Record<string, number | null>,
    };
  });
  for (const row of rows)
    for (const position of positions) {
      const points = row.points[position];
      row.ranks[position] =
        points === null
          ? null
          : 1 +
            rows.filter(
              (other) => other.points[position] !== null && other.points[position]! > points,
            ).length;
    }
  return { weeks, positions, rows };
}

export interface ScheduleOpponent {
  week: number;
  opponentId: string | null;
  opponentName: string;
  points: number | null;
  baseline: number | null;
  difference: number | null;
  source: 'projection' | 'historical' | null;
  status: 'matchup' | 'bye' | 'unknown';
}

export function remainingScheduleStrength(data: SeasonInsights) {
  const end = data.regularSeasonSchedule?.endWeek ?? data.playoffSettings?.regularSeasonEnd;
  const weeks = end
    ? Array.from(
        { length: Math.max(0, end - data.completedWeek) },
        (_, i) => data.completedWeek + i + 1,
      )
    : [];
  const fixtures = data.regularSeasonSchedule?.fixtures ?? data.forecastSchedule ?? [];
  const names = new Map(data.teams.map((team) => [team.teamId, team.teamName]));
  const weekly = currentWeekly(data);
  const historical = Object.fromEntries(
    data.teams.map((team) => {
      const scores = data.scores.filter(
        (s) =>
          s.teamId === team.teamId &&
          s.week <= data.completedWeek &&
          s.week <= (end ?? 18) &&
          finite(s.actual),
      );
      return [
        team.teamId,
        scores.length ? scores.reduce((sum, s) => sum + s.actual, 0) / scores.length : null,
      ];
    }),
  );
  const estimates = new Map(
    weeks.map((week) => {
      const projected = weekly.find((row) => row.week === week);
      const complete = (row: Record<string, unknown>) =>
        data.teams.length > 0 && data.teams.every((team) => finite(row[team.teamId]));
      const useProjection = projected?.optimizedLineup && complete(projected.teamPoints);
      const points = useProjection ? projected!.teamPoints : historical;
      const available = complete(points);
      return [
        week,
        {
          points,
          baseline: available
            ? data.teams.reduce((sum, team) => sum + points[team.teamId]!, 0) / data.teams.length
            : null,
          source: available
            ? useProjection
              ? ('projection' as const)
              : ('historical' as const)
            : null,
        },
      ];
    }),
  );
  const rows = data.teams.map((team) => {
    const opponents: ScheduleOpponent[] = weeks.map((week) => {
      const matches = fixtures.filter(
        (f) => f.week === week && (f.homeTeamId === team.teamId || f.awayTeamId === team.teamId),
      );
      const match = matches.length === 1 ? matches[0] : undefined;
      const opponentId = match
        ? match.homeTeamId === team.teamId
          ? match.awayTeamId
          : match.homeTeamId
        : null;
      const bye = !!match && match.awayTeamId === null;
      const valid =
        !!opponentId &&
        opponentId !== team.teamId &&
        names.has(opponentId) &&
        fixtures.filter(
          (f) => f.week === week && (f.homeTeamId === opponentId || f.awayTeamId === opponentId),
        ).length === 1;
      const estimate = estimates.get(week)!;
      const points = valid && estimate.source ? estimate.points[opponentId] : null;
      return {
        week,
        opponentId: valid ? opponentId : null,
        opponentName: bye ? 'Bye' : valid ? names.get(opponentId)! : 'Schedule unavailable',
        points,
        baseline: valid ? estimate.baseline : null,
        difference:
          points !== null && estimate.baseline !== null ? points - estimate.baseline : null,
        source: valid ? estimate.source : null,
        status: bye ? 'bye' : valid ? 'matchup' : 'unknown',
      };
    });
    const matchups = opponents.filter((row) => row.status === 'matchup');
    const measured = matchups.filter((row) => row.difference !== null);
    const complete =
      weeks.length > 0 && opponents.every((row) => row.status === 'bye' || row.difference !== null);
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      opponents,
      scheduledWeeks: matchups.length,
      measuredWeeks: measured.length,
      unknownWeeks: opponents.filter((row) => row.status === 'unknown').length,
      historicalWeeks: measured.filter((row) => row.source === 'historical').length,
      difficulty:
        complete && measured.length
          ? round(measured.reduce((sum, row) => sum + row.difference!, 0) / measured.length)
          : null,
      rank: null as number | null,
    };
  });
  for (const row of rows)
    if (row.difficulty !== null)
      row.rank =
        1 +
        rows.filter((other) => other.difficulty !== null && other.difficulty < row.difficulty!)
          .length;
  rows.sort(
    (a, b) =>
      (a.difficulty ?? Infinity) - (b.difficulty ?? Infinity) ||
      a.teamName.localeCompare(b.teamName),
  );
  return { weeks, rows, endWeek: end };
}

export type PositionStrength = ReturnType<typeof positionStrength>;
export type ScheduleStrength = ReturnType<typeof remainingScheduleStrength>;
