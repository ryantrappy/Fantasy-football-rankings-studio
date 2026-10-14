import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { InfoTooltip } from './InfoTooltip';

beforeEach(() =>
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  ),
);
afterEach(() => vi.unstubAllGlobals());

it('opens a named definition on click and dismisses it with Escape', async () => {
  render(
    <Provider>
      <InfoTooltip label="Scoring definition">
        Only completed scoring weeks are included.
      </InfoTooltip>
    </Provider>,
  );
  const trigger = screen.getByRole('button', { name: 'Scoring definition' });
  fireEvent.click(trigger);
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Only completed scoring weeks');
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
});
