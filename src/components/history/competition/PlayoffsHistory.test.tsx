import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { season } from '../../../history/competition/fixtures.test-support';
import { PlayoffsHistory } from './PlayoffsHistory';
it('explains unavailable playoffs and interactive threshold', () => {
  render(<PlayoffsHistory records={[season()]} years={[2024]} />);
  fireEvent.click(screen.getByText('Playoff performance and clutch results'));
  expect(screen.getByText(/Playoff games unavailable/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Minimum elimination games'), { target: { value: '5' } });
  expect(screen.getByText(/Clutch record requires at least 5 elimination/)).toBeTruthy();
});
