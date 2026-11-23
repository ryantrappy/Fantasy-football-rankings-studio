import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  NativeSelect,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApi } from '../auth/session';
import type { League } from '../types';
import { buildBootstrapLeague } from '../season-bootstrap-input';
import { runSeasonBootstrap } from '../season-bootstrap-client';
import {
  bootstrapModelVersion,
  type BootstrapOptions,
  type BootstrapResult,
} from '../season-bootstrap';
import { DataTable, ReportExportScope, type DataColumn } from './DataTable';
import { PageHeading } from './PageHeading';

type Search = { leagueId?: string; year?: number };
type Inputs = ReturnType<typeof buildBootstrapLeague>;
type Api = ReturnType<typeof useApi>;
type BootstrapRow = BootstrapResult['teams'][number];

const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
const percent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;
const number = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 1 });
const signed = (value: number) => `${value > 0 ? '+' : ''}${number(value)}`;
const numeric = (
  id: keyof BootstrapRow & ('wins' | 'finish' | 'points' | 'pointsAgainst' | 'optimalPoints'),
  header: string,
): DataColumn<BootstrapRow> => ({
  id,
  header,
  value: (row) => row[id],
  cell: (row) => number(row[id]),
});

function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Field.Root minW={0} disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <NativeSelect.Root size="sm">
        <NativeSelect.Field value={value} onChange={(event) => onChange(event.target.value)}>
          {children}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );
}

export function SeasonBootstrapPage({
  search,
  select,
}: {
  search: Search;
  select: (search: Search) => void;
}) {
  const api = useApi();
  const [list, setList] = useState<{ api: Api; leagues?: League[]; error?: string }>();
  useEffect(() => {
    let active = true;
    void api.listLeagues().then(
      (leagues) => {
        if (active) setList({ api, leagues: leagues.filter((league) => !league.deleting) });
      },
      () => {
        if (active) setList({ api, error: 'Could not load your leagues. Try reloading the page.' });
      },
    );
    return () => {
      active = false;
    };
  }, [api]);
  const current = list?.api === api ? list : undefined;
  const leagues = current?.leagues ?? [];
  const league = search.leagueId
    ? leagues.find((entry) => entry.leagueId === search.leagueId)
    : leagues[0];

  return (
    <>
      <PageHeading
        title="Season simulator"
        description="Resample player scoring and see how today’s rosters might finish across repeated regular seasons."
      />
      {current?.error && <Text role="alert">{current.error}</Text>}
      {!current && <Text as="output">Loading leagues…</Text>}
      {current?.leagues && leagues.length === 0 && (
        <Text>Connect a Sleeper or ESPN league to simulate its season.</Text>
      )}
      {leagues.length > 0 && (
        <Box maxW="lg" mb={4}>
          <SelectField
            label="League"
            value={league?.leagueId ?? ''}
            onChange={(id) => select({ leagueId: id })}
          >
            {!league && <option value="">Choose a league</option>}
            {leagues.map(({ leagueId, leagueName }) => (
              <option key={leagueId} value={leagueId}>
                {leagueName}
              </option>
            ))}
          </SelectField>
        </Box>
      )}
      {league && (
        <LeagueBootstrap
          key={league.leagueId}
          league={league}
          year={search.year ?? league.seasonId}
          select={select}
        />
      )}
    </>
  );
}

function LeagueBootstrap({
  league,
  year,
  select,
}: {
  league: League;
  year: number;
  select: (search: Search) => void;
}) {
  const api = useApi();
  const [seasons, setSeasons] = useState<{ api: Api; years: number[] }>();
  const leagueId = league.leagueId;
  useEffect(() => {
    let active = true;
    void api.getLeagueSeasons(leagueId).then(
      ({ years }) => {
        if (active) setSeasons({ api, years });
      },
      () => {
        if (active) setSeasons({ api, years: [] });
      },
    );
    return () => {
      active = false;
    };
  }, [api, leagueId]);
  const years = [
    ...new Set([league.seasonId, year, ...(seasons?.api === api ? seasons.years : [])]),
  ].sort((a, b) => b - a);

  return (
    <>
      <Box maxW="lg" mb={4}>
        <SelectField
          label="Scoring history season"
          value={year}
          onChange={(value) => select({ leagueId, year: Number(value) })}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>
      </Box>
      <BootstrapInput key={year} leagueId={leagueId} leagueName={league.leagueName} year={year} />
    </>
  );
}

