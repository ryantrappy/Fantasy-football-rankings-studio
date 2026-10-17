import { useId, useRef } from 'react';

// Navigation only: the report and inspector remain mounted, preserving their state.
export function useInlineDetailNavigation() {
  const detailId = useId();
  const detail = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const openDetail = () => {
    origin.current = { x: window.scrollX, y: window.scrollY };
    detail.current?.scrollIntoView({ block: 'start' });
    detail.current?.focus({ preventScroll: true });
  };
  const returnToReport = () => {
    trigger.current?.focus({ preventScroll: true });
    if (origin.current) window.scrollTo(origin.current.x, origin.current.y);
    else trigger.current?.scrollIntoView({ block: 'center' });
  };
  return { detailId, detail, trigger, openDetail, returnToReport };
}
