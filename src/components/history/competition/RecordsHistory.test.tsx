import { afterEach, it, expect } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { season } from '../../../history/competition/fixtures.test-support';
import { RecordsHistory } from './RecordsHistory';
it('browses categories, sorts, searches and links season evidence', () => {
  render(<RecordsHistory records={[season()]} years={[2024]} leagueId="league" />);
  fireEvent.click(screen.getByText('All-time matchup and scoring records'));
  const table = screen.getByRole('table', { name: 'All-time scoring record book' });
  expect(within(table).getAllByRole('row')[1].textContent).toContain('2024 week 2');
  fireEvent.change(screen.getByLabelText('Record category'), { target: { value: 'combined' } });
  expect(
    within(screen.getByRole('table', { name: 'All-time scoring record book' })).getAllByRole(
      'row',
    )[1].textContent,
  ).toContain('2024 week 1');
  fireEvent.change(screen.getByLabelText('Search matchup records'), { target: { value: 'a' } });
  expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe(
    '/insights?leagueId=league&year=2024',
  );
  fireEvent.click(screen.getByRole('button', { name: /Margin/ }));
  expect(screen.getByRole('columnheader', { name: /Margin/ }).getAttribute('aria-sort')).toBe(
    'ascending',
  );
  fireEvent.change(screen.getByLabelText('Record category'), { target: { value: 'worst' } });
  expect(screen.getByText('No verified records match these filters.')).toBeTruthy();
});

it('links individual unpaired scoring records to shared season pages', () => {
  const r = season();
  r.data.scores[0].opponentTeamId = null;
  render(<RecordsHistory records={[r]} years={[2024]} leagueId="league" shared />);
  fireEvent.click(screen.getByText('All-time matchup and scoring records'));
  fireEvent.change(screen.getByLabelText('Record category'), { target: { value: 'individual' } });
  expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe(
    '/shared/insights?leagueId=league&year=2024',
  );
  expect(screen.getByText(/Opponent unavailable; rank 1/)).toBeTruthy();
});

afterEach(cleanup);
