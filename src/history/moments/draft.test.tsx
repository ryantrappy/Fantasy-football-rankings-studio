import axios from 'axios';
import { render, screen } from '@testing-library/react';
import { calculateInsights } from '../../server/insights/calculate';
import { sleeperDraft } from '../../server/insights/draft';
import { draftSkill, draftValues } from './draft';
import { DraftSkill } from '../../components/history/moments/DraftSkill';
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
const data = calculateInsights({
  completedWeek: 2,
  teams: [
    { teamId: 'a', teamName: 'A', managerName: 'Alex', managerKey: 'stable' },
    { teamId: 'b', teamName: 'B', managerName: 'Bob' },
  ],
  scores: [1, 2].map((week) => ({
    teamId: 'a',
    week,
    actual: 0,
    projected: null,
    starters: [],
    players: [
      { playerId: 'p', points: 30 },
      { playerId: 'q', points: 10 },
      { playerId: 'r', points: 20 },
    ],
  })),
  moves: [],
  playerNames: {},
  notes: [],
  draftPickTrades: 0,
  draftFormat: 'snake',
  draftPicks: [
    { playerId: 'p', teamId: 'a', overallPick: 1 },
    { playerId: 'q', teamId: 'b', overallPick: 2 },
    { playerId: 'r', teamId: 'b', overallPick: 3 },
  ],
});
it('compares complete league production to explicit nearby-pick baseline without inventing missing scores', () => {
  expect(draftValues(data)[0]).toMatchObject({
    points: 60,
    baseline: 30,
    value: 30,
    weeks: 2,
    cohort: 2,
  });
  expect(draftValues({ ...data, scores: data.scores.slice(0, 1) })[0].value).toBeNull();
  expect(draftValues({ ...data, draftFormat: 'auction' })[0].value).toBeNull();
  const skill = draftSkill([
    { year: 2024, data },
    { year: 2025, data },
  ]).find((r) => r.identity === 'stable');
  expect(skill).toMatchObject({ picks: 2, seasons: 2, relativeValue: 1 });
});
it('loads real completed Sleeper draft roster ownership and reports missing draft explicitly', async () => {
  vi.mocked(axios.get)
    .mockResolvedValueOnce({ data: [{ draft_id: 'd', status: 'complete', type: 'snake' }] })
    .mockResolvedValueOnce({ data: [{ player_id: 'p', roster_id: 2, pick_no: 3, round: 1 }] });
  expect(await sleeperDraft('historic')).toMatchObject({
    draftFormat: 'snake',
    draftPicks: [{ playerId: 'p', teamId: '2', overallPick: 3, round: 1 }],
  });
  expect(axios.get).toHaveBeenCalledWith('https://api.sleeper.app/v1/draft/d/picks', {
    timeout: 10000,
  });
  vi.mocked(axios.get).mockRejectedValueOnce(new Error('missing'));
  expect(await sleeperDraft('x')).toMatchObject({
    draftFormat: 'unknown',
    draftCoverage: expect.stringContaining('Unavailable'),
  });
});
it('renders production, baseline, best/worst ordering and skill sample', () => {
  render(<DraftSkill record={{ year: 2025, data }} records={[{ year: 2025, data }]} manager="a" />);
  expect(screen.getByText('60.0')).toBeInTheDocument();
  expect(screen.getByText('1 comparable picks / 1 seasons')).toBeInTheDocument();
  expect(screen.getByText(/Every configured completed week/)).toBeInTheDocument();
});
