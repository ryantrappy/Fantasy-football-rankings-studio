import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, it, expect } from 'vitest';
import { CompetitionHistory } from './CompetitionHistory';
import { season } from '../../../history/competition/fixtures.test-support';
afterEach(cleanup);
it('changes rivalry threshold and reports missing history and empty pairs', () => {
  render(<CompetitionHistory records={[season()]} years={[2023, 2024]} />);
  expect(screen.getByText(/Missing seasons: 2023/)).toBeTruthy();
  expect(screen.getByText(/Punching bag: Insufficient/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Minimum rivalry games'), { target: { value: '2' } });
  expect(screen.getByText(/Punching bag: b/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Head-to-head manager'), { target: { value: 'b' } });
  expect(screen.getByText(/Kryptonite: a/)).toBeTruthy();
  expect(screen.getByRole('table', { name: /matrix/ })).toBeTruthy();
});
