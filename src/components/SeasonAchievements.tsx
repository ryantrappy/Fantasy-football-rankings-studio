import { Box, Heading, Text } from '@chakra-ui/react';
import { DataTable } from './DataTable';
import { average, type ManagerSummary } from '../league-summary';
export function SeasonAchievements({ rows }: { rows: ManagerSummary[] }) {
  const count = (value: number, measured: number) => (measured ? value : null);
  const cell = (value: number, measured: number, seasons: number) => (
    <>
      {measured ? value : '—'}
      <small>
        {measured} / {seasons} seasons known
      </small>
    </>
  );
  return (
    <Box bg="bg" borderWidth="1px" rounded="lg" p={{ base: 4, md: 6 }} className="panel">
      <Heading as="h3" size="lg" mb={4}>
        Playoffs and final finishes
      </Heading>
      <Text mb={4}>
        Confirmed results across the selected seasons. Average finish uses only known final
        placements (1 is best). Ongoing seasons and unavailable results are excluded; coverage is
        shown for each statistic.
      </Text>
      <Box overflowX="auto">
        <DataTable
          label="Playoffs and final finishes"
          data={rows}
          getRowId={(r) => r.key}
          initialSorting={[{ id: 'titles', desc: true }]}
          columns={[
            {
              id: 'manager',
              header: 'Manager / latest team',
              value: (r) => r.managerName,
              rowHeader: true,
              cell: (r) => (
                <>
                  {r.managerName}
                  <small>{r.teamName}</small>
                </>
              ),
            },
            {
              id: 'playoffs',
              header: 'Playoff appearances',
              value: (r) => count(r.playoffAppearances, r.playoffSeasons),
              cell: (r) => cell(r.playoffAppearances, r.playoffSeasons, r.seasons.length),
            },
            {
              id: 'titles',
              header: 'Championships',
              value: (r) => count(r.championships, r.championshipSeasons),
              cell: (r) => cell(r.championships, r.championshipSeasons, r.seasons.length),
            },
            {
              id: 'last',
              header: 'Last-place finishes',
              value: (r) => count(r.lastPlaces, r.lastPlaceSeasons),
              cell: (r) => cell(r.lastPlaces, r.lastPlaceSeasons, r.seasons.length),
            },
            {
              id: 'finish',
              header: 'Average finish',
              value: (r) => average(r.finishTotal, r.finishSeasons),
              cell: (r) => (
                <>
                  {average(r.finishTotal, r.finishSeasons)?.toFixed(1) ?? '—'}
                  <small>
                    {r.finishSeasons} / {r.seasons.length} seasons known
                  </small>
                </>
              ),
            },
          ]}
        />
      </Box>
      <Text mt={4}>
        Sleeper uses resolved bracket placements, including identifiable consolation or toilet-bowl
        results. ESPN uses final provider ranks. Unsupported, incomplete or missing brackets stay
        unknown; regular-season standings are not substituted for final finish.
      </Text>
    </Box>
  );
}
