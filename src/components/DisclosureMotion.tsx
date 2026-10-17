import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

// Keep secondary forms mounted so closing a disclosure never discards their state.
export function DisclosureMotion({
  open,
  className,
  children,
  id,
}: {
  open: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const reduced = useReducedMotion();
  const [closed, setClosed] = useState(!open);
  const latestOpen = useRef(open);
  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (open) setClosed(false);
  }
  useEffect(() => {
    latestOpen.current = open;
  }, [open]);
  return (
    <motion.div
      id={id}
      className={className}
      hidden={!open && (closed || !!reduced)}
      inert={!open}
      aria-hidden={!open}
      initial={false}
      style={{
        display: !open && (closed || reduced) ? 'none' : undefined,
        ...(reduced ? { opacity: open ? 1 : 0, transform: 'none' } : {}),
      }}
      animate={reduced ? undefined : { opacity: open ? 1 : 0, y: open ? 0 : closed ? 6 : 4 }}
      transition={
        reduced
          ? { duration: 0 }
          : {
              y: { type: 'spring', stiffness: open ? 400 : 500, damping: open ? 40 : 45, mass: 1 },
              opacity: { duration: open ? 0.14 : 0.1 },
            }
      }
      onAnimationComplete={() => {
        if (!latestOpen.current) setClosed(true);
      }}
    >
      {children}
    </motion.div>
  );
}

export function PersistentDisclosure({
  label,
  accessibleLabel,
  className,
  contentClassName,
  children,
  closeKey,
  closeOnAction = false,
}: {
  label: ReactNode;
  accessibleLabel?: string;
  className: string;
  contentClassName: string;
  children: ReactNode;
  closeKey?: string;
  closeOnAction?: boolean;
}) {
  const [state, setState] = useState({ key: closeKey, open: false });
  if (state.key !== closeKey) setState({ key: closeKey, open: false });
  const open = state.key === closeKey && state.open;
  const setOpen = useCallback(
    (value: boolean) => setState({ key: closeKey, open: value }),
    [closeKey],
  );
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (document.getElementById(id)?.contains(document.activeElement)) trigger.current?.focus();
  }, [closeKey, id]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        if (root.current?.querySelector('[aria-hidden="false"]')?.contains(document.activeElement))
          trigger.current?.focus();
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const actionClick = (event: MouseEvent) => {
      const action = (event.target as Element).closest('a, button');
      if (closeOnAction && action && action !== trigger.current && root.current?.contains(action)) {
        if (action.contains(document.activeElement)) trigger.current?.focus();
        setOpen(false);
      }
    };
    document.addEventListener('click', actionClick);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', actionClick);
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open, closeOnAction, setOpen]);
  return (
    <div className={className} ref={root}>
      <button
        className="disclosure-trigger"
        ref={trigger}
        type="button"
        aria-label={accessibleLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      <DisclosureMotion id={id} open={open} className={contentClassName}>
        {children}
      </DisclosureMotion>
    </div>
  );
}
