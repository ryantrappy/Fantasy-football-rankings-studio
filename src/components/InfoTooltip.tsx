import { Portal, Tooltip } from '@chakra-ui/react';
import { useState, type ReactNode } from 'react';

/** Definitions only: actionable controls and source evidence belong in the page. */
export function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip.Root
      open={open}
      onOpenChange={(event) => setOpen(event.open)}
      openDelay={100}
      closeDelay={100}
      closeOnClick={false}
      interactive
      positioning={{ placement: 'bottom', gutter: 8 }}
    >
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className="explorer-info-trigger"
          aria-label={label}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">ⓘ</span>
        </button>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content className="explorer-info-content">{children}</Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