function BootstrapInput({
  leagueId,
  leagueName,
  year,
}: {
  leagueId: string;
  leagueName: string;
  year: number;
}) {
  const api = useApi();
  const [loaded, setLoaded] = useState<{
    api: Api;
    inputs?: Inputs;
    rosterSeason?: number;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.all([
      api.getInsights(leagueId, year, retry > 0),
      api.getLiveLeague(leagueId, retry > 0),
    ])
      .then(async ([report, live]) => {
        if (!active) return;
        if (live.leagueId !== leagueId)
          throw new Error('The roster snapshot does not match the selected league.');
        const expectedTeamIds =
          live.season !== year
            ? (await api.getTeams(leagueId, live.season, live.week)).map(({ teamId }) => teamId)
            : undefined;
        if (active) {
          setLoaded({
            api,
            inputs: buildBootstrapLeague(report, live, year, expectedTeamIds),
            rosterSeason: live.season,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) setLoaded({ api, error: message(error, 'Could not load simulation inputs.') });
      });
    return () => {
      active = false;
    };
  }, [api, leagueId, year, retry]);

  if (loaded?.api !== api)
    return <Text as="output">Loading league rosters and scoring history…</Text>;
  if (!loaded.inputs)
    return (
      <Box>
        <Text role="alert" mb={3}>
          {loaded.error}
        </Text>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLoaded(undefined);
            setRetry(retry + 1);
          }}
        >
          Retry inputs
        </Button>
      </Box>
    );
  return (
    <BootstrapWorkbench
      inputs={loaded.inputs}
      historyYear={year}
      rosterSeason={loaded.rosterSeason!}
      leagueName={leagueName}
    />
  );
}

