import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { season } from '../../../history/competition/fixtures.test-support';
import { HonorsHistory } from './HonorsHistory';
it('browses shame evidence with visible weights and samples', () => {
  render(<HonorsHistory records={[season()]} years={[2024]} />);
  fireEvent.click(screen.getByText('Hall of Fame and Hall of Shame'));
  expect(screen.getByText(/Fame weights: titles 40/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Shame record'), { target: { value: 'Lowest score' } });
  expect(screen.getByText(/week 2, 60 points/)).toBeTruthy();
});
