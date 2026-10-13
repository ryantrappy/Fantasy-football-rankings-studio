import { fireEvent, render, screen } from '@testing-library/react';
import { fixture } from '../../../history/personalities/activity.test';
import { PlayerLoyalty } from './PlayerLoyalty';
it('filters manager ownership and exposes favorite inputs', () => {
  render(
    <PlayerLoyalty
      records={[
        fixture({
          scores: [
            { teamId: '1', week: 1, players: [{ playerId: 'p' }] },
            { teamId: '2', week: 1, players: [{ playerId: 'q' }] },
          ],
        }),
      ]}
    />,
  );
  fireEvent.change(screen.getByLabelText('Ownership manager'), { target: { value: 'a' } });
  expect(screen.getByRole('table', { name: 'Manager-player ownership' })).not.toHaveTextContent(
    'Blair',
  );
  expect(screen.getByText(/Best-supported favorite: 1 observed weeks/)).toBeInTheDocument();
  expect(screen.getByText(/not complete NFL career history/)).toBeInTheDocument();
});