function BootstrapWorkbench({
  inputs,
  historyYear,
  rosterSeason,
  leagueName,
}: {
  inputs: Inputs;
  historyYear: number;
  rosterSeason: number;
  leagueName: string;
}) {
  const { league } = inputs;
  const [trials, setTrials] = useState(250);
  const [seed, setSeed] = useState('42');
  const [schedule, setSchedule] = useState<BootstrapOptions['schedule']>('random');
  const [lineup, setLineup] = useState<BootstrapOptions['lineup']>('best-ball');
  const [roster, setRoster] = useState('');
  const [removeId, setRemoveId] = useState('');
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState('');
  const [result, setResult] = useState<BootstrapResult>();
  const [notice, setNotice] = useState('');
  const controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => controller.current?.abort(), []);
  const running = progress !== undefined;
  const validSeed = /^\d{1,10}$/.test(seed) && Number(seed) <= 0xffffffff;

  async function run() {
    if (!validSeed || controller.current) return;
    const cancel = new AbortController();
    controller.current = cancel;
    setError('');
    setNotice('');
    setProgress(0);
    try {
      const result = await runSeasonBootstrap(
        league,
        {
          trials,
          seed: Number(seed),
          schedule,
          lineup,
          ...(roster && removeId ? { remove: { teamId: roster, playerId: removeId } } : {}),
        },
        setProgress,
        cancel.signal,
      );
      if (!cancel.signal.aborted) setResult(result);
    } catch (error) {
      if (!cancel.signal.aborted) setError(message(error, 'Could not run the season simulation.'));
    } finally {
      if (controller.current === cancel) {
        controller.current = undefined;
        setProgress(undefined);
      }
    }
  }

  return (
    <>
      <Box
        as="section"
        aria-labelledby="bootstrap-setup"
        borderWidth="1px"
        borderColor="border"
        bg="bg"
        rounded="lg"
        p={{ base: 4, md: 6 }}
        mb={5}
      >
        <Heading id="bootstrap-setup" as="h2" size="md" mb={2}>
          Simulation setup
        </Heading>
        <Text color="fg.muted" fontSize="sm" mb={4}>
          {rosterSeason} roster snapshot · {inputs.sampleCount.toLocaleString()} player-week scores
          from {inputs.sampleWeeks} completed {historyYear} weeks · {league.weeks} weeks per trial
        </Text>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run();
          }}
        >
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
            <SelectField
              label="Simulated seasons"
              value={trials}
              onChange={(value) => setTrials(Number(value))}
              disabled={running}
            >
              {[100, 250, 500, 1000].map((count) => (
                <option key={count} value={count}>
                  {count.toLocaleString()}
                </option>
              ))}
            </SelectField>
            <Field.Root disabled={running} invalid={!validSeed}>
              <Field.Label>Random seed</Field.Label>
              <Input
                size="sm"
                inputMode="numeric"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
              />
              {!validSeed && (
                <Field.ErrorText>Enter a whole number from 0 to 4,294,967,295.</Field.ErrorText>
              )}
            </Field.Root>
            <SelectField
              label="Matchup schedule"
              value={schedule}
              onChange={(value) => setSchedule(value === 'league' ? 'league' : 'random')}
              disabled={running}
            >
              <option value="random">Random round-robin</option>
              <option value="league" disabled={!league.schedule}>
                League schedule
              </option>
            </SelectField>
            <SelectField
              label="Lineup scoring"
              value={lineup}
              onChange={(value) => setLineup(value === 'managed' ? 'managed' : 'best-ball')}
              disabled={running}
            >
              <option value="best-ball">Best ball</option>
              <option value="managed">Modeled manager efficiency</option>
            </SelectField>
          </SimpleGrid>
          <Box as="fieldset" mt={5} mb={4}>
            <Text as="legend" fontWeight="semibold" mb={1}>
              Compare without a player
            </Text>
            <Text fontSize="sm" color="fg.muted" mb={2}>
              Optional. The team uses the rest of its roster with the same draws and matchups.
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
              <SelectField
                label="Comparison team"
                value={roster}
                onChange={(value) => {
                  setRoster(value);
                  setRemoveId('');
                }}
                disabled={running}
              >
                <option value="">No comparison</option>
                {league.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </SelectField>
              {roster && (
                <SelectField
                  label="Player to remove"
                  value={removeId}
                  onChange={setRemoveId}
                  disabled={running}
                >
                  <option value="">Choose a player</option>
                  {league.teams
                    .find((team) => team.id === roster)
                    ?.players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.position})
                      </option>
                    ))}
                </SelectField>
              )}
            </SimpleGrid>
          </Box>
          <Flex gap={3} wrap="wrap" align="center">
            <Button
              size="sm"
              colorPalette="indigo"
              type="submit"
              disabled={running || !validSeed || Boolean(roster && !removeId)}
            >
              Run simulation
            </Button>
            {running && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  controller.current?.abort();
                  setNotice('Simulation canceled.');
                }}
              >
                Cancel simulation
              </Button>
            )}
            {running && (
              <Text as="output" fontSize="sm">
                Simulating {trials.toLocaleString()} seasons · {progress.toLocaleString()} complete
              </Text>
            )}
            {notice && !running && (
              <Text as="output" fontSize="sm">
                {notice}
              </Text>
            )}
          </Flex>
          {error && (
            <Text role="alert" mt={3}>
              {error}
            </Text>
          )}
        </form>
        <Box as="details" mt={5} fontSize="sm" color="fg.muted">
          <Text as="summary" cursor="pointer">
            Method and data coverage
          </Text>
          <Text mt={2}>
            Player scores are sampled with replacement from nearby observed scoring ranks at the
            same position. Players without individual history use the lowest available positional
            ranks when possible. The simulator holds rosters fixed and plays every regular-season
            week from scratch. Finishes use head-to-head wins, then total points. Tied games count
            as half a win.
          </Text>
          <Text mt={2}>
            {inputs.positionalPlayers} rostered players use lower-ranked peers, and{' '}
            {inputs.excludedPlayers} were omitted for missing scoring or lineup eligibility. Missing
            game observations are omitted. Bye weeks and injuries are represented only where
            recorded as zero scores. A removed player’s slot scores zero if the bench cannot fill
            it.
          </Text>
          <Text mt={2}>
            Best ball uses the highest-scoring legal lineup. Managed lineups use a modeled
            efficiency centered at 77.5% with a 5-point standard deviation.
            {!league.schedule &&
              ' The league schedule option requires complete same-season matchups.'}
          </Text>
          <Text mt={2}>
            Method inspired by <a href="https://github.com/ffverse/ffsimulator">ffsimulator</a>.
            Score pools come from this league’s observed history.
          </Text>
        </Box>
      </Box>
      {result && (
        <BootstrapResults
          result={result}
          league={league}
          historyYear={historyYear}
          rosterSeason={rosterSeason}
          leagueName={leagueName}
        />
      )}
    </>
  );
}

