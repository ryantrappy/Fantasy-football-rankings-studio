import { DataTable } from '../../DataTable';
import type { ComponentProps, ReactNode } from 'react';
export function CompetitionTable<T extends object>({
  toolbar,
  ...props
}: ComponentProps<typeof DataTable<T>> & { toolbar?: ReactNode }) {
  return (
    <div
      className={`insight-table-wrap${toolbar ? ' history-competition-table-with-toolbar' : ''}`}
      style={{ overflowX: 'auto', maxWidth: '100%' }}
    >
      {toolbar && <div className="history-competition-table-toolbar">{toolbar}</div>}
      <DataTable {...props} />
    </div>
  );
}
