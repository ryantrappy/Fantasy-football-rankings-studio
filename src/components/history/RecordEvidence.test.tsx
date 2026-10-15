import { fireEvent, render, screen, within } from '@testing-library/react';
import { RecordEvidence } from './RecordEvidence';
import { season } from '../../history/competition/fixtures.test-support';

const entries = [
  {
    id: 'first',
    title: 'Top verified game',
    year: 2024,
    detail: <p>100–90, completed reciprocal matchup.</p>,
  },
  {
    id: 'second',
    title: 'Older verified game',
    year: 2024,
    detail: <p>80–80, completed reciprocal matchup.</p>,
  },
];

it('populates real evidence immediately and preserves an explicit selection when rows reorder', () => {
  const { rerender } = render(
    <RecordEvidence records={[season()]} scope="alex" entries={entries} />,
  );
  const inspector = screen.getByRole('complementary', { name: 'Record evidence' });
  expect(inspector).toHaveTextContent('100–90');
  fireEvent.change(within(inspector).getByLabelText('Inspect record'), {
    target: { value: 'second' },
  });
  rerender(<RecordEvidence records={[season()]} scope="alex" entries={[...entries].reverse()} />);
  expect(within(inspector).getByLabelText('Inspect record')).toHaveValue('second');
  expect(inspector).toHaveTextContent('80–80');
  fireEvent.click(within(inspector).getByText('Loaded source reports (1)'));
  expect(inspector).toHaveTextContent('2024: through completed week 2');
});

it('replaces invalid or differently scoped evidence and keeps missing records explicit', () => {
  const { rerender } = render(
    <RecordEvidence records={[season()]} scope="alex:2024" entries={entries} />,
  );
  fireEvent.change(screen.getByLabelText('Inspect record'), { target: { value: 'second' } });
  rerender(<RecordEvidence records={[season()]} scope="blair:2024" entries={entries} />);
  expect(screen.getByLabelText('Inspect record')).toHaveValue('first');
  fireEvent.change(screen.getByLabelText('Inspect record'), { target: { value: 'second' } });
  rerender(<RecordEvidence records={[season()]} scope="blair:2024" entries={[entries[0]]} />);
  expect(screen.getByRole('complementary')).toHaveTextContent('100–90');
  rerender(<RecordEvidence records={[]} scope="blair:2023" entries={[]} />);
  expect(screen.getByRole('complementary')).toHaveTextContent(
    'No supported records in this selection',
  );
  expect(screen.getByRole('complementary')).not.toHaveTextContent('100–90');
});
