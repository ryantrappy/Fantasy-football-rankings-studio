import { Box, Button, Field, Flex, Heading, NativeSelect, Text } from '@chakra-ui/react';
import { useState } from 'react';
import type { SeasonInsights } from '../insights';
import { cachedPlayoffForecast } from '../playoff-timeline';
import { DataTable } from './DataTable';
import { PlayoffTimeline } from './PlayoffTimeline';
export function PlayoffForecast({ data }: { data: SeasonInsights }) {
  const settings = data.playoffSettings;
  const maxWeek = Math.min(data.completedWeek, settings?.regularSeasonEnd ?? 0);
  const [selected, setSelected] = useState<number>();
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [metric, setMetric] = useState<'playoff' | 'championship'>('playoff');
  const cutoff = view === 'chart' ? maxWeek : Math.min(selected ?? maxWeek, maxWeek);
  const forecast = settings ? cachedPlayoffForecast(data, settings, cutoff) : undefined;
  const percent = (n: number) => `${(n * 100).toFixed(1)}%`;
  return (
    <Box
      as="section"
      className="panel insight-section"
      bg="bg"
      borderWidth="1px"
      rounded="lg"
      p={{ base: 4, md: 6 }}
    >
      <Heading as="h2" size="xl" mb={4}>
        Playoff outlook
      </Heading>
      <Text mb={3}>
        Model scenario: league-wide seeding by wins, then points; published remaining opponents when
        available; single-week playoff rounds with a fixed bracket. Division rules, median wins,
        reseeding, custom tiebreaks and future roster changes are not modeled. Current confirmed
        absences are excluded from projected lineups; injury recovery dates are not predicted.
      </Text>
      {settings && maxWeek > 0 && (
        <Flex as="fieldset" gap={2} flexWrap="wrap" mb={4} border="0" p="0">
          <Box as="legend" fontWeight="bold" mb={2}>
            View
          </Box>
          <Button
            size="sm"
            colorPalette="green"
            variant={view === 'table' ? 'solid' : 'outline'}
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            Forecast table
          </Button>
          <Button
            size="sm"
            colorPalette="green"
            variant={view === 'chart' ? 'solid' : 'outline'}
            aria-pressed={view === 'chart'}
            onClick={() => setView('chart')}
          >
            Week-by-week chart
          </Button>
        </Flex>
      )}
      {view === 'table' && settings && maxWeek > 0 && (
        <Field.Root mb={4} maxW="xs">
          <Field.Label>Forecast through week</Field.Label>
          <NativeSelect.Root>
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
      )}
      {view === 'chart' && settings && maxWeek > 0 && forecast?.reason ? (
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
          <Text mb={3}>
            {forecast.simulations.toLocaleString()} simulations{' '}
            {view === 'chart'
              ? 'at each completed regular-season week'
              : `using scores through week ${forecast.throughWeek}`}
            . {settings!.playoffTeams} playoff places; regular season ends week{' '}
            {settings!.regularSeasonEnd}. All percentages are unconditional chances from their
            cutoff, not chances conditional on reaching a round. Byes count as advancement.
          </Text>
          {forecast.throughWeek <= 2 && (
            <Text role="note" mb={3} fontWeight="bold">
              Early-season estimate: only {forecast.throughWeek} completed scoring week
              {forecast.throughWeek === 1 ? '' : 's'} informs team strength. Heavy league-average
              weighting limits overreaction, but these probabilities are especially uncertain and
              can move sharply as more results arrive.
            </Text>
          )}
          <Text mb={3} fontWeight={forecast.projection.used ? 'bold' : 'normal'}>
            Projection mode: {forecast.projection.note}
          </Text>
          <Text mb={3}>
            Known schedule: {forecast.schedule.knownWeeks} of {forecast.schedule.remainingWeeks}{' '}
            remaining regular-season weeks. Missing weeks use random remaining opponents.
          </Text>
          {forecast.projection.used && data.playoffProjection && (
            <Text mb={3}>
              Availability:{' '}
              {data.playoffProjection.availabilityChecked
                ? `${data.playoffProjection.unavailablePlayers || 0} confirmed unavailable players excluded; ${data.playoffProjection.uncertainPlayers || 0} questionable/doubtful rostered players retain provider estimates.`
                : 'Provider injury status was unavailable; projection estimates alone are used.'}{' '}
              No extra injury discount is added to provider estimates.
            </Text>
          )}
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
            <Box overflowX="auto">
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
                    cell: (r) => r.teamName,
                  },
                  {
                    id: 'playoff',
                    header: 'Make playoffs',
                    value: (r) => r.playoff,
                    cell: (r) => percent(r.playoff),
                  },
                  ...forecast.rounds.map((name, i) => ({
                    id: `round-${i}`,
                    header: name,
                    value: (r: (typeof forecast.rows)[number]) => r.advance[i],
                    cell: (r: (typeof forecast.rows)[number]) => percent(r.advance[i]),
                  })),
                ]}
              />
            </Box>
          )}
          <Text fontSize="sm" mt={3}>
            Historical estimates pool within-team score variability and allow for uncertainty in
            small samples. Independent normal score distributions are assumed; player correlations
            and long-term changes in team strength are not modeled. Simulation noise is at most
            about ±{(forecast.samplingMargin * 100).toFixed(2)} percentage points at 95% for each
            estimate under this model; real-world uncertainty is larger. 0% and 100% simulation
            results are not official elimination or clinching claims.
          </Text>
          {forecast.validation && (
            <Box mt={6}>
              <Heading as="h3" size="md" mb={2}>
                Historical forecast accuracy
              </Heading>
              <Text mb={3}>
                Each past game is predicted using only earlier scores, starting after two completed
                weeks. This checks the historical scoring model, not today’s player projections,
                injury adjustments or playoff qualification odds. Small samples are inconclusive.
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
                  {forecast.validation.skippedTies} tied games excluded from binary win diagnostics.
                </Text>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
