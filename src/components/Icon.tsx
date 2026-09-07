const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  up: 'M6 14l6-6 6 6',
  down: 'M6 10l6 6 6-6',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  check: 'M5 12l4 4L19 6',
  ball: 'M5 19C-1 13 7-1 19 5c6 12-8 20-14 14z M8 16l8-8 M8 12l4 4 M12 8l4 4',
} as const;

export function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
