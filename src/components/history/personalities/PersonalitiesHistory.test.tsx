import { fireEvent, render, screen } from '@testing-library/react';
import { PersonalitiesHistory } from './PersonalitiesHistory';
import { fixture } from '../../../history/personalities/activity.test';
it('compares managers and explains opt-in labels', () => {
  render(<PersonalitiesHistory records={[fixture()]} years={[2025, 2024]} />);
  expect(screen.getByText(/Activity coverage: 1\/2 selected seasons/)).toBeInTheDocument();
  expect(
    screen.getByRole('table', { name: 'Transactions per manager and season' }),
  ).toHaveTextContent('Alex');
  expect(screen.queryByText(/Tinkerer:/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Show playful activity labels'));
  expect(screen.getByText(/Tinkerer:/)).toBeInTheDocument();
});

it('carries manager focus into activity and Wrapped while preserving subview state', () => {
  render(<PersonalitiesHistory records={[fixture()]} years={[2025]} managerKey="a" />);
  const activity = screen.getByRole('table', { name: 'Transactions per manager and season' });
  expect(activity).toHaveTextContent('Alex');
  expect(activity).not.toHaveTextContent('Blair');
  expect(screen.queryByLabelText('Personality manager')).not.toBeInTheDocument();
  expect(screen.queryByText('Personal and league Fantasy Wrapped')).not.toBeInTheDocument();
  expect(screen.queryByText('Nemesis and guardian-angel players')).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Show playful activity labels'));
  fireEvent.click(screen.getByRole('button', { name: 'Wrapped' }));
  expect(screen.getByRole('heading', { name: "Alex's 2025 Fantasy Wrapped" })).toBeVisible();
  expect(
    screen.queryByRole('table', { name: 'Transactions per manager and season' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Wrapped manager')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Activity' }));
  expect(screen.getByLabelText('Show playful activity labels')).toBeChecked();
});

it('keeps a local manager selector available when used outside the explorer', () => {
  render(<PersonalitiesHistory records={[fixture()]} years={[2025]} />);
  fireEvent.change(screen.getByLabelText('Personality manager'), { target: { value: 'b' } });
  const activity = screen.getByRole('table', { name: 'Transactions per manager and season' });
  expect(activity).toHaveTextContent('Blair');
  expect(activity).not.toHaveTextContent('Alex');
});

it('gives separate personality explorers unique subview targets', () => {
  const records = [fixture()];
  const { container } = render(
    <>
      <PersonalitiesHistory records={records} years={[2025]} />
      <PersonalitiesHistory records={records} years={[2025]} />
    </>,
  );
  const targets = [...container.querySelectorAll('button[aria-controls]')].map((button) =>
    button.getAttribute('aria-controls')!,
  );
  expect(new Set(targets).size).toBe(targets.length);
  for (const target of targets) expect(document.getElementById(target)).toBeInTheDocument();
});
