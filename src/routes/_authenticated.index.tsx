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

export const Route = createFileRoute('/_authenticated/')({ component: RankingsPage });

function RankingsPage() {
  const api = useApi();
  const { data: leagues = [] } = useLiveQuery({
    query: (q) =>
      q.from({ league: api.leagueCollection }).orderBy(({ league }) => league.leagueName, 'asc'),
  });
  const [selected, setSelected] = useState('');
  const [year, setYear] = useState(defaultSeason);
  const [week, setWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [switching, setSwitching] = useState(false);
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
        setSelected(entries[0]?.leagueId || '');
        setYear(entries[0]?.seasonId || defaultSeason());
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
  }, [api, retry]);

  async function changeSelection(change: () => void) {
    setSwitching(true);
    try {
      await editor.current?.flush();
      setError('');
      change();
    } catch (failure) {
      logClientError('_authenticated.index', failure);
      setError(errorMessage(failure));
    } finally {
      setSwitching(false);
    }
  }
  const league = leagues.find((entry) => entry.leagueId === selected);
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
                      setYear(
                        leagues.find((entry) => entry.leagueId === id)?.seasonId || defaultSeason(),
                      );
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
                    void changeSelection(() => setYear(value));
                  }}
                >
                  {Array.from({ length: 101 }, (_, index) => 2100 - index).map((season) => (
                    <option key={season}>{season}</option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root width="auto" minW="120px" gap={2}>
              <Field.Label>Week</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={week}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    void changeSelection(() => setWeek(value));
                  }}
                >
                  {Array.from({ length: 18 }, (_, index) => index + 1).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
          </fieldset>
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
