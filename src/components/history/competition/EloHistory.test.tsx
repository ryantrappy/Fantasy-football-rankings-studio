import type { ReactElement } from 'react';
import { Provider } from '../../ui/provider';
import { it, expect } from 'vitest';
import { render as testingRender, screen, fireEvent } from '@testing-library/react';
import { EloHistory } from './EloHistory';
import { season } from '../../../history/competition/fixtures.test-support';
const render = (ui: ReactElement) => testingRender(ui, { wrapper: Provider });

it('shows selected manager rating movement and contributing games', () => {
  render(<EloHistory records={[season()]} years={[2024]} />);
  fireEvent.click(screen.getByText('Cross-season Elo manager ratings'));
  fireEvent.change(screen.getByLabelText('Elo game evidence'), { target: { value: 'a' } });
  expect(screen.getByText(/2024 week 1 vs b: 1,500/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Elo game evidence'), { target: { value: 'b' } });
  expect(screen.getByText(/2024 week 1 vs a: 1,500/)).toBeTruthy();
});
