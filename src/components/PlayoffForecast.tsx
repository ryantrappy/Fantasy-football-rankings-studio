import { DisclosureMotion } from './DisclosureMotion';
import { useInlineDetailNavigation } from './useInlineDetailNavigation';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Named histogram scroll regions need keyboard access. */
import './analytics-explorer.css';
import { Box, Button, Field, Flex, Heading, NativeSelect, Text } from '@chakra-ui/react';
import { useId, useState, type ReactNode } from 'react';
import type { SeasonInsights } from '../insights';
import { usePlayoffForecast } from '../hooks/usePlayoffForecast';
import { DataTable } from './DataTable';
import { PlayoffTimeline } from './PlayoffTimeline';
import { describePlayoffRules } from '../playoff-rules';
export function PlayoffForecast({
  data,
  advanced,
}: {
  data: SeasonInsights;
  advanced?: (active: boolean) => ReactNode;
}) {
  const { detailId, detail, trigger, openDetail, returnToReport } = useInlineDetailNavigation();
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const assumptionsId = useId();
  const settings = data.playoffSettings;
  const maxWeek = Math.min(data.completedWeek, settings?.regularSeasonEnd ?? 0);
  const [selected, setSelected] = useState<number>();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [view, setView] = useState<'table' | 'chart' | 'advanced'>('table');
  const [displayMode, setDisplayMode] = useState<'table' | 'histogram'>('table');
  const [advancedOpened, setAdvancedOpened] = useState(false);
  const [metric, setMetric] = useState<'playoff' | 'championship'>('playoff');
  const cutoff = view === 'chart' ? maxWeek : Math.min(selected ?? maxWeek, maxWeek);
  const { forecast, pending, error } = usePlayoffForecast(data, settings, cutoff);
  const percent = (n: number) => `${(n * 100).toFixed(1)}%`;
  const sortedRows = forecast?.rows ? [...forecast.rows].sort((a, b) => b.playoff - a.playoff) : [];
  const inspectedRow =
    sortedRows.find((r) => r.teamId === selectedTeamId) ?? sortedRows[0] ?? forecast?.rows?.[0];
  const inspectedTeamScores = inspectedRow
    ? data.scores.filter(
        (s) =>
          s.teamId === inspectedRow.teamId &&
          s.week <= cutoff &&
          s.actual !== null &&
          s.opponentTeamId,
      )
    : [];
  const inspectedResults = inspectedTeamScores.flatMap((score) => {
    const opponent = data.scores.find(
      (other) =>
        other.teamId === score.opponentTeamId &&
        other.week === score.week &&
        other.opponentTeamId === score.teamId,
    );
    return opponent?.actual != null ? [Math.sign(score.actual! - opponent.actual)] : [];
  });
  const inspectedWins = inspectedResults.filter((result) => result > 0).length;
  const inspectedLosses = inspectedResults.filter((result) => result < 0).length;
  const inspectedTies = inspectedResults.filter((result) => result === 0).length;
  return (
    <Box
      as="section"
      className="panel insight-section analytics-explorer analytics-explorer-forecast"
      bg="bg"
      borderWidth="1px"
      rounded="lg"
      p={0}
      overflow="hidden"
    >
      <Flex
        as="nav"
        aria-label="Playoff forecast views"
        className="analytics-explorer-tabs forecast-top-tabs"
        gap={2}
        flexWrap="wrap"
      >
        <Button
          size="sm"
          colorPalette="indigo"
          variant={view === 'table' ? 'solid' : 'outline'}
          aria-pressed={view === 'table'}
          onClick={() => setView('table')}
        >
          Forecast table
        </Button>
        <Button
          size="sm"
          colorPalette="indigo"
          variant={view === 'chart' ? 'solid' : 'outline'}
          aria-pressed={view === 'chart'}
          disabled={!settings || maxWeek === 0}
          onClick={() => setView('chart')}
        >
          Week-by-week chart
        </Button>
        <Button
          size="sm"
          variant="plain"
          aria-pressed={view === 'advanced'}
          onClick={() => {
            setAdvancedOpened(true);
            setView('advanced');
          }}
        >
          Advanced
        </Button>
      </Flex>
      {inspectedRow && settings && (
        <button
          type="button"
          className="analytics-detail-navigation forecast-detail-navigation"
          ref={trigger}
          aria-controls={detailId}
          onClick={openDetail}
        >
          View selected team details
        </button>
      )}
      <div className="forecast-split-layout">
        <div className="forecast-main-pane">
          <div
            hidden={view === 'advanced'}
            className={
              view === 'table' && displayMode === 'table' ? 'analytics-heading-export' : undefined
            }
          >
            <Heading as="h2" size="lg" mb={1} className="analytics-heading-export-title">
              Playoff outlook
            </Heading>
            <Text fontSize="xs" color="fg.muted" mb={3}>
              Qualification, bye, and round-by-round advancement from the selected cutoff week.
            </Text>
            {view === 'table' && settings && maxWeek > 0 && (
              <Flex
                align="center"
                justify="space-between"
                gap={3}
                flexWrap="wrap"
                mb={3}
                className="forecast-Control-bar"
              >
                <Field.Root
                  orientation="horizontal"
                  width="auto"
                  alignItems="center"
                  gap={2}
                  className="forecast-cutoff-field"
                >
                  <Field.Label mb={0} fontSize="xs" color="fg.muted" whiteSpace="nowrap">
                    Forecast through week
                  </Field.Label>
                  <NativeSelect.Root size="sm" width="auto" minW="90px">
                    <NativeSelect.Field
                      value={cutoff}
                      onChange={(e) => setSelected(Number(e.target.value))}
                    >
                      {Array.from({ length: maxWeek }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
                <Flex
                  as="fieldset"
                  aria-label="Forecast display mode"
                  gap={2}
                  border="0"
                  p="0"
                  flexWrap="wrap"
                >
                  <Button
                    size="sm"
                    colorPalette="indigo"
                    variant={displayMode === 'table' ? 'solid' : 'outline'}
                    aria-pressed={displayMode === 'table'}
                    onClick={() => setDisplayMode('table')}
                  >
                    Table view
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="indigo"
                    variant={displayMode === 'histogram' ? 'solid' : 'outline'}
                    aria-pressed={displayMode === 'histogram'}
                    onClick={() => setDisplayMode('histogram')}
                  >
                    Histogram mode
                  </Button>
                </Flex>
              </Flex>
            )}
            {pending ? (
              <Text as="output">Calculating playoff forecast…</Text>
            ) : error ? (
              <Text role="alert">{error}</Text>
            ) : view === 'chart' && settings && maxWeek > 0 && forecast?.reason ? (
              <PlayoffTimeline
                data={data}
                settings={settings}
                maxWeek={maxWeek}
                metric={metric}
                onMetricChange={setMetric}
              />
            ) : !forecast || forecast.reason ? (
              <Text>
                {forecast?.reason ||
                  'Playoff settings are unavailable for this league. No probabilities have been inferred.'}
              </Text>
            ) : (
              <>
                {forecast.throughWeek <= 2 && (
                  <Text role="note" mb={3} fontWeight="bold">
                    Early-season estimate: only {forecast.throughWeek} completed scoring week
                    {forecast.throughWeek === 1 ? '' : 's'} informs team strength. Heavy
                    league-average weighting limits overreaction, but these probabilities are
                    especially uncertain and can move sharply as more results arrive.
                  </Text>
                )}
                <Box mb={4} className="forecast-method">
                  <button
                    type="button"
                    className="forecast-method-trigger"
                    aria-label="Forecast assumptions and projection coverage"
                    aria-expanded={assumptionsOpen}
                    aria-controls={assumptionsId}
                    onClick={() => setAssumptionsOpen(!assumptionsOpen)}
                  >
                    Forecast assumptions and projection coverage
                  </button>
                  <DisclosureMotion id={assumptionsId} open={assumptionsOpen}>
                    <Text mb={3}>
                      {forecast.simulations.toLocaleString()} simulations{' '}
                      {view === 'chart'
                        ? 'at each completed regular-season week'
                        : `using scores through week ${forecast.throughWeek}`}
                      . {settings!.playoffTeams} playoff places; regular season ends week{' '}
                      {settings!.regularSeasonEnd}. All percentages are unconditional chances from
                      their cutoff, not chances conditional on reaching a round. Projected record
                      averages final regular-season wins and losses across simulations. Byes count
                      as advancement. Earn bye is the unconditional chance of a top-two seed in a
                      six-team bracket.
                    </Text>
                    <Text mb={3} fontWeight={forecast.projection.used ? 'bold' : 'normal'}>
                      Projection mode: {forecast.projection.note}
                    </Text>
                    <Text mb={3}>
                      Known schedule: {forecast.schedule.knownWeeks} of{' '}
                      {forecast.schedule.remainingWeeks} remaining regular-season weeks. Missing
                      weeks use random remaining opponents.
                    </Text>
                    {forecast.projection.used && data.playoffProjection && (
                      <Text mb={3}>
                        Availability:{' '}
                        {data.playoffProjection.availabilityChecked
                          ? `${data.playoffProjection.unavailablePlayers || 0} confirmed unavailable players excluded; ${data.playoffProjection.uncertainPlayers || 0} questionable/doubtful rostered players retain provider estimates.`
                          : 'Provider injury status was unavailable; projection estimates alone are used.'}{' '}
                        No extra injury discount is added to provider estimates.
                        {data.playoffProjection.weekly &&
                          ' Current injury labels apply only to the next week; later weeks use their own provider estimates and scheduled byes. Current roster ownership is held fixed.'}
                      </Text>
                    )}
                    {forecast.projection.used && forecast.projection.weeks && (
                      <Box as="details" mb={3}>
                        <summary>Weekly lineup projection coverage</summary>
                        <DataTable
                          label="Weekly lineup projection coverage"
                          data={forecast.projection.weeks}
                          getRowId={(row) => String(row.week)}
                          columns={[
                            {
                              id: 'week',
                              header: 'Week',
                              value: (row) => row.week,
                              cell: (row) => row.week,
                              rowHeader: true,
                            },
                            {
                              id: 'teams',
                              header: 'Projected teams',
                              value: (row) => row.projectedTeams,
                              cell: (row) => `${row.projectedTeams} of ${data.teams.length}`,
                            },
                            {
                              id: 'fallback',
                              header: 'Historical fallback teams',
                              value: (row) => data.teams.length - row.projectedTeams,
                              cell: (row) => data.teams.length - row.projectedTeams,
                            },
                          ]}
                        />
                      </Box>
                    )}
                  </DisclosureMotion>
                </Box>
                {data.completedWeek > settings!.regularSeasonEnd && (
                  <Text mb={3} fontWeight="bold">
                    Retrospective pre-playoff forecast: actual postseason results are excluded.
                  </Text>
                )}
                {view === 'chart' ? (
                  <PlayoffTimeline
                    data={data}
                    settings={settings!}
                    maxWeek={maxWeek}
                    metric={metric}
                    onMetricChange={setMetric}
                  />
                ) : (
                  <>
                    {displayMode === 'histogram' && (
                      <>
                        <Text fontSize="xs" mb={3}>
                          Final regular-season win frequencies from the same{' '}
                          {forecast.simulations.toLocaleString()} simulations. Ties count as half a
                          win. Playoff seed frequencies include a separate did-not-qualify bin; no
                          distribution is inferred from average wins. Bars scale to each team's most
                          frequent win total.
                        </Text>
                        <div
                          className="forecast-histogram-grid"
                          aria-label="Simulated win distributions"
                        >
                          {sortedRows.map((row) => (
                            <article key={row.teamId} className="forecast-histogram-row">
                              <button
                                type="button"
                                className="forecast-team-link"
                                aria-pressed={inspectedRow?.teamId === row.teamId}
                                onClick={() => setSelectedTeamId(row.teamId)}
                              >
                                {row.teamName}
                              </button>
                              <Text fontSize="xs" my={2}>
                                {row.projectedWins.toFixed(1)} projected wins ·{' '}
                                {percent(row.playoff)} make playoffs
                              </Text>
                              {row.winDistribution?.length ? (
                                <>
                                  <section
                                    className="forecast-histogram-scroll"
                                    tabIndex={0}
                                    aria-label={`${row.teamName} win frequency bars`}
                                  >
                                    <div
                                      className="forecast-histogram-bins"
                                      aria-label={`${row.teamName} final wins`}
                                    >
                                      {row.winDistribution.map((bin) => (
                                        <div
                                          key={bin.wins}
                                          className="forecast-histogram-bin"
                                          aria-label={`${bin.wins} wins: ${percent(bin.count / forecast.simulations)}, ${bin.count} simulations`}
                                        >
                                          <small>{percent(bin.count / forecast.simulations)}</small>
                                          <span
                                            style={{
                                              height: `${(bin.count / Math.max(...row.winDistribution!.map((value) => value.count))) * 90}px`,
                                            }}
                                          />
                                          <small>{bin.wins}W</small>
                                        </div>
                                      ))}
                                    </div>
                                  </section>
                                  <details className="forecast-distribution-values">
                                    <summary>
                                      Exact win and seed frequencies for {row.teamName}
                                    </summary>
                                    <DataTable
                                      label={`${row.teamName} win distribution`}
                                      data={row.winDistribution}
                                      getRowId={(bin) => String(bin.wins)}
                                      columns={[
                                        {
                                          id: 'wins',
                                          header: 'Final wins',
                                          value: (bin) => bin.wins,
                                          cell: (bin) => bin.wins,
                                          rowHeader: true,
                                        },
                                        {
                                          id: 'count',
                                          header: 'Simulation count',
                                          value: (bin) => bin.count,
                                          cell: (bin) => bin.count,
                                        },
                                        {
                                          id: 'probability',
                                          header: 'Probability',
                                          value: (bin) => bin.count / forecast.simulations,
                                          cell: (bin) => percent(bin.count / forecast.simulations),
                                        },
                                      ]}
                                    />
                                    {row.seedDistribution ? (
                                      <DataTable
                                        label={`${row.teamName} playoff seed distribution`}
                                        data={row.seedDistribution}
                                        getRowId={(bin) => String(bin.seed)}
                                        columns={[
                                          {
                                            id: 'seed',
                                            header: 'Playoff seed',
                                            value: (bin) => bin.seed,
                                            cell: (bin) =>
                                              bin.seed === 0 ? 'Did not qualify' : `#${bin.seed}`,
                                            rowHeader: true,
                                          },
                                          {
                                            id: 'count',
                                            header: 'Simulation count',
                                            value: (bin) => bin.count,
                                            cell: (bin) => bin.count,
                                          },
                                          {
                                            id: 'probability',
                                            header: 'Probability',
                                            value: (bin) => bin.count / forecast.simulations,
                                            cell: (bin) =>
                                              percent(bin.count / forecast.simulations),
                                          },
                                        ]}
                                      />
                                    ) : (
                                      <Text>
                                        Seed frequencies are unavailable in this saved forecast.
                                      </Text>
                                    )}
                                  </details>
                                </>
                              ) : (
                                <Text>
                                  Win frequencies are unavailable in this saved forecast. Use Table
                                  view for its recorded probabilities.
                                </Text>
                              )}
                            </article>
                          ))}
                        </div>
                      </>
                    )}
                    <Box
                      overflowX="auto"
                      hidden={displayMode !== 'table'}
                      className="analytics-heading-export-table"
                    >
                      <DataTable
                        label="Playoff probabilities"
                        data={forecast.rows}
                        getRowId={(r) => r.teamId}
                        initialSorting={[{ id: 'playoff', desc: true }]}
                        columns={[
                          {
                            id: 'team',
                            header: 'Team',
                            value: (r) => r.teamName,
                            rowHeader: true,
                            cell: (r) => (
                              <button
                                type="button"
                                className="forecast-team-link"
                                aria-pressed={inspectedRow?.teamId === r.teamId}
                                onClick={() => setSelectedTeamId(r.teamId)}
                              >
                                {r.teamName}
                              </button>
                            ),
                          },
                          {
                            id: 'record',
                            header: 'Projected record',
                            value: (r) => r.projectedWins,
                            cell: (r) =>
                              `${r.projectedWins.toFixed(1)}-${(settings!.regularSeasonEnd - r.projectedWins).toFixed(1)}`,
                          },
                          {
                            id: 'playoff',
                            header: 'Make playoffs',
                            value: (r) => r.playoff,
                            cell: (r) => percent(r.playoff),
                          },
                          ...(settings!.playoffTeams === 6
                            ? [
                                {
                                  id: 'bye',
                                  header: 'Earn bye',
                                  value: (row: (typeof forecast.rows)[number]) => row.bye,
                                  cell: (row: (typeof forecast.rows)[number]) => percent(row.bye),
                                },
                              ]
                            : []),
                          ...forecast.rounds.map((name, i) => ({
                            id: `round-${i}`,
                            header: name,
                            value: (r: (typeof forecast.rows)[number]) => r.advance[i],
                            cell: (r: (typeof forecast.rows)[number]) => percent(r.advance[i]),
                          })),
                        ]}
                      />
                    </Box>
                  </>
                )}
                <Text fontSize="xs" color="fg.muted" mt={3}>
                  {describePlayoffRules(settings?.rules)} Published remaining opponents are used
                  when available. Future roster changes and commissioner overrides are not modeled.
                  Current confirmed absences are excluded from next-week projected lineups; injury
                  recovery dates are not predicted.
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={2}>
                  Each simulation draws a plausible team strength and score variance and carries
                  them through future weeks. Weekly scores have heavier tails when data are sparse.
                  This represents uncertainty about scoring ability; future injuries, roster changes
                  and player correlations are not predicted. Simulation noise is at most about ±
                  {(forecast.samplingMargin * 100).toFixed(2)} percentage points at 95% for each
                  estimate under this model; real-world uncertainty is larger. 0% and 100%
                  simulation results are not official elimination or clinching claims.
                </Text>
              </>
            )}
          </div>
          <div hidden={view !== 'advanced'} className="forecast-advanced-pane">
            {advancedOpened && advanced?.(view === 'advanced')}
            {forecast?.validation && (
              <Box mt={6}>
                <Heading as="h3" size="md" mb={2}>
                  Historical forecast accuracy
                </Heading>
                <Text mb={3}>
                  Each past game is predicted using only earlier scores, starting after two
                  completed weeks. This checks the historical scoring model, not today’s player
                  projections, injury adjustments or playoff qualification odds. Small samples are
                  inconclusive.
                </Text>
                {forecast.validation.games ? (
                  <>
                    <Text mb={3}>
                      {forecast.validation.games} held-out games. Brier score:{' '}
                      {forecast.validation.brier!.toFixed(3)} (50/50 baseline:{' '}
                      {forecast.validation.baselineBrier.toFixed(3)}). Log loss:{' '}
                      {forecast.validation.logLoss!.toFixed(3)} (baseline:{' '}
                      {forecast.validation.baselineLogLoss.toFixed(3)}). Lower is better for both.
                      {forecast.validation.brier! >= forecast.validation.baselineBrier
                        ? ' The historical model has not beaten the 50/50 baseline on Brier score in this sample.'
                        : ' A better Brier score alone does not establish calibration.'}
                    </Text>
                    <Box overflowX="auto">
                      <DataTable
                        label="Historical forecast reliability"
                        data={forecast.validation.reliability.filter((bin) => bin.count)}
                        getRowId={(bin) => bin.label}
                        columns={[
                          {
                            id: 'range',
                            header: 'Favorite chance',
                            value: (r) => r.label,
                            rowHeader: true,
                            cell: (r) => r.label,
                          },
                          {
                            id: 'games',
                            header: 'Games',
                            value: (r) => r.count,
                            cell: (r) => r.count,
                          },
                          {
                            id: 'predicted',
                            header: 'Mean predicted',
                            value: (r) => r.predicted,
                            cell: (r) => percent(r.predicted),
                          },
                          {
                            id: 'observed',
                            header: 'Actual win rate',
                            value: (r) => r.observed,
                            cell: (r) => percent(r.observed),
                          },
                        ]}
                      />
                    </Box>
                  </>
                ) : (
                  <Text>No eligible held-out games yet.</Text>
                )}
                {!!forecast.validation.skippedTies && (
                  <Text fontSize="sm" mt={2}>
                    {forecast.validation.skippedTies} tied games excluded from binary win
                    diagnostics.
                  </Text>
                )}
              </Box>
            )}
          </div>
        </div>
        {inspectedRow && settings && (
          <aside
            className="forecast-path-inspector"
            aria-label="Selected team path"
            id={detailId}
            ref={detail}
            tabIndex={-1}
          >
            <button type="button" className="analytics-detail-navigation" onClick={returnToReport}>
              Return to forecast view
            </button>
            <Text fontSize="xs" color="fg.muted" mb={1}>
              Selected team path
            </Text>
            <Heading as="h3" size="md" mb={1}>
              {inspectedRow.teamName}
            </Heading>
            <Field.Root mb={3}>
              <Field.Label>Inspect playoff team</Field.Label>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={inspectedRow.teamId}
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                >
                  {data.teams.map((team) => (
                    <option key={team.teamId} value={team.teamId}>
                      {team.teamName}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Text fontSize="xs" color="fg.muted" mb={3}>
              Through week {forecast?.throughWeek}. Forecasts are simulation estimates, not official
              clinching claims.
            </Text>
            <div className="forecast-kv">
              <span>Current record</span>
              <strong>
                {inspectedResults.length
                  ? `${inspectedWins}–${inspectedLosses}${inspectedTies ? `–${inspectedTies}` : ''}`
                  : 'Unavailable'}
              </strong>
            </div>
            <div className="forecast-kv">
              <span>Projected final wins</span>
              <strong>{inspectedRow.projectedWins.toFixed(1)} wins</strong>
            </div>
            <div className="forecast-kv">
              <span>Playoff qualification</span>
              <strong>{percent(inspectedRow.playoff)}</strong>
            </div>
            {settings.playoffTeams === 6 && (
              <div className="forecast-kv">
                <span>First-round bye (Top 2)</span>
                <strong>{percent(inspectedRow.bye)}</strong>
              </div>
            )}
            {forecast?.rounds.map((round, index) => (
              <div className="forecast-kv" key={round}>
                <span>{round}</span>
                <strong>
                  {inspectedRow.advance[index] == null
                    ? 'Unavailable'
                    : percent(inspectedRow.advance[index])}
                </strong>
              </div>
            ))}
            <div className="forecast-kv">
              <span>Bracket & tiebreaker</span>
              <strong>
                {settings.playoffTeams} teams · W{settings.regularSeasonEnd} end
              </strong>
            </div>
            <Text fontSize="xs" mt={3}>
              {describePlayoffRules(settings.rules)}
            </Text>
          </aside>
        )}
      </div>
    </Box>
  );
}
