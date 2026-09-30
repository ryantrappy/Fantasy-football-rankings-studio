/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG needs a named chart role. */
import { Box, Button, Field, Flex, Heading, NativeSelect, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { PublicInsightsApi } from '../api/public-insights';
import { errorMessage } from '../api/client';
import {
  backtestPlayoffSeason,
  summarizeCalibration,
  predictiveObservations,
  summarizeCalibrationSeasons,
  type CalibrationObservation,
} from '../playoff-calibration';
import { DataTable } from './DataTable';
import {
  buildCalibrationExport,
  calibrationReplayInputs,
  downloadCalibrationExport,
  type CalibrationReplaySeason,
} from '../playoff-calibration-export';

export function PlayoffCalibration({
  api,
  leagueId,
  year,
  frozen = false,
}: {
  api: Pick<PublicInsightsApi, 'getLeagueSeasons' | 'getInsights'>;
  leagueId: string;
  year: number;
  frozen?: boolean;
}) {
  const [run, setRun] = useState(0);
  const [state, setState] = useState<{
    running: boolean;
    progress: string;
    observations: CalibrationObservation[];
    notes: string[];
    seasons: CalibrationReplaySeason[];
    requestedSeasons: number[];
    completedAt?: string;
  }>({
    running: false,
    progress: '',
    observations: [],
    notes: [],
    seasons: [],
    requestedSeasons: [],
  });
  const [selectedWeek, setSelectedWeek] = useState(1);
  useEffect(() => {
    if (!run || frozen) return;
    let cancelled = false;
    const observations: CalibrationObservation[] = [],
      notes: string[] = [];
    const seasons: CalibrationReplaySeason[] = [];
    let requestedSeasons: number[] = [];
    const publish = (running: boolean, progress: string) => {
      if (!cancelled)
        setState({
          running,
          progress,
          observations: [...observations],
          notes: [...notes],
          seasons: [...seasons],
          requestedSeasons: [...requestedSeasons],
          completedAt: running ? undefined : new Date().toISOString(),
        });
    };
    void (async () => {
      publish(true, 'Finding previous seasons…');
      try {
        const context = await api.getLeagueSeasons(leagueId);
        const years = [...new Set(context.years)]
          .filter((y) => y < year)
          .sort((a, b) => b - a)
          .slice(0, 5);
        requestedSeasons = years;
        if (!years.length) notes.push('No previous completed seasons are available.');
        for (const season of years) {
          if (cancelled) return;
          publish(true, `Loading and simulating ${season}…`);
          try {
            const data = await api.getInsights(leagueId, season);
            if (cancelled) return;
            const reason = await backtestPlayoffSeason(
              season,
              data,
              (rows) => observations.push(...rows),
              () => cancelled,
            );
            if (cancelled) return;
            if (reason) notes.push(`${season} excluded: ${reason}`);
            else seasons.push(calibrationReplayInputs(season, data));
          } catch (error) {
            notes.push(`${season} unavailable: ${errorMessage(error)}`);
          }
          publish(true, `Finished ${season}.`);
        }
      } catch (error) {
        notes.push(errorMessage(error));
      }
      publish(false, 'Backtest complete.');
    })();
    return () => {
      cancelled = true;
    };
  }, [api, leagueId, year, run, frozen]);
  const predictive = predictiveObservations(state.observations);
  const weeks = summarizeCalibration(predictive);
  const seasonMetrics = summarizeCalibrationSeasons(state.observations);
  const resolved = state.observations.filter((r) => r.week === r.regularSeasonEnd);
  const finalError = resolved.length
    ? resolved.reduce((sum, r) => sum + (r.probability - Number(r.qualified)) ** 2, 0) /
      resolved.length
    : null;
  const selected = weeks.find((w) => w.week === selectedWeek) || weeks[0];
  const first = weeks[0],
    last = weeks.at(-1);
  const percent = (n: number) => `${(n * 100).toFixed(1)}%`;
  const maxWeek = last?.week || 1;
  const x = (week: number) => 55 + (maxWeek === 1 ? 320 : ((week - 1) * 640) / (maxWeek - 1));
  const y = (score: number) => 235 - score * 210;
  return (
    <Box
      as="section"
      aria-label="Season-level playoff calibration"
      className="panel insight-section"
      bg="bg"
      borderWidth="1px"
      rounded="lg"
      p={{ base: 4, md: 6 }}
      mt={5}
    >
      <Heading as="h2" size="xl" mb={3}>
        Previous-season playoff accuracy
      </Heading>
      <Text mb={3}>
        Replay up to five seasons before {year}, using only scores through each completed week, and
        compare playoff probabilities with actual entrants. Today’s projections and injuries are
        excluded. This evaluates the historical scoring model; archived player projections are
        unavailable. Each season uses its own playoff places, divisions, tiebreakers and bracket
        settings retrieved from the provider.
      </Text>
      <Text mb={3}>
        Accuracy may improve as the season progresses, but improvement is measured, never forced.
        Final regular-season cutoffs are excluded from predictive accuracy and shown separately as
        rules checks. Teams within a season are dependent; a handful of seasons cannot establish
        reliable 99% odds.
      </Text>
      {frozen ? (
        <Text>
          Historical calibration is not included in this saved snapshot. Open the live playoff
          report to run it.
        </Text>
      ) : (
        <>
          <Flex gap={2} flexWrap="wrap" mb={3}>
            <Button onClick={() => setRun((n) => n + 1)} disabled={state.running}>
              {run ? 'Rerun historical calibration' : 'Run historical calibration'}
            </Button>
            <Button
              variant="outline"
              disabled={state.running || !state.completedAt || !state.observations.length}
              onClick={() => {
                if (!state.completedAt || state.running || !state.observations.length) return;
                downloadCalibrationExport(
                  buildCalibrationExport({
                    leagueId,
                    selectedSeason: year,
                    completedAt: state.completedAt,
                    requestedSeasons: state.requestedSeasons,
                    seasons: state.seasons,
                    observations: state.observations,
                    notes: state.notes,
                  }),
                );
              }}
            >
              Export calibration JSON
            </Button>
          </Flex>
          <Text mb={3} fontSize="sm">
            After the backtest completes, export the JSON and attach it here for model review. It
            includes full-precision predictions, outcomes, weekly metrics, and the historical scores
            and schedules needed to test improvements.
          </Text>
        </>
      )}
      {state.progress && (
        <Box as="output" display="block" mb={3}>
          {state.progress}
        </Box>
      )}
      {state.notes.length > 0 && (
        <Box as="ul" mb={3}>
          {state.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </Box>
      )}
      {first && last && (
        <>
          <Text mb={3}>
            {first.seasons} seasons, {first.teams} team outcomes at week {first.week}. Predictive
            Brier score: {first.brier.toFixed(3)} at week {first.week} → {last.brier.toFixed(3)} at
            week {last.week}. Lower is better.{' '}
            {last.brier < first.brier
              ? 'Error decreased across these endpoints.'
              : 'Error did not decrease across these endpoints.'}{' '}
            Counts by week are shown below; later weeks may cover fewer seasons.
          </Text>
          <Text mb={3}>
            Solid green: model Brier score. Dashed blue: standings benchmark, retaining banked wins,
            points and remaining opponents but giving all teams equal future scoring strength and
            variability. Dotted orange: equal-chance baseline (playoff places ÷ teams). Lower error
            than the standings benchmark shows that estimated team strength adds predictive value.
          </Text>
          <Box overflowX="auto">
            <svg
              viewBox="0 0 730 285"
              width="100%"
              style={{ minWidth: 480 }}
              role="img"
              aria-label="Playoff forecast Brier score by completed week; lower is better. Exact scores follow in the table."
            >
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <g key={v}>
                  <line x1="55" x2="695" y1={y(v)} y2={y(v)} stroke="var(--chakra-colors-border)" />
                  <text x="45" y={y(v) + 4} textAnchor="end" fill="currentColor" fontSize="12">
                    {v.toFixed(2)}
                  </text>
                </g>
              ))}
              {weeks.map((w) => (
                <text
                  key={w.week}
                  x={x(w.week)}
                  y="255"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="12"
                >
                  {w.week}
                </text>
              ))}
              {(['brier', 'standingsBrier', 'baselineBrier'] as const).map((metric) => (
                <g key={metric}>
                  {weeks
                    .slice(1)
                    .map(
                      (w, i) =>
                        weeks[i].week === w.week - 1 &&
                        weeks[i][metric] !== null &&
                        w[metric] !== null && (
                          <line
                            key={w.week}
                            x1={x(weeks[i].week)}
                            y1={y(weeks[i][metric]!)}
                            x2={x(w.week)}
                            y2={y(w[metric]!)}
                            stroke={
                              metric === 'brier'
                                ? '#246747'
                                : metric === 'standingsBrier'
                                  ? '#345eae'
                                  : '#a34f2d'
                            }
                            strokeWidth="2.5"
                            strokeDasharray={
                              metric === 'brier'
                                ? undefined
                                : metric === 'standingsBrier'
                                  ? '6 4'
                                  : '2 4'
                            }
                          />
                        ),
                    )}
                  {weeks.map(
                    (w) =>
                      w[metric] !== null && (
                        <circle
                          key={w.week}
                          cx={x(w.week)}
                          cy={y(w[metric]!)}
                          r="4"
                          fill={
                            metric === 'brier'
                              ? '#246747'
                              : metric === 'standingsBrier'
                                ? '#345eae'
                                : '#a34f2d'
                          }
                        >
                          <title>
                            Week {w.week},{' '}
                            {metric === 'brier'
                              ? 'model'
                              : metric === 'standingsBrier'
                                ? 'standings'
                                : 'equal chance'}
                            : {w[metric]!.toFixed(3)}
                          </title>
                        </circle>
                      ),
                  )}
                </g>
              ))}
              <text x="375" y="280" textAnchor="middle" fill="currentColor" fontSize="12">
                Completed regular-season week
              </text>
            </svg>
          </Box>
          <Box overflowX="auto">
            <DataTable
              label="Weekly playoff forecast accuracy"
              data={weeks}
              getRowId={(w) => String(w.week)}
              columns={[
                {
                  id: 'week',
                  header: 'Week',
                  value: (w) => w.week,
                  cell: (w) => w.week,
                  rowHeader: true,
                },
                {
                  id: 'seasons',
                  header: 'Seasons',
                  value: (w) => w.seasons,
                  cell: (w) => w.seasons,
                },
                {
                  id: 'teams',
                  header: 'Team outcomes',
                  value: (w) => w.teams,
                  cell: (w) => w.teams,
                },
                ...(
                  [
                    'brier',
                    'standingsBrier',
                    'baselineBrier',
                    'logLoss',
                    'standingsLogLoss',
                    'baselineLogLoss',
                  ] as const
                ).map((metric, i) => ({
                  id: metric,
                  header: [
                    'Model Brier',
                    'Standings Brier',
                    'Equal-chance Brier',
                    'Model log loss',
                    'Standings log loss',
                    'Equal-chance log loss',
                  ][i],
                  value: (w: typeof first) => w[metric],
                  cell: (w: typeof first) => w[metric]?.toFixed(3) ?? '—',
                })),
                {
                  id: 'accuracy',
                  header: 'Accuracy at 50% threshold',
                  value: (w) => w.accuracy,
                  cell: (w) => percent(w.accuracy),
                },
              ]}
            />
          </Box>
          <Text mt={3} mb={3}>
            Brier score is mean squared probability error. Log loss penalizes confident mistakes;
            probabilities are clipped to 0.000001–0.999999 for scoring. Both are lower-is-better.
            Classification accuracy uses a 50% threshold and can be misleading when most teams
            qualify or miss.
          </Text>
          <Heading as="h3" size="md" mt={5} mb={3}>
            Predictive results by season
          </Heading>
          <Text mb={3}>
            Each season averages its predictive cutoffs, excluding the final week. Positive Brier
            skill means lower error than the standings benchmark; negative means worse. These
            repeated forecasts are dependent, not separate independent team outcomes. Compare
            changes on later seasons or additional leagues before tuning the model.
          </Text>
          <Box overflowX="auto">
            <DataTable
              label="Playoff accuracy by season"
              data={seasonMetrics}
              getRowId={(s) => String(s.year)}
              columns={[
                {
                  id: 'year',
                  header: 'Season',
                  value: (s) => s.year,
                  cell: (s) => s.year,
                  rowHeader: true,
                },
                {
                  id: 'teams',
                  header: 'Unique teams',
                  value: (s) => s.uniqueTeams,
                  cell: (s) => s.uniqueTeams,
                },
                {
                  id: 'cutoffs',
                  header: 'Predictive cutoffs',
                  value: (s) => s.cutoffs,
                  cell: (s) => s.cutoffs,
                },
                {
                  id: 'forecasts',
                  header: 'Team-week forecasts',
                  value: (s) => s.forecasts,
                  cell: (s) => s.forecasts,
                },
                {
                  id: 'brier',
                  header: 'Model Brier',
                  value: (s) => s.brier,
                  cell: (s) => s.brier.toFixed(3),
                },
                {
                  id: 'standings',
                  header: 'Standings Brier',
                  value: (s) => s.standingsBrier,
                  cell: (s) => s.standingsBrier?.toFixed(3) ?? '—',
                },
                {
                  id: 'skill',
                  header: 'Brier skill vs standings',
                  value: (s) => s.standingsSkill,
                  cell: (s) => (s.standingsSkill === null ? '—' : percent(s.standingsSkill)),
                },
              ]}
            />
          </Box>
          <Field.Root maxW="xs" mb={3}>
            <Field.Label>Calibration through week</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={selected?.week || 1}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {weeks.map((w) => (
                  <option key={w.week} value={w.week}>
                    {w.week}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          {selected && (
            <>
              <Text mb={3}>
                Week {selected.week}: predicted probability versus actual qualification rate. Bins
                use only this cutoff, so teams are not counted repeatedly across weeks. Each bin
                includes its lower boundary; only the last includes 100%.
              </Text>
              <Box overflowX="auto">
                <DataTable
                  label="Season-level playoff reliability"
                  data={selected.reliability.filter((b) => b.count)}
                  getRowId={(b) => b.label}
                  columns={[
                    {
                      id: 'bin',
                      header: 'Forecast range',
                      value: (b) => b.label,
                      cell: (b) => b.label,
                      rowHeader: true,
                    },
                    {
                      id: 'count',
                      header: 'Team outcomes',
                      value: (b) => b.count,
                      cell: (b) => b.count,
                    },
                    {
                      id: 'predicted',
                      header: 'Mean predicted',
                      value: (b) => b.predicted,
                      cell: (b) => percent(b.predicted),
                    },
                    {
                      id: 'observed',
                      header: 'Actually qualified',
                      value: (b) => b.observed,
                      cell: (b) => percent(b.observed),
                    },
                  ]}
                />
              </Box>
            </>
          )}
        </>
      )}
      {finalError !== null && (
        <Box mt={5}>
          <Heading as="h3" size="md" mb={2}>
            Final-week seeding rules check
          </Heading>
          <Text>
            {new Set(resolved.map((r) => r.year)).size} seasons, {resolved.length} team outcomes.
            Model Brier error: {finalError.toFixed(3)}. All regular-season scores are known here, so
            this result is excluded from the predictive chart and season comparisons. Nonzero error
            can indicate tied standings or differences from actual qualification rules.
          </Text>
        </Box>
      )}
      {!!state.observations.length && !weeks.length && (
        <Text>
          No cutoffs with remaining regular-season games are available for predictive evaluation.
        </Text>
      )}
    </Box>
  );
}
