import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { season } from '../../../history/competition/fixtures.test-support';
import { ErasHistory } from './ErasHistory';
it('applies visible thresholds and explains unknown title coverage', () => {
  render(
    <ErasHistory records={[season(2022), season(2023), season(2024)]} years={[2022, 2023, 2024]} />,
  );
  fireEvent.click(screen.getByText('Dynasties and competitive eras'));
  expect(screen.getByText(/a — Sustained regular success/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Sustained win percentage'), { target: { value: '100' } });
  expect(screen.queryByText(/a — Sustained regular success/)).toBeNull();
  expect(screen.getByText(/2022: Unknown or inconsistent championship/)).toBeTruthy();
});
