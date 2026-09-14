import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type SortingState,
} from '@tanstack/react-table';

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

export interface DataColumn<T> {
  id: string;
  header: string;
  value: (row: T) => string | number | null | undefined;
  exportValue?: (row: T) => string | number | null | undefined;
  cell: (row: T) => ReactNode;
  rowHeader?: boolean;
  className?: string;
}

export interface ReportExportContextValue {
  context: Record<string, string | number>;
  filenameContext: string;
}

const ReportExportContext = createContext<ReportExportContextValue | null>(null);

export function ReportExportScope({
  value,
  children,
}: {
  value: ReportExportContextValue;
  children: ReactNode;
}) {
  return <ReportExportContext.Provider value={value}>{children}</ReportExportContext.Provider>;
}

function csvCell(value: string | number | null | undefined) {
  if (value == null || (typeof value === 'number' && !Number.isFinite(value))) return 'Unavailable';
  let text = String(value);
  if (typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildTableCsv<T extends object>({
  label,
  context,
  columns,
  rows,
}: {
  label: string;
  context: Record<string, string | number>;
  columns: DataColumn<T>[];
  rows: T[];
}) {
  return [
    ['Table', label],
    ...Object.entries(context),
    ['Missing values', 'Unavailable (not zero)'],
    [],
    columns.map((column) => column.header),
    ...rows.map((row) => columns.map((column) => (column.exportValue || column.value)(row))),
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
}

function safeFilenamePart(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'report'
  );
}

function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Values drive sorting; cell formatting never affects numeric order. */
export function DataTable<T extends object>({
  data,
  columns,
  getRowId,
  initialSorting = [],
  label,
  className = 'insight-table',
  children,
  limit,
}: {
  data: T[];
  columns: DataColumn<T>[];
  getRowId: (row: T) => string;
  initialSorting?: SortingState;
  label: string;
  className?: string;
  children?: ReactNode;
  limit?: number;
}) {
  const exportScope = useContext(ReportExportContext);
  const definitions = useMemo(() => {
    const helper = createColumnHelper<typeof features, T>();
    return helper.columns(
      columns.map((column) =>
        helper.accessor((row) => column.value(row) ?? undefined, {
          id: column.id,
          header: column.header,
          cell: ({ row }) => column.cell(row.original),
          enableSorting: true,
          sortUndefined: 'last',
          sortDescFirst: false,
        }),
      ),
    );
  }, [columns]);
  const table = useTable({
    features,
    data,
    columns: definitions,
    getRowId,
    initialState: { sorting: initialSorting },
    enableSortingRemoval: false,
  });
  const rows = table.getRowModel().rows;
  const visibleRows = limit === undefined ? rows : rows.slice(0, limit);
  return (
    <>
      {exportScope && (
        <button
          type="button"
          className="table-export-button"
          onClick={() =>
            downloadCsv(
              `fantasy-rankings-${safeFilenamePart(label)}-${safeFilenamePart(exportScope.filenameContext)}.csv`,
              buildTableCsv({
                label,
                context: exportScope.context,
                columns,
                rows: visibleRows.map((row) => row.original),
              }),
            )
          }
        >
          Download {label} CSV
        </button>
      )}
      <table className={className} aria-label={label}>
        {children}
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const direction = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className="sortable-column-header"
                    onClick={header.column.getToggleSortingHandler()}
                    aria-sort={
                      direction === 'asc'
                        ? 'ascending'
                        : direction === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <button type="button" className="table-sort-button">
                        <table.FlexRender header={header} />
                        <span className="table-sort-indicator" aria-hidden="true">
                          {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
                        </span>
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell, index) => {
                const column = columns[index];
                const Cell = column.rowHeader ? 'th' : 'td';
                return (
                  <Cell
                    key={cell.id}
                    scope={column.rowHeader ? 'row' : undefined}
                    className={column.className}
                  >
                    <table.FlexRender cell={cell} />
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
