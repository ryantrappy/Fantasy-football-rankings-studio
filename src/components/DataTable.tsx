import { useMemo, type ReactNode } from 'react';
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
  cell: (row: T) => ReactNode;
  rowHeader?: boolean;
  className?: string;
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
  return (
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
        {(limit === undefined ? rows : rows.slice(0, limit)).map((row) => (
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
  );
}
