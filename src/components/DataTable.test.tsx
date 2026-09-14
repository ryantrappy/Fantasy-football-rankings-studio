import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildTableCsv, DataTable, ReportExportScope, type DataColumn } from './DataTable';

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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

it('builds contextual CSV from declared columns and neutralizes formula-like text', () => {
  type SecureEntry = Entry & { privateCredential: string };
  const secureColumns: DataColumn<SecureEntry>[] = [
    { id: 'name', header: 'Manager, team', value: (row) => row.name, cell: (row) => row.name },
    {
      id: 'score',
      header: 'Score',
      value: (row) => row.score,
      exportValue: (row) => (row.score === null ? null : `${row.score} (2 weeks known)`),
      cell: (row) => row.score,
    },
  ];
  const csv = buildTableCsv({
    label: 'Manager scorecard',
    context: { League: 'Formula, League', Season: 2025 },
    columns: secureColumns,
    rows: [
      {
        id: 'safe-id',
        name: '=HYPERLINK("https://example.test")',
        score: null,
        privateCredential: 'never-export-this-token',
      },
    ],
  });

  expect(csv).toContain('League,"Formula, League"');
  expect(csv).toContain('Missing values,Unavailable (not zero)');
  expect(csv).toContain('"\'=HYPERLINK(""https://example.test"")",Unavailable');
  expect(csv).not.toContain('never-export-this-token');
});

it('downloads the currently sorted and limited rows with report context', async () => {
  const user = userEvent.setup();
  let downloaded: Blob | undefined;
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((blob: Blob) => {
      downloaded = blob;
      return 'blob:test';
    }),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  render(
    <ReportExportScope
      value={{ context: { League: 'Test league', Season: 2025 }, filenameContext: '123-2025' }}
    >
      <DataTable
        data={entries}
        columns={columns}
        getRowId={(row) => row.id}
        label="Scores"
        limit={2}
        initialSorting={[{ id: 'score', desc: true }]}
      />
    </ReportExportScope>,
  );
  await user.click(screen.getByRole('button', { name: 'Points' }));
  expect(names()).toEqual(['Team 3', 'Team 2']);
  await user.click(screen.getByRole('button', { name: 'Download Scores CSV' }));

  const csv = await downloaded!.text();
  expect(csv.indexOf('Team 3')).toBeLessThan(csv.indexOf('Team 2'));
  expect(csv).not.toContain('Team 10');
  expect(csv).toContain('League,Test league');
});
