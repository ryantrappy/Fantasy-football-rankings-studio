import { render, screen } from '@testing-library/react';
import { ProbabilityReplay } from '../../components/history/moments/ProbabilityReplay';
import { snapshotInputSchema } from '../../server/report-snapshot-schema';
import { calculateInsights } from '../../server/insights/calculate';
const data = calculateInsights({
  completedWeek: 1,
  teams: [],
  scores: [],
  moves: [],
  notes: [],
  draftPickTrades: 0,
  playerNames: {},
});
const archive = {
  week: 1,
  teamId: 'a',
  opponentTeamId: 'b',
  source: 'Trusted live capture',
  preMondayAt: '2025-09-08T23:00:00.000Z',
  snapshots: [
    { capturedAt: '2025-09-08T23:00:00.000Z', probability: 0.05, contributors: [] },
    {
      capturedAt: '2025-09-09T03:00:00.000Z',
      probability: 0.8,
      contributors: [{ playerId: 'p', points: 30 }],
    },
  ],
};
it('renders accessible observed graph, exact timing, coverage and supplied major swing', () => {
  render(<ProbabilityReplay data={{ ...data, matchupArchive: [archive] }} manager="" />);
  expect(screen.getByRole('img')).toHaveAccessibleName('Observed win probability for a');
  expect(screen.getByText('75.0 percentage points — major swing')).toBeInTheDocument();
  expect(screen.getByText('p: 30 points')).toBeInTheDocument();
  expect(screen.getByText(/Gaps are unknown/)).toHaveTextContent('2 observed checkpoints');
});
it('requires at least two observations and respects manager coverage', () => {
  render(<ProbabilityReplay data={{ ...data, matchupArchive: [archive] }} manager="other" />);
  expect(screen.getByText(/Replay unavailable/)).toBeInTheDocument();
});
it('roundtrips bounded archive while stripping private fields', () => {
  const input = {
    leagueId: '123',
    view: 'history',
    activeSeason: 2025,
    activeManagerKeys: [],
    records: [
      { year: 2025, data: { ...data, matchupArchive: [{ ...archive, token: 'private' }] } },
    ],
  };
  const result = snapshotInputSchema.parse(input);
  expect(result.records[0].data.matchupArchive).toEqual([archive]);
  expect(() =>
    snapshotInputSchema.parse({
      ...input,
      records: [
        {
          year: 2025,
          data: {
            ...data,
            matchupArchive: [
              { ...archive, snapshots: [{ ...archive.snapshots[0], probability: Infinity }] },
            ],
          },
        },
      ],
    }),
  ).toThrow();
});
