import { fireEvent, render, screen } from '@testing-library/react';
import { ProjectionSourceControl, ProjectionSourceProvider } from './ProjectionSourceControl';
import { Provider } from './ui/provider';

it('defaults to Combined and restores only the current account’s preference', () => {
  const key = 'projection-source:v1:source-test-user';
  localStorage.removeItem(key);
  const view = (subject: string) => (
    <Provider>
      <ProjectionSourceProvider key={subject} subject={subject}>
        <ProjectionSourceControl />
      </ProjectionSourceProvider>
    </Provider>
  );
  const { rerender } = render(view('source-test-user'));
  const selector = () => screen.getByRole('combobox', { name: 'Projection source' });
  expect(selector()).toHaveValue('Combined');
  fireEvent.change(selector(), { target: { value: 'ESPN' } });
  expect(selector()).toHaveValue('ESPN');
  rerender(view('other-test-user'));
  expect(selector()).toHaveValue('Combined');
  rerender(view('source-test-user'));
  expect(selector()).toHaveValue('ESPN');
  localStorage.removeItem(key);
});
