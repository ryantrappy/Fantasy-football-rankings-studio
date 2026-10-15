import type { ReactElement } from 'react';
import { Provider } from '../../ui/provider';
import { useState } from 'react';
import {
  render as testingRender,
  screen,
  fireEvent,
  cleanup,
  within,
} from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
import { CompetitionHistory } from './CompetitionHistory';
import { season } from '../../../history/competition/fixtures.test-support';

afterEach(cleanup);

const render = (ui: ReactElement) => testingRender(ui, { wrapper: Provider });

it('focuses opponent records and shows selected rivalry evidence with visible coverage and definition help', () => {
  render(
    <CompetitionHistory records={[season()]} years={[2023, 2024]} leagueId="league 1" shared />,
  );
  expect(screen.getByRole('button', { name: 'Rivalry definitions' })).toBeTruthy();
  expect(screen.getByText(/Missing seasons: 2023/)).toBeTruthy();
  expect(screen.queryByRole('table', { name: /matrix/ })).toBeNull();
  expect(
    (
      screen.getByRole('button', {
        name: /Punching bag.*Insufficient samples/,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText('Minimum rivalry games'), { target: { value: '2' } });
  expect(screen.getByRole('button', { name: /Punching bag.*b.*1-0-1/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Inspect rivalry with b' }));
  const inspector = within(screen.getByRole('complementary', { name: 'Selected rivalry' }));
  expect(inspector.getByRole('heading', { name: 'a vs. b' })).toBeTruthy();
  expect(inspector.getByText('Win · 100 – 90')).toBeTruthy();
  expect(inspector.getByText('Tie · 80 – 80')).toBeTruthy();
  expect(inspector.getByText('180 / 170')).toBeTruthy();
  expect(inspector.getByRole('link', { name: '2024 · Week 1' }).getAttribute('href')).toBe(
    '/shared/insights?leagueId=league%201&year=2024',
  );
  fireEvent.change(screen.getByLabelText('Search opponents'), { target: { value: 'c' } });
  expect(screen.queryByRole('button', { name: 'Inspect rivalry with b' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Inspect rivalry with c' }));
  expect(inspector.getByText(/No verified games between these managers/)).toBeTruthy();
  expect(inspector.getByText('Win rate').nextElementSibling?.textContent).toBe('Unavailable');
});

it('inspects matrix pairs, changes shared manager context, and keeps zero-game pairs explicit', () => {
  const onManagerChange = vi.fn();
  function Explorer() {
    const [key, setKey] = useState('a');
    return (
      <CompetitionHistory
        records={[season()]}
        years={[2024]}
        managerKey={key}
        onManagerChange={(next) => {
          setKey(next);
          onManagerChange(next);
        }}
      />
    );
  }
  render(<Explorer />);
  expect(screen.queryByLabelText('Head-to-head manager')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'League matrix' }));
  fireEvent.click(screen.getByRole('button', { name: 'Inspect b versus a: 0-1-1, 2 games' }));
  expect(onManagerChange).toHaveBeenLastCalledWith('b');
  expect(screen.getByRole('heading', { name: 'b vs. a' })).toBeTruthy();
  expect(within(screen.getByRole('complementary')).getByText('Loss · 90 – 100')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Inspect c versus a: no verified games' }));
  expect(screen.getByRole('heading', { name: 'c vs. a' })).toBeTruthy();
  expect(screen.getByText(/No verified games between these managers/)).toBeTruthy();
});

it('carries manager context through focused analytics without shrinking the league calculations', () => {
  render(<CompetitionHistory records={[season()]} years={[2024]} managerKey="c" />);
  fireEvent.click(screen.getByRole('button', { name: 'Schedule & luck' }));
  expect(screen.queryByRole('table', { name: 'All-time head-to-head' })).toBeNull();
  expect((screen.getByLabelText('Replay team') as HTMLSelectElement).value).toBe('c');
  expect(
    screen.getByRole('table', { name: 'Historical expected wins' }).querySelectorAll('tbody tr')
      .length,
  ).toBe(1);
  // Complete four-team weekly scores are still used for expected wins.
  expect(screen.getByRole('table', { name: 'Historical expected wins' }).textContent).toContain(
    '1.33',
  );
  expect((screen.getByLabelText('Replay team') as HTMLSelectElement).options.length).toBe(4);
  fireEvent.click(screen.getByRole('button', { name: 'Whole league' }));
  expect(
    screen.getByRole('table', { name: 'Historical expected wins' }).querySelectorAll('tbody tr')
      .length,
  ).toBe(4);
  fireEvent.click(screen.getByRole('button', { name: 'Elo ratings' }));
  expect((screen.getByLabelText('Elo game evidence') as HTMLSelectElement).value).toBe('c');
  expect(
    screen.getByRole('table', { name: 'Historical Elo ratings' }).querySelectorAll('tbody tr')
      .length,
  ).toBe(4);
  expect(screen.getByText(/2024 week 1 vs d: 1,500/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Playoffs' }));
  expect((screen.getByLabelText('Playoff game evidence') as HTMLSelectElement).value).toBe('c');
  expect(screen.getByText(/Playoff games unavailable/)).toBeTruthy();
});

it('keeps older game evidence available beyond the latest meetings', () => {
  const record = season(2024, [
    [100, 90, 80, 70],
    [80, 80, 120, 60],
    [90, 100, 70, 80],
    [105, 95, 60, 100],
  ]);
  render(<CompetitionHistory records={[record]} years={[2024]} leagueId="private" />);
  const inspector = within(screen.getByRole('complementary'));
  expect(inspector.getByText('All 4 contributing games').closest('details')?.open).toBe(false);
  expect(inspector.getAllByRole('listitem')).toHaveLength(7);
  expect(inspector.getByRole('link', { name: '2024 · Week 1' }).getAttribute('href')).toBe(
    '/insights?leagueId=private&year=2024',
  );
});

it('preserves replay selections and analytics controls when switching views', () => {
  render(<CompetitionHistory records={[season(2023), season(2024)]} years={[2023, 2024]} />);
  // Analytics mount only when first visited.
  expect(screen.queryByLabelText('Schedule season')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Schedule & luck' }));
  fireEvent.change(screen.getByLabelText('Schedule season'), { target: { value: '2024' } });
  fireEvent.change(screen.getByLabelText('Schedule owner'), { target: { value: 'c' } });
  fireEvent.click(screen.getByRole('button', { name: 'Whole league' }));
  fireEvent.click(screen.getByRole('button', { name: 'Playoffs' }));
  fireEvent.change(screen.getByLabelText('Minimum elimination games'), { target: { value: '5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Rivalries' }));
  expect(screen.queryByRole('table', { name: 'Historical expected wins' })).toBeNull();
  expect(screen.queryByRole('table', { name: 'Regular and playoff performance' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Schedule & luck' }));
  expect((screen.getByLabelText('Schedule season') as HTMLSelectElement).value).toBe('2024');
  expect((screen.getByLabelText('Schedule owner') as HTMLSelectElement).value).toBe('c');
  expect(screen.getByRole('button', { name: 'Whole league' }).getAttribute('aria-pressed')).toBe(
    'true',
  );
  expect(screen.getByText(/Alternate record: 2-0-0/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Playoffs' }));
  expect((screen.getByLabelText('Minimum elimination games') as HTMLInputElement).value).toBe('5');
});

it('selects heatmap pairs without losing manager, season, search or original matrix controls', () => {
  function Explorer() {
    const [manager, setManager] = useState('a');
    const [year, setYear] = useState(2023);
    return (
      <CompetitionHistory
        records={[season(2023), season(2024)]}
        years={[2023, 2024]}
        managerKey={manager}
        onManagerChange={setManager}
        seasonYear={year}
        onSeasonChange={setYear}
      />
    );
  }
  render(<Explorer />);
  fireEvent.change(screen.getByLabelText('Search opponents'), { target: { value: 'b' } });
  fireEvent.click(screen.getByRole('button', { name: 'Schedule & luck' }));
  fireEvent.change(screen.getByLabelText('Schedule season'), { target: { value: '2024' } });
  fireEvent.click(screen.getByRole('button', { name: 'Rivalries' }));
  fireEvent.click(screen.getByRole('button', { name: 'Matchup heatmap' }));
  const heatmap = within(screen.getByRole('table', { name: 'All-manager matchup heatmap' }));
  fireEvent.click(heatmap.getByRole('button', { name: /Inspect b versus a: 0-2-2 4 games · 25%/ }));
  expect(screen.getByRole('heading', { name: 'b vs. a' })).toBeTruthy();
  expect(screen.getByRole('complementary', { name: 'Selected rivalry' }).textContent).toContain(
    '4 verified meetings',
  );
  fireEvent.click(screen.getByRole('button', { name: 'League matrix' }));
  expect(screen.getByRole('table', { name: 'League rivalry matrix' })).toBeTruthy();
  expect(
    screen
      .getByRole('button', { name: /Inspect b versus a: 0-2-2, 4 games/ })
      .getAttribute('aria-pressed'),
  ).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Opponent records' }));
  expect((screen.getByLabelText('Search opponents') as HTMLInputElement).value).toBe('b');
  fireEvent.click(screen.getByRole('button', { name: 'Schedule & luck' }));
  expect((screen.getByLabelText('Schedule season') as HTMLSelectElement).value).toBe('2024');
});
