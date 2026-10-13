import { useId, useState } from 'react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import type { SeasonRecord } from '../../league-summary';
import { CompetitionHistory } from './competition/CompetitionHistory';
import { MomentsHistory } from './moments/MomentsHistory';
import { PersonalitiesHistory } from './personalities/PersonalitiesHistory';

const groups = ['Competition', 'Matchup stories', 'Manager profiles'] as const;

export function HistoryAnalytics({
  records,
  years,
  leagueId,
  shared = false,
  snapshot = false,
}: {
  records: SeasonRecord[];
  years: number[];
  leagueId: string;
  shared?: boolean;
  snapshot?: boolean;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  return (
    <Box as="section" className="history-analytics" mt={8}>
      <Heading as="h2" size="xl" mb={3}>
        Explore the league archive
      </Heading>
      <Text mb={4}>
        Compare rivalries, revisit memorable weeks, and explore the evidence behind manager
        profiles.
      </Text>
      <Flex role="tablist" aria-label="Historical analytics" gap={2} wrap="wrap" mb={5}>
        {groups.map((group, index) => (
          <Button
            key={group}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={index === active}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={index === active ? 0 : -1}
            variant={index === active ? 'solid' : 'outline'}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? groups.length - 1
                    : event.key === 'ArrowRight'
                      ? (index + 1) % groups.length
                      : event.key === 'ArrowLeft'
                        ? (index + groups.length - 1) % groups.length
                        : null;
              if (next === null) return;
              event.preventDefault();
              setActive(next);
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}
          >
            {group}
          </Button>
        ))}
      </Flex>
      {groups.map((group, index) => (
        <Box
          key={group}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={index !== active}
          tabIndex={0}
        >
          {index === 0 && (
            <CompetitionHistory
              records={records}
              years={years}
              leagueId={snapshot ? undefined : leagueId}
              shared={shared}
            />
          )}
          {index === 1 && <MomentsHistory records={records} years={years} leagueId={leagueId} />}
          {index === 2 && (
            <PersonalitiesHistory
              records={records}
              years={years}
              leagueId={leagueId}
              shared={shared}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}
