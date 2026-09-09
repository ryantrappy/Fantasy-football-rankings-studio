import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from './ui/provider';
import { PublishEdition } from './PublishEdition';
it('publishes explicitly and requires confirmation before revoking', async () => {
  const api = {
    status: vi.fn().mockResolvedValue(null),
    publish: vi
      .fn()
      .mockResolvedValue({ publicId: 'share-id', revision: 1, publishedAt: '2026-01-01' }),
    unpublish: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <Provider>
      <PublishEdition api={api} id="edition" revision={1} disabled={false} />
    </Provider>,
  );
  expect(api.publish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Publish edition' }));
  expect(await screen.findByLabelText('Published edition link')).toHaveValue(
    `${window.location.origin}/shared/rankings/share-id`,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }));
  expect(api.unpublish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm unpublish' }));
  await screen.findByText('Private draft');
  expect(api.unpublish).toHaveBeenCalledWith('edition');
});
