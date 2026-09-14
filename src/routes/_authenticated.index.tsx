import { logClientError } from '../logging';
import {
  Box,
  Button,
  Flex,
  Heading,
  NativeSelect,
  Text,
  chakra,
  Field,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { createFileRoute, Link, useBlocker } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '../auth/session';
import { errorMessage } from '../api/client';
import { RankingEditor, type EditorHandle } from '../components/RankingEditor';
import { useLiveQuery } from '@tanstack/react-db';
import { defaultSeason } from '../util/rankings';
import { safeWeek, weekChoices, type WeekChoice } from '../week-options';
import {
  readStudioSelection,
  rememberStudioSelection,
  resolveStudioSelection,
  validateStudioSearch,
} from '../studio-selection';

export const Route = createFileRoute('/_authenticated/')({
  validateSearch: validateStudioSearch,
  component: RankingsPage,
});

function RankingsPage() {
  const api = useApi();
  const { leagueId: searchLeagueId, year: searchYear, week: searchWeek } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: leagues = [] } = useLiveQuery({
    query: (q) =>
      q.from({ league: api.leagueCollection }).orderBy(({ league }) => league.leagueName, 'asc'),
  });
  const [selected, setSelected] = useState('');
  const [year, setYear] = useState(defaultSeason);
  const [week, setWeek] = useState(1);
  const weekRef = useRef(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [switching, setSwitching] = useState(false);
  const [schedule, setSchedule] = useState<{
    leagueId: string;
    year: number;
    choices: WeekChoice[];
    note: string;
    adjustedFrom?: number;
  }>();
  const [scheduleError, setScheduleError] = useState('');
  const editor = useRef<EditorHandle>(null);
  useBlocker({
    shouldBlockFn: async () => {
      try {
        await editor.current?.flush();
        return false;
      } catch (failure) {
        logClientError('_authenticated.index', failure);
        setError(errorMessage(failure));
        return true;
      }
    },
    enableBeforeUnload: false,
  });

  useEffect(() => {
    let cancelled = false;
    api
      .listLeagues()
      .then((entries) => {
        if (cancelled) return;
        const selection = resolveStudioSelection(
          entries,
          { leagueId: searchLeagueId, year: searchYear, week: searchWeek },
          readStudioSelection(api.subject),
        );
        setSelected(selection?.leagueId || '');
        setYear(selection?.year || defaultSeason());
        weekRef.current = selection?.week || 1;
        setWeek(selection?.week || 1);
      })
      .catch((failure) => {
        logClientError('_authenticated.index', failure);
        if (!cancelled) setError(errorMessage(failure));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, retry, searchLeagueId, searchWeek, searchYear]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const applySchedule = (choices: WeekChoice[], note: string) => {
      const currentWeek = weekRef.current;
      const nextWeek = safeWeek(currentWeek, choices);
      setSchedule({
        leagueId: selected,
        year,
        choices,
        note,
        adjustedFrom: nextWeek !== undefined && nextWeek !== currentWeek ? currentWeek : undefined,
      });
      if (nextWeek !== undefined) {
        weekRef.current = nextWeek;
        setWeek(nextWeek);
      }
    };
    Promise.allSettled([api.getLeagueInfo(selected, year), api.getRankings(selected)])
      .then(([infoResult, rankingsResult]) => {
        if (cancelled) return;
        const rankings = rankingsResult.status === 'fulfilled' ? rankingsResult.value : [];
        if (rankingsResult.status === 'rejected')
          logClientError('_authenticated.index.rankings', rankingsResult.reason);
        if (infoResult.status === 'rejected') {
          logClientError('_authenticated.index.schedule', infoResult.reason);
          const choices = weekChoices([], rankings, year);
          if (choices.length) {
            applySchedule(
              choices,
              `The provider’s ${year} schedule is unavailable. Only previously saved editions are shown; choose another season to create a new edition.`,
            );
          } else {
            setSchedule(undefined);
            setScheduleError(
              `The ${year} schedule is unavailable: ${errorMessage(infoResult.reason)} Choose another season or retry after checking the league with its provider.`,
            );
          }
          return;
        }
        const info = infoResult.value;
        const choices = weekChoices(info.validWeeks, rankings, year);
        if (!choices.length) {
          setSchedule(undefined);
          setScheduleError(
            `No supported weeks are available for ${year}. Choose another season or verify the league schedule with the provider.`,
          );
          return;
        }
        applySchedule(choices, info.scheduleNote);
      })
      .catch((failure) => {
        logClientError('_authenticated.index.schedule', failure);
        if (!cancelled) {
          setSchedule(undefined);
          setScheduleError(`The ${year} schedule could not be prepared. Choose another season.`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, selected, year, retry]);

  async function changeSelection(change: () => void) {
    setSwitching(true);
    try {
      await editor.current?.flush();
      setError('');
      setScheduleError('');
      change();
    } catch (failure) {
      logClientError('_authenticated.index', failure);
      setError(errorMessage(failure));
    } finally {
      setSwitching(false);
    }
  }
  const league = leagues.find((entry) => entry.leagueId === selected);
  const activeSchedule =
    schedule?.leagueId === selected && schedule.year === year ? schedule : undefined;
  useEffect(() => {
    if (!activeSchedule) return;
    rememberStudioSelection(api.subject, { leagueId: selected, year, week });
  }, [activeSchedule, api.subject, selected, week, year]);
  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        flexWrap="wrap"
        mt={4}
        mb={6}
        className="page-heading"
      >
        <Box>
          <Text mb={4} className="eyebrow">
            The weekly edition
          </Text>
          <Heading as="h1" size="3xl" mb={4}>
            Power rankings studio
          </Heading>
        </Box>
        <Button asChild variant="outline">
          <Link to="/leagues/manage">Manage leagues</Link>
        </Button>
        <Button asChild colorPalette="indigo">
          <Link to="/leagues/new">Create league</Link>
        </Button>
      </Flex>
      {error && (
        <Box className="notice error" role="alert">
          {error}
          {!leagues.length && (
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setLoading(true);
                setError('');
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </Button>
          )}
        </Box>
      )}
      {loading ? (
        <chakra.output>Loading leagues…</chakra.output>
      ) : league ? (
        <>
          <fieldset className="selection-bar" disabled={switching}>
            <legend className="sr-only">Choose rankings</legend>
            <Field.Root width="auto" minW="120px" gap={2}>
              <Field.Label>League</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={selected}
                  onChange={(event) => {
                    const id = event.target.value;
                    void changeSelection(() => {
                      setSelected(id);
                      const nextYear =
                        leagues.find((entry) => entry.leagueId === id)?.seasonId || defaultSeason();
                      setYear(nextYear);
                      weekRef.current = 1;
                      setWeek(1);
                      void navigate({ search: { leagueId: id, year: nextYear, week: 1 } });
                    });
                  }}
                >
                  {leagues.map((entry) => (
                    <option key={entry.leagueId} value={entry.leagueId}>
                      {entry.leagueName || entry.leagueId}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root width="auto" minW="120px" gap={2}>
              <Field.Label>Season</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={year}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    void changeSelection(() => {
                      setYear(value);
                      weekRef.current = 1;
                      setWeek(1);
                      void navigate({ search: { leagueId: selected, year: value, week: 1 } });
                    });
                  }}
                >
                  {Array.from({ length: 101 }, (_, index) => 2100 - index).map((season) => (
                    <option key={season}>{season}</option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root width="auto" minW="120px" gap={2} disabled={!activeSchedule}>
              <Field.Label>Week</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={week}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    void changeSelection(() => {
                      weekRef.current = value;
                      setWeek(value);
                      void navigate({ search: { leagueId: selected, year, week: value } });
                    });
                  }}
                >
                  {(activeSchedule?.choices || []).map(({ week: value, savedOnly }) => (
                    <option key={value} value={value}>
                      {value}
                      {savedOnly ? ' (saved edition)' : ''}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
          </fieldset>
          {scheduleError ? (
            <Box className="notice error" role="alert">
              {scheduleError}
            </Box>
          ) : activeSchedule ? (
            <>
              <Text fontSize="sm" mb={4}>
                {activeSchedule.note}
                {activeSchedule.choices.some((choice) => choice.savedOnly) &&
                  ' Saved editions outside that schedule remain available and are labeled in the week picker.'}
              </Text>
              {activeSchedule.adjustedFrom !== undefined && (
                <chakra.output className="notice" display="block" mb={4}>
                  Week {activeSchedule.adjustedFrom} is not available for this league season, so the
                  studio moved to week {week}. Choose any other available week above.
                </chakra.output>
              )}
              <RankingEditor
                key={`${selected}-${year}-${week}`}
                ref={editor}
                api={api}
                league={league}
                year={year}
                week={week}
              />
            </>
          ) : (
            <chakra.output>Loading the {year} schedule…</chakra.output>
          )}
        </>
      ) : (
        !error && (
          <Box
            as="section"
            bg="bg"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="border"
            rounded="lg"
            p={{ base: 4, md: 6 }}
            className="panel"
          >
            <Heading as="h2" size="xl" mb={4}>
              Create your first league
            </Heading>
            <Text mb={4}>Connect a Sleeper or ESPN league to start ranking your teams.</Text>
            <ChakraLink asChild>
              <Link to="/leagues/new">Create league</Link>
            </ChakraLink>
          </Box>
        )
      )}
    </>
  );
}