function BootstrapResults({
  result,
  league,
  historyYear,
  rosterSeason,
  leagueName,
}: {
  result: BootstrapResult;
  league: Inputs['league'];
  historyYear: number;
  rosterSeason: number;
  leagueName: string;
}) {
  const [teamId, setTeamId] = useState('');
  const [distribution, setDistribution] = useState<'wins' | 'finish'>('wins');
  const team =
    result.teams.find((entry) => entry.id === teamId) ??
    [...result.teams].sort((a, b) => a.finish - b.finish)[0];
  const { options, removal } = result;
  const removed =
    removal &&
    league.teams
      .find(({ id }) => id === removal.teamId)
      ?.players.find(({ id }) => id === removal.playerId);
  const bins =
    distribution === 'wins'
      ? team.winCounts.map(({ wins, count }) => ({ label: String(wins), count }))
      : team.finishCounts.flatMap((count, i) => (count ? [{ label: String(i + 1), count }] : []));
  const lineupName = options.lineup === 'best-ball' ? 'Best ball' : 'Modeled efficiency';
  const scheduleName = options.schedule === 'league' ? 'League schedule' : 'Random round-robin';

  return (
    <ReportExportScope
      value={{
        context: {
          League: leagueName,
          'Scoring history': historyYear,
          'Roster season': rosterSeason,
          Model: bootstrapModelVersion,
          Seed: options.seed,
          Trials: options.trials,
          Schedule: scheduleName,
          Lineup: lineupName,
        },
        filenameContext: `${leagueName}-${historyYear}-seed-${options.seed}`,
      }}
    >
      <Box
        as="section"
        aria-labelledby="bootstrap-results"
        borderWidth="1px"
        borderColor="border"
        bg="bg"
        rounded="lg"
        p={{ base: 4, md: 6 }}
      >
        <Heading id="bootstrap-results" as="h2" size="md" mb={2}>
          Season outcomes
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {options.trials.toLocaleString()} trials · {result.weeks} weeks · Seed {options.seed} ·{' '}
          {scheduleName} · {lineupName}
        </Text>
        <Box overflowX="auto" mb={5}>
          <DataTable
            label="Simulated season standings"
            data={result.teams}
            getRowId={(row) => row.id}
            initialSorting={[{ id: 'finish', desc: false }]}
            columns={[
              {
                id: 'team',
                header: 'Team',
                rowHeader: true,
                value: (row) => row.name,
                cell: (row) => row.name,
              },
              numeric('wins', 'Avg wins'),
              numeric('finish', 'Avg finish'),
              {
                id: 'first',
                header: '1st-place rate',
                value: (row) => row.finishCounts[0] / options.trials,
                cell: (row) => percent(row.finishCounts[0] / options.trials),
              },
              {
                id: 'all-play',
                header: 'All-play win rate',
                headerTooltip:
                  'The share of weekly head-to-head comparisons won against all other teams.',
                value: (row) => row.allPlay,
                cell: (row) => percent(row.allPlay),
              },
              numeric('points', 'Avg points for'),
              numeric('pointsAgainst', 'Avg points against'),
              numeric('optimalPoints', 'Avg optimal points'),
            ]}
          />
        </Box>
        {removal && removed && (
          <Box borderStartWidth="3px" borderColor="indigo.solid" ps={3} mb={5}>
            <Heading as="h3" size="sm" mb={1}>
              Without {removed.name}
            </Heading>
            <Text fontSize="sm">
              {league.teams.find(({ id }) => id === removal.teamId)?.name} averages{' '}
              {signed(removal.wins)} wins and {signed(removal.points)} points per season compared
              with its full roster.
            </Text>
          </Box>
        )}
        <Heading as="h3" size="sm" mb={3}>
          Outcome distribution
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3} maxW="xl" mb={3}>
          <SelectField label="Distribution team" value={team.id} onChange={setTeamId}>
            {result.teams.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Distribution metric"
            value={distribution}
            onChange={(value) => setDistribution(value === 'finish' ? 'finish' : 'wins')}
          >
            <option value="wins">Season wins</option>
            <option value="finish">Final place</option>
          </SelectField>
        </SimpleGrid>
        <Box
          as="ul"
          aria-label={
            distribution === 'wins' ? 'Season win frequencies' : 'Final place frequencies'
          }
          display="grid"
          gap={2}
          maxW="xl"
        >
          {bins.map(({ label, count }) => (
            <Box
              key={label}
              as="li"
              display="grid"
              gridTemplateColumns="5.25rem minmax(0, 1fr) 4rem"
              gap={2}
              alignItems="center"
              fontSize="sm"
            >
              <Text>{distribution === 'wins' ? `${label} wins` : `Place ${label}`}</Text>
              <Box aria-hidden="true" bg="bg.muted" rounded="sm" overflow="hidden">
                <Box bg="indigo.solid" h="2" width={percent(count / options.trials)} />
              </Box>
              <Text textAlign="end">{percent(count / options.trials)}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    </ReportExportScope>
  );
}
