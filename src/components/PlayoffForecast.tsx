import { Box, Field, Heading, NativeSelect, Text } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import type { SeasonInsights } from '../insights';
import { forecastPlayoffs } from '../playoff-forecast';
import { DataTable } from './DataTable';
export function PlayoffForecast({ data }: { data: SeasonInsights }) {
  const settings = data.playoffSettings;
  const maxWeek = Math.min(data.completedWeek, settings?.regularSeasonEnd ?? 0);
  const [selected, setSelected] = useState<number>();
  const cutoff = Math.min(selected ?? maxWeek, maxWeek);
  const forecast = useMemo(
    () => (settings ? forecastPlayoffs(data, settings, cutoff) : undefined),
    [data, settings, cutoff],
  );
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
        Model scenario: league-wide seeding by wins, then points; random remaining opponents;
        single-week playoff rounds with a fixed bracket. Division rules, median wins, reseeding,
        custom tiebreaks, injuries and roster changes are not modeled.
      </Text>
      {settings && maxWeek > 0 && (
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
      {!forecast || forecast.reason ? (
        <Text>
          {forecast?.reason ||
            'Playoff settings are unavailable for this league. No probabilities have been inferred.'}
        </Text>
      ) : (
        <>
          <Text mb={3}>
            {forecast.simulations.toLocaleString()} simulations using scores through week{' '}
            {forecast.throughWeek}. {settings!.playoffTeams} playoff places; regular season ends
            week {settings!.regularSeasonEnd}. All percentages are unconditional chances from this
            cutoff, not chances conditional on reaching a round. Byes count as advancement.
          </Text>
          {data.completedWeek > settings!.regularSeasonEnd && (
            <Text mb={3} fontWeight="bold">
              Retrospective pre-playoff forecast: actual postseason results are excluded.
            </Text>
          )}
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
          <Text fontSize="sm" mt={3}>
            Estimates use score variability with small samples pulled toward the league average.
            Simulation noise is at most about ±1.4 percentage points at 95% under this model;
            real-world uncertainty is larger. 0% and 100% simulation results are not official
            elimination or clinching claims.
          </Text>
        </>
      )}
    </Box>
  );
}
