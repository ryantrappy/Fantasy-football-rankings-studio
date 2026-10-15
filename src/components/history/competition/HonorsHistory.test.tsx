import { it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { season } from '../../../history/competition/fixtures.test-support';
import { HonorsHistory } from './HonorsHistory';
it('browses shame evidence with visible weights and samples', () => {
  render(<HonorsHistory records={[season()]} years={[2024]} />);
  fireEvent.click(screen.getByText('Hall of Fame and Hall of Shame'));
  expect(screen.getByText(/Fame weights: titles 40/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Shame record'), { target: { value: 'Lowest score' } });
  expect(
    within(screen.getByRole('table', { name: 'Hall of Shame evidence' })).getByText(
      /week 2, 60 points/,
    ),
  ).toBeTruthy();
  expect(screen.getByRole('complementary', { name: 'Record evidence' }).textContent).toContain(
    'week 2, 60 points',
  );
});
