import './data-table.css';
import { logClientError } from '../logging';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  headerTooltip?: string;
  value: (row: T) => string | number | null | undefined;
  exportValue?: (row: T) => string | number | null | undefined;
  cell: (row: T) => ReactNode;
  rowHeader?: boolean;
  className?: string;
  // Coverage columns remain visible whenever any row is incomplete.
  coverageComplete?: (row: T) => boolean;
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

/**
 * Copy the live table's computed styles onto the detached clone. Scoped rules
 * such as `.history-explorer .insight-table` only match inside their
 * ancestor, so without this the clone renders with fallback fonts and padding
 * and lays out wider than the on-screen table.
 */
function copyComputedStyles(source: Element, target: Element) {
  const view = source.ownerDocument.defaultView || window;
  const sources = [source, ...source.querySelectorAll('*')];
  const targets = [target, ...target.querySelectorAll('*')];
  sources.forEach((node, index) => {
    const cloneNode = targets[index] as HTMLElement | undefined;
    if (!cloneNode) return;
    const computed = view.getComputedStyle(node);
    if (computed.cssText) {
      cloneNode.style.cssText = computed.cssText;
    } else {
      for (let i = 0; i < computed.length; i++) {
        const property = computed[i];
        cloneNode.style.setProperty(
          property,
          computed.getPropertyValue(property),
          computed.getPropertyPriority(property),
        );
      }
    }
  });
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
  const tableElement = useRef<HTMLTableElement>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const element = tableElement.current;
    const viewport = element?.parentElement;
    if (!element || !viewport) return;
    const measure = () => setOverflows(element.scrollWidth > viewport.clientWidth + 1);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    observer?.observe(viewport);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  const exportScope = useContext(ReportExportContext);
  const descriptionId = useId();
  const [exportingImage, setExportingImage] = useState(false);
  const [imageExportError, setImageExportError] = useState('');

  /** PNG export mirrors RankingEditor's download(): clone, strip sort controls, toPng. */
  async function downloadPng() {
    const table = tableElement.current;
    if (!table || exportingImage || !exportScope) return;
    setExportingImage(true);
    setImageExportError('');
    const exportHost = document.createElement('div');
    exportHost.setAttribute('aria-hidden', 'true');
    exportHost.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none';
    try {
      await document.fonts?.ready;
      const { toPng } = await import('html-to-image');
      const canvas = table.cloneNode(true) as HTMLTableElement;
      copyComputedStyles(table, canvas);
      // Capture the full table width, not just the slice visible inside the
      // horizontally scrolling .insight-table-wrap.
      const fullWidth = table.scrollWidth || table.getBoundingClientRect().width;
      canvas.style.width = `${fullWidth}px`;
      canvas.style.maxWidth = 'none';
      // Export header labels without the interactive table's sorting controls.
      canvas.querySelectorAll('.table-sort-indicator').forEach((indicator) => indicator.remove());
      canvas.querySelectorAll('.table-sort-button').forEach((button) => {
        button.replaceWith(document.createTextNode(button.textContent || ''));
      });
      exportHost.appendChild(canvas);
      document.body.appendChild(exportHost);
      const image = await toPng(canvas, {
        pixelRatio: 1,
        backgroundColor: '#f8f8f2',
        style: { zoom: '1' },
      });
      const link = document.createElement('a');
      link.download = `fantasy-rankings-${safeFilenamePart(label)}-${safeFilenamePart(exportScope.filenameContext)}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      logClientError('DataTable', error);
      setImageExportError(
        `Image export failed: ${error instanceof Error ? error.message : 'Something went wrong. Please try again.'}`,
      );
    } finally {
      exportHost.remove();
      setExportingImage(false);
    }
  }
  const visibleColumns = useMemo(
    () =>
      columns.filter(
        (column) =>
          !column.coverageComplete || !data.length || !data.every(column.coverageComplete),
      ),
    [columns, data],
  );
  const numericColumns = new Set(
    visibleColumns
      .filter((column) => {
        const values = data.map(column.value).filter((value) => value != null);
        return (
          !column.rowHeader &&
          values.length > 0 &&
          values.every((value) => typeof value === 'number')
        );
      })
      .map((column) => column.id),
  );
  const definitions = useMemo(() => {
    const helper = createColumnHelper<typeof features, T>();
    return helper.columns(
      visibleColumns.map((column) =>
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
  }, [visibleColumns]);
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
        <div className="table-export-actions">
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
          <button
            type="button"
            className="table-export-button"
            onClick={() => void downloadPng()}
            disabled={exportingImage}
          >
            {exportingImage ? 'Exporting image…' : `Download ${label} PNG`}
          </button>
        </div>
      )}
      {imageExportError && (
        <p role="alert" className="table-export-error">
          {imageExportError}
        </p>
      )}
      {overflows && (
        <p className="table-overflow-cue" id={`${descriptionId}-overflow`}>
          Scroll horizontally to see all columns
        </p>
      )}
      <table
        ref={tableElement}
        className={className}
        aria-label={label}
        data-horizontal-overflow={overflows}
        aria-describedby={overflows ? `${descriptionId}-overflow` : undefined}
      >
        {children}
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const direction = header.column.getIsSorted();
                const headerTooltip = columns.find(
                  (column) => column.id === header.column.id,
                )?.headerTooltip;
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={`sortable-column-header${numericColumns.has(header.column.id) ? ' table-numeric' : ''}${visibleColumns.find((column) => column.id === header.column.id)?.rowHeader ? ' table-identity' : ''}`}
                    title={headerTooltip}
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
                      <button
                        type="button"
                        className="table-sort-button"
                        aria-describedby={
                          headerTooltip ? `${descriptionId}-${header.id}` : undefined
                        }
                      >
                        <table.FlexRender header={header} />
                        <span className="table-sort-indicator" aria-hidden="true">
                          {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
                        </span>
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                    {headerTooltip && (
                      <span className="sr-only" id={`${descriptionId}-${header.id}`}>
                        {headerTooltip}
                      </span>
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
                const column = visibleColumns[index];
                const Cell = column.rowHeader ? 'th' : 'td';
                return (
                  <Cell
                    key={cell.id}
                    scope={column.rowHeader ? 'row' : undefined}
                    className={[
                      column.className,
                      numericColumns.has(column.id) ? 'table-numeric' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
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
