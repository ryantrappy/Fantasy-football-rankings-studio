import { Button, Flex, Text } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { InsightsAccess } from '../auth/InsightsAccess';
import { snapshotInsightsApi } from '../api/snapshot-insights';
import type { ReportSnapshot, SnapshotView } from '../report-snapshot';
import { InsightsPage } from './InsightsPage';
import { HistoryPage } from './HistoryPage';

export function SnapshotReport({ report }: { report: ReportSnapshot }) {
  const api = useMemo(() => snapshotInsightsApi(report), [report]);
  const [view, setView] = useState<SnapshotView>(report.view);
  const [year, setYear] = useState(report.records[0].year);
  const [years, setYears] = useState(report.records.map((r) => r.year));
  const navigateSeason = useMemo(
    () =>
      async ({ search }: { search: { year: number } }) => {
        setYear(search.year);
      },
    [],
  );
  const navigateHistory = useMemo(
    () =>
      async ({ search }: { search: { years?: number[] } }) => {
        setYears(search.years || report.records.map((r) => r.year));
      },
    [report],
  );
  const snapshot = {
    href: `/shared/snapshots/${report.publicId}`,
    years: report.records.map((r) => r.year),
    openSeason: (selected: number) => {
      setYear(selected);
      setView('insights');
    },
  };
  return (
    <InsightsAccess publicApi={api}>
      <Text role="note" my={4}>
        Saved report snapshot · {new Date(report.savedAt).toLocaleString()}. Includes seasons{' '}
        {snapshot.years.join(', ')}. This link always shows the saved data; live refresh is
        disabled. Expires {new Date(report.expiresAt).toLocaleString()}.
      </Text>
      <Flex as="nav" aria-label="Snapshot reports" gap={3} flexWrap="wrap">
        {(['insights', 'history', 'playoffs'] as const).map((tab) => (
          <Button
            key={tab}
            variant={view === tab ? 'solid' : 'outline'}
            aria-pressed={view === tab}
            onClick={() => setView(tab)}
          >
            {tab === 'insights'
              ? 'Season insights'
              : tab === 'history'
                ? 'League history'
                : 'Playoff simulation'}
          </Button>
        ))}
      </Flex>
      {view === 'history' ? (
        <HistoryPage
          shared
          snapshot={snapshot}
          initialLeague={report.league}
          search={{ leagueId: report.league.leagueId, years }}
          navigate={navigateHistory}
        />
      ) : (
        <InsightsPage
          shared
          snapshot={snapshot}
          initialLeague={report.league}
          playoff={view === 'playoffs'}
          search={{ leagueId: report.league.leagueId, year }}
          navigate={navigateSeason}
        />
      )}
    </InsightsAccess>
  );
}
