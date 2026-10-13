import { render, screen } from '@testing-library/react';
import { fixture } from '../../../history/personalities/activity.test';
import { Archetypes } from './Archetypes';
it('shows no-profile reason and season coverage', () => {
  render(<Archetypes records={[fixture()]} />);
  expect(screen.getAllByText(/No supported profile/)).toHaveLength(2);
  expect(screen.getAllByText('Observed seasons: 2025')).toHaveLength(2);
});
