import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { season } from '../../../history/competition/fixtures.test-support';
import { PainHistory } from './PainHistory';
it('filters manager losses and keeps scoring cohorts separate', () => {
  const r = season();
  r.data.scores[6].actual = NaN;
  render(<PainHistory records={[r]} years={[2024, 2023]} />);
  fireEvent.click(screen.getByText('Weekly loss Pain Index'));
  expect(screen.getByText(/A playful league-context score/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Pain Index manager'), { target: { value: 'd' } });
  expect(screen.getByText(/d \/ 2024 week 1 vs c/)).toBeTruthy();
  expect(screen.getByText(/Late-week swing data unavailable/)).toBeTruthy();
});
