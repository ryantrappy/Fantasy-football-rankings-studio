import { render, screen } from '@testing-library/react';
import { DraftOverlap } from './DraftOverlap';
import { fixture } from '../../../history/personalities/activity.test';
it('states unavailable queue evidence and incompatible formats', () => {
  render(<DraftOverlap records={[fixture()]} />);
  expect(screen.getByText(/Draft steals: unsupported/)).toBeInTheDocument();
  expect(screen.getByText(/2025: draft data or comparable format unavailable/)).toBeInTheDocument();
});
