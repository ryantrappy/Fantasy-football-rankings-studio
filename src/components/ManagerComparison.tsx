import { Box, Field, Flex, Heading, NativeSelect, SimpleGrid, Text } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import type { SeasonRecord } from '../league-summary';
import { compareManagers, managerComparisonKey } from '../manager-comparison';

const number = (value: number | null) =>
  value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 1 });

export function ManagerComparison({
  records,
  years,
}: {
  records: SeasonRecord[];
  years: number[];
}) {
  const managers = useMemo(() => {
    const found = new Map<string, { key: string; managerName: string; teamName: string }>();
    for (const record of [...records].sort((a, b) => a.year - b.year))
      for (const team of record.data.teams) {
        const key = managerComparisonKey(team, record.year);
        found.set(key, {
          key,
          managerName: team.managerName,
          teamName: team.teamName,
        });
      }
    return [...found.values()].sort((a, b) => a.managerName.localeCompare(b.managerName));
  }, [records]);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [fromYear, setFromYear] = useState('');
  const [throughYear, setThroughYear] = useState('');
  const orderedYears = [...years].sort((a, b) => a - b);
  const validFrom = years.includes(Number(fromYear)) ? Number(fromYear) : orderedYears[0];
  const validThrough = years.includes(Number(throughYear))
    ? Number(throughYear)
    : orderedYears.at(-1);
  const comparisonYears = years.filter(
    (year) => year >= (validFrom ?? year) && year <= (validThrough ?? year),
  );
  const validFirst = managers.some((manager) => manager.key === first) ? first : '';
  const validSecond = managers.some((manager) => manager.key === second) ? second : '';
  const comparison =
    validFirst && validSecond && validFirst !== validSecond
      ? compareManagers(records, comparisonYears, [validFirst, validSecond])
      : null;

  return (
    <Box
      as="section"
      bg="bg"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="border"
      rounded="lg"
      p={{ base: 4, md: 6 }}
      className="panel insight-section"
    >
      <Text mb={4} className="eyebrow">
        Side by side
      </Text>
      <Heading as="h2" size="xl" mb={4}>
        Compare two managers
      </Heading>
      <Text mb={4}>
        Scoring uses only completed weeks observed for both selected ownership groups. Season
        achievements use only years where both groups appear, with unknown results shown in their
        coverage.
      </Text>
      {managers.length < 2 ? (
        <Text mb={4}>
          Load seasons containing at least two manager ownership groups to compare them.
        </Text>
      ) : (
        <>
          <Flex gap={4} flexWrap="wrap" mb={6}>
            {[
              { label: 'First manager', value: validFirst, other: validSecond, set: setFirst },
              { label: 'Second manager', value: validSecond, other: validFirst, set: setSecond },
            ].map((control) => (
              <Field.Root key={control.label} width="auto" minW="220px" gap={2}>
                <Field.Label>{control.label}</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={control.value}
                    onChange={(event) => control.set(event.target.value)}
                  >
                    <option value="">Choose a manager</option>
                    {managers.map((manager) => (
                      <option
                        key={manager.key}
                        value={manager.key}
                        disabled={manager.key === control.other}
                      >
                        {manager.managerName} · {manager.teamName} ownership group
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            ))}
          </Flex>
          <Flex gap={4} flexWrap="wrap" mb={6}>
            <Field.Root width="auto" minW="160px" gap={2}>
              <Field.Label>From season</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={validFrom ?? ''}
                  onChange={(event) => setFromYear(event.target.value)}
                >
                  {orderedYears.map((year) => (
                    <option key={year} value={year} disabled={year > (validThrough ?? year)}>
                      {year}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root width="auto" minW="160px" gap={2}>
              <Field.Label>Through season</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={validThrough ?? ''}
                  onChange={(event) => setThroughYear(event.target.value)}
                >
                  {orderedYears.map((year) => (
                    <option key={year} value={year} disabled={year < (validFrom ?? year)}>
                      {year}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
          </Flex>
          {!comparison ? (
            <Text mb={4}>Choose two distinct managers to see a paired comparison.</Text>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={6}>
                {comparison.summaries.map((summary) => (
                  <Box as="article" key={summary.key} borderWidth="1px" rounded="md" p={4}>
                    <Heading as="h3" size="lg" mb={1}>
                      {summary.managerName}
                    </Heading>
                    <Text mb={4}>{summary.teamName} ownership group</Text>
                    <Text mb={2}>
                      <strong>{number(summary.averagePoints)}</strong> average points ·{' '}
                      {summary.weeks} shared weeks
                    </Text>
                    <Text mb={2}>
                      <strong>{number(summary.averageVsMedian)}%</strong> average vs. league median
                      · {summary.aboveMedian} of {summary.weeks} weeks above median
                    </Text>
                    <Text mb={2}>
                      Playoffs: <strong>{summary.playoffs}</strong> · {summary.playoffSeasons}{' '}
                      shared seasons known
                    </Text>
                    <Text mb={2}>
                      Championships: <strong>{summary.championships}</strong> ·{' '}
                      {summary.championshipSeasons} shared seasons known
                    </Text>
                    <Text mb={0}>
                      Average finish:{' '}
                      <strong>
                        {number(
                          summary.finishSeasons
                            ? summary.finishTotal / summary.finishSeasons
                            : null,
                        )}
                      </strong>{' '}
                      · {summary.finishSeasons} shared seasons known
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
              <Heading as="h3" size="md" mb={3}>
                Selected-season coverage
              </Heading>
              <ul>
                {comparison.seasons.map((season) => (
                  <li key={season.year}>
                    <strong>{season.year}:</strong> {season.description}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Box>
  );
}
