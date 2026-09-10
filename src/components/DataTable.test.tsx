import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type DataColumn } from './DataTable';

type Entry = { id: string; name: string; score: number | null };
const entries: Entry[] = [
  { id: 'a', name: 'Team 10', score: 100 },
  { id: 'b', name: 'Team 2', score: 9 },
  { id: 'c', name: 'Team 1', score: null },
  { id: 'd', name: 'Team 3', score: -2 },
];
const columns: DataColumn<Entry>[] = [
  { id: 'name', header: 'Team', value: (r) => r.name, cell: (r) => r.name, rowHeader: true },
  {
    id: 'score',
    header: 'Points',
    value: (r) => r.score,
    cell: (r) => (r.score === null ? '—' : `${r.score} pts`),
  },
  { id: 'notes', header: 'Notes', value: (r) => r.id, cell: (r) => r.id },
];
const names = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getByRole('rowheader').textContent);

it('sorts raw numbers both ways with missing results last and accessible keyboard headers', async () => {
  const user = userEvent.setup();
  render(<DataTable data={entries} columns={columns} getRowId={(r) => r.id} label="Scores" />);
  expect(screen.getByRole('button', { name: 'Notes' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Points' }));
  expect(names()).toEqual(['Team 3', 'Team 2', 'Team 10', 'Team 1']);
  expect(screen.getByRole('columnheader', { name: 'Points' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  await user.keyboard('{Enter}');
  expect(names()).toEqual(['Team 10', 'Team 2', 'Team 3', 'Team 1']);
  expect(screen.getByRole('columnheader', { name: 'Points' })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await user.click(screen.getByRole('button', { name: 'Team' }));
  expect(names()).toEqual(['Team 1', 'Team 2', 'Team 3', 'Team 10']);
  expect(screen.getByRole('columnheader', { name: 'Points' })).not.toHaveAttribute('aria-sort');
});

it('sorts the full dataset before limiting rows and preserves sorting when data changes', async () => {
  const user = userEvent.setup();
  const props = { columns, getRowId: (r: Entry) => r.id, label: 'Scores', limit: 2 };
  const { rerender } = render(
    <DataTable {...props} data={entries} initialSorting={[{ id: 'score', desc: true }]} />,
  );
  expect(names()).toEqual(['Team 10', 'Team 2']);
  await user.click(screen.getByRole('button', { name: 'Points' }));
  expect(names()).toEqual(['Team 3', 'Team 2']);
  rerender(<DataTable {...props} data={[...entries, { id: 'e', name: 'New team', score: -10 }]} />);
  expect(names()).toEqual(['New team', 'Team 3']);
  expect(entries.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
});

it('sorts names without case affecting alphabetical order', async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      label="Names"
      columns={columns}
      getRowId={(r) => r.id}
      data={[
        { id: 'a', name: 'Zebra', score: 1 },
        { id: 'b', name: 'alpha', score: 2 },
        { id: 'c', name: 'Bravo', score: 3 },
      ]}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Team' }));
  expect(names()).toEqual(['alpha', 'Bravo', 'Zebra']);
});

it('toggles every column by clicking the header cell, label, and indicator', async () => {
  const user = userEvent.setup();
  render(<DataTable data={entries} columns={columns} getRowId={(r) => r.id} label="Scores" />);
  for (const column of columns) {
    const header = screen.getByRole('columnheader', { name: column.header });
    await user.click(header);
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    await user.click(header.querySelector('.table-sort-indicator')!);
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  }
  expect(names()).toEqual(['Team 10', 'Team 2', 'Team 1', 'Team 3']);
});
