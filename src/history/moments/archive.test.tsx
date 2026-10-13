import { render, screen, fireEvent } from '@testing-library/react';
import { calculateInsights } from '../../server/insights/calculate';
import { importArchive, mondayComebacks } from './archive';
import { MomentsHistory } from '../../components/history/moments/MomentsHistory';
export const data = calculateInsights({
  completedWeek: 1,
  teams: [
    { teamId: 'a', teamName: 'A', managerName: 'Alice' },
    { teamId: 'b', teamName: 'B', managerName: 'Bob' },
  ],
  scores: [
    { teamId: 'a', opponentTeamId: 'b', week: 1, actual: 101, projected: null, starters: [] },
    { teamId: 'b', opponentTeamId: 'a', week: 1, actual: 100, projected: null, starters: [] },
  ],
  moves: [],
  playerNames: {},
  notes: [],
  draftPickTrades: 0,
});
export const archive = {
  week: 1,
  teamId: 'a',
  opponentTeamId: 'b',
  source: 'Scoring service export',
  preMondayAt: '2025-09-09T00:00:00.000Z',
  snapshots: [
    { capturedAt: '2025-09-09T00:00:00.000Z', probability: 0.05, contributors: [] },
    {
      capturedAt: '2025-09-09T04:00:00.000Z',
      probability: 1,
      contributors: [{ playerId: 'p', points: 30 }],
    },
  ],
};
it('validates real input, strips private extras, and requires chronological explicit checkpoints', () => {
  const parsed = importArchive(JSON.stringify([{ ...archive, credentials: 'secret' }]), data);
  expect(parsed[0]).not.toHaveProperty('credentials');
  expect(() => importArchive(JSON.stringify([{ ...archive, teamId: 'unknown' }]), data)).toThrow();
  expect(() =>
    importArchive(
      JSON.stringify([{ ...archive, snapshots: [archive.snapshots[1], archive.snapshots[0]] }]),
      data,
    ),
  ).toThrow();
  expect(() =>
    importArchive(
      JSON.stringify([{ ...archive, snapshots: [{ ...archive.snapshots[0], probability: 1.1 }] }]),
      data,
    ),
  ).toThrow();
  expect(mondayComebacks({ ...data, matchupArchive: parsed })).toHaveLength(1);
  expect(mondayComebacks({ ...data, matchupArchive: parsed }, 0.01)).toHaveLength(0);
  expect(
    mondayComebacks({
      ...data,
      scores: data.scores.map((s) => ({ ...s, actual: 100 })),
      matchupArchive: parsed,
    }),
  ).toHaveLength(0);
});
it('imports, filters, and reports provenance and verified comeback outcome', () => {
  render(<MomentsHistory records={[{ year: 2025, data }]} years={[2025]} />);
  expect(screen.getByText(/Unavailable: no in-game/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Archive JSON'), {
    target: { value: JSON.stringify([archive]) },
  });
  fireEvent.click(screen.getByText('Import archive'));
  expect(screen.getByText(/5.0% → win 101–100/)).toHaveTextContent('Scoring service export');
  fireEvent.change(screen.getByLabelText('Moments manager'), { target: { value: 'b' } });
  expect(screen.getByText(/No verified wins/)).toBeInTheDocument();
});
