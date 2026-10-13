import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleHistory } from './ScheduleHistory';
import { season } from '../../../history/competition/fixtures.test-support';
it('replays selected donor schedule interactively', () => {
  render(<ScheduleHistory records={[season()]} years={[2024]} />);
  fireEvent.click(screen.getByText('Expected wins and historical schedule difficulty'));
  fireEvent.change(screen.getByLabelText('Schedule owner'), { target: { value: 'c' } });
  expect(screen.getByText(/Alternate record: 2-0-0/)).toBeTruthy();
  expect(screen.getByText(/Week 1: 100 vs d 70/)).toBeTruthy();
});
