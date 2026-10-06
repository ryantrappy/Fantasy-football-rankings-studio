import { Box, Button, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../auth/session';
import type { LiveLeague } from '../live-matchups';
import type { ManagedTeamSelection } from '../types';
import { suggestTrades, tradeTeams, type TradeSuggestion } from '../trade-suggestions';
import { ManagedTeamPicker } from './ManagedTeamPicker';

export function TradeSuggestions({
  league,
  onInspect,
  onSelectionChange,
  refresh = false,
}: {
  league: LiveLeague;
  onInspect: (suggestion: TradeSuggestion) => void;
  onSelectionChange: () => void;
  refresh?: boolean;
}) {
  const api = useApi();
  const [selection, setSelection] = useState<ManagedTeamSelection>();
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    let active = true;
    void api.managedTeam?.get(league.leagueId, league.season, refresh).then(
      (saved) => {
        if (active) setSelection(saved);
      },
      () => {
        if (active)
          setError('Your managed-team selection is unavailable. Refresh rosters to retry.');
      },
    );
    return () => {
      active = false;
    };
  }, [api, league.leagueId, league.season, refresh]);
  const result = useMemo(
    () => (selection ? suggestTrades(league, selection) : undefined),
    [league, selection],
  );
  const managed = tradeTeams(league).find((team) => team.teamId === selection?.teamId);
  const chooseTeam =
    !selection?.teamId ||
    selection.needsReselection ||
    !managed ||
    !selection.teams.some((team) => team.teamId === managed.teamId);
  const owned = tradeTeams(league).flatMap((team) =>
    team.players.filter((player) => player.owned && !player.reserve),
  );
  const sources = [
    ...new Set(
      owned.flatMap(
        (player) =>
          player.projectionSources?.map(
            (source) => `${source.provider} fetched ${source.capturedAt}`,
          ) ?? [],
      ),
    ),
  ];
  return (
    <Box as="section" aria-label="Trade suggestions" borderWidth="1px" rounded="xl" p={5} mb={6}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <Heading as="h2" size="lg">
          Suggested trades{managed ? ` for ${managed.name}` : ''}
        </Heading>
        {selection && !chooseTeam && (
          <Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)}>
            Change my team
          </Button>
        )}
      </Flex>
      <Text mt={2} color="fg.muted">
        Week {league.week} only · {league.season} · {league.leagueName}. These are current-week
        lineup opportunities, not rest-of-season trade values.
      </Text>
      {!api.managedTeam ? (
        <Text mt={3}>Managed-team selection is unavailable.</Text>
      ) : error ? (
        <Text role="alert" mt={3}>
          {error}
        </Text>
      ) : !selection ? (
        <Text mt={3}>Loading your managed team…</Text>
      ) : (
        <>
          {(chooseTeam || editing) && (
            <>
              <Text mt={3}>
                {selection.needsReselection || (selection.teamId && !managed)
                  ? 'Your saved team is no longer available or its manager changed. Choose your team again.'
                  : 'Choose and save your managed team for this league and season.'}
              </Text>
              <ManagedTeamPicker
                api={api.managedTeam}
                leagueId={league.leagueId}
                initialYear={league.season}
                fixedYear={league.season}
                subject={api.subject}
                onSaved={(saved) => {
                  setSelection(saved);
                  setEditing(false);
                  onSelectionChange();
                }}
              />
            </>
          )}
          {result?.reason && !chooseTeam && <Text mt={3}>{result.reason}</Text>}
          {!result?.reason && result?.suggestions.length === 0 && (
            <Text mt={4}>
              No suitable one-for-one trades improve both teams with the available current-week
              data.
            </Text>
          )}
          {!editing &&
            result?.suggestions.map((suggestion, index) => (
              <Box
                as="article"
                key={suggestion.id}
                mt={4}
                p={4}
                borderWidth="1px"
                rounded="lg"
                bg="bg.subtle"
                aria-label={`Suggestion ${index + 1} with ${suggestion.counterpart.name}`}
              >
                <Heading as="h3" size="md">
                  {index + 1}. Send {suggestion.send.name} · Receive {suggestion.receive.name}
                </Heading>
                <Text mt={1}>Trade partner: {suggestion.counterpart.name}</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={3}>
                  {suggestion.sides.map((side, sideIndex) => (
                    <Box key={side.teamId}>
                      <Text fontWeight="semibold">
                        {side.name}: +{side.difference!.toFixed(2)} projected lineup points
                      </Text>
                      <Text fontSize="sm">
                        Best legal lineup before: {side.before!.toFixed(2)} → After:{' '}
                        {side.after!.toFixed(2)}
                      </Text>
                      <Text fontSize="sm" mt={2}>
                        {sideIndex === 0 ? 'Why this helps you' : 'Why they might consider it'}:
                        receiving {sideIndex === 0 ? suggestion.receive.name : suggestion.send.name}{' '}
                        improves the best legal lineup while keeping a complete starting roster.
                      </Text>
                      <Text fontSize="sm" mt={2}>
                        Position coverage before:{' '}
                        {side.beforeCoverage
                          .map((entry) => `${entry.position} ${entry.count}`)
                          .join(' · ')}
                      </Text>
                      <Text fontSize="sm">
                        Position coverage after:{' '}
                        {side.coverage
                          .map((entry) => `${entry.position} ${entry.count}`)
                          .join(' · ')}
                      </Text>
                      {side.notices.map((notice) => (
                        <Text key={notice} fontSize="sm" mt={2}>
                          {notice}
                        </Text>
                      ))}
                    </Box>
                  ))}
                </SimpleGrid>
                <Box as="details" fontSize="sm" mt={3}>
                  <summary>Player projection inputs</summary>
                  {[suggestion.send, suggestion.receive].map((player) => (
                    <Box key={player.id} mt={2}>
                      <Text>
                        {player.name} · {player.position} · Week {league.week}:{' '}
                        {player.projectedPoints!.toFixed(2)} points ·{' '}
                        {player.projectionMethod ?? 'native'} projection
                      </Text>
                      <Text>
                        Status at snapshot: {player.availability || 'No flagged injury'} · No bye ·
                        Game not locked
                      </Text>
                      {player.projectionSources?.length ? (
                        player.projectionSources.map((source) => (
                          <Text key={source.provider}>
                            {source.provider}: {source.points.toFixed(2)} points · fetched{' '}
                            {source.capturedAt}
                          </Text>
                        ))
                      ) : (
                        <Text>
                          Native {league.provider} estimate · fetched{' '}
                          {league.capturedAt ?? 'time unavailable'}
                        </Text>
                      )}
                      {player.projectionNote && <Text>{player.projectionNote}</Text>}
                    </Box>
                  ))}
                </Box>
                <Button mt={3} colorPalette="indigo" onClick={() => onInspect(suggestion)}>
                  Inspect trade with {suggestion.counterpart.name}
                </Button>
              </Box>
            ))}
        </>
      )}
      <Text mt={4} fontSize="sm" color="fg.muted">
        Ranked by the smaller of both teams’ lineup gains, then their combined gain; up to five
        offers. A projected benefit does not predict the other manager’s willingness to accept.
        Inspecting an offer changes only this hypothetical scenario.
      </Text>
      <Box as="details" mt={3} fontSize="sm" color="fg.muted">
        <summary>Suggestion sources, coverage and eligibility limits</summary>
        <Text mt={2}>
          Roster snapshot: {league.capturedAt ?? 'Unavailable'}. Projections use this league’s
          scoring and configured starting slots. Refresh rosters to update ownership and forecasts.
        </Text>
        <Text mt={2}>
          Active owned projection coverage:{' '}
          {owned.filter((player) => Number.isFinite(player.projectedPoints)).length}/{owned.length}{' '}
          players. {result?.evaluated ?? 0} complementary exchanges evaluated after screening
          incoming lineup benefit.
        </Text>
        {sources.length ? (
          sources.map((source) => (
            <Text key={source} mt={2}>
              {source}
            </Text>
          ))
        ) : (
          <Text mt={2}>
            Native {league.provider} projections; separate source freshness is unavailable.
          </Text>
        )}
        {result?.notices.map((notice) => (
          <Text key={notice} mt={2}>
            {notice}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
