import { fireEvent, render, screen } from '@testing-library/react';
import { PersonalitiesHistory } from './PersonalitiesHistory';
import { fixture } from '../../../history/personalities/activity.test';
it('compares managers and explains opt-in labels', () => {
  render(<PersonalitiesHistory records={[fixture()]} years={[2025, 2024]} />);
  expect(screen.getByText(/1 of 2 selected/)).toBeInTheDocument();
  expect(
    screen.getByRole('table', { name: 'Transactions per manager and season' }),
  ).toHaveTextContent('Alex');
  expect(screen.queryByText(/Tinkerer:/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Show playful activity labels'));
  expect(screen.getByText(/Tinkerer:/)).toBeInTheDocument();
});
