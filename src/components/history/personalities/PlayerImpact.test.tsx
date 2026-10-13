import { render, screen } from '@testing-library/react';
import { PlayerImpact } from './PlayerImpact';
import { fixture } from '../../../history/personalities/activity.test';
it('renders attribution and partial-data disclosure', () => {
  render(<PlayerImpact records={[fixture()]} />);
  expect(screen.getByText(/Verified rostered starters/)).toBeInTheDocument();
  expect(screen.getByText(/Provider player IDs remain distinct/)).toBeInTheDocument();
  expect(screen.getByText('No verified player appearances available.')).toBeInTheDocument();
});
