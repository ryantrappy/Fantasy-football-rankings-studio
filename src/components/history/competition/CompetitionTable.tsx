import { DataTable } from '../../DataTable';
import type { ComponentProps } from 'react';
export function CompetitionTable<T extends object>(props: ComponentProps<typeof DataTable<T>>) {
  return (
    <div className="insight-table-wrap" style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <DataTable {...props} />
    </div>
  );
}
