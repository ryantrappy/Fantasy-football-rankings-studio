const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  up: 'M6 14l6-6 6 6',
  down: 'M6 10l6 6 6-6',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M6.1 7a7 7 0 0 1 11.6-1L20 9 M4 15l2.3 3A7 7 0 0 0 17.9 17',
  check: 'M5 12l4 4L19 6',
  ball: 'M5 19C-1 13 7-1 19 5c6 12-8 20-14 14z M8 16l8-8 M8 12l4 4 M12 8l4 4',
  players:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M15 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.9 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  exchange: 'M4 7h16m-4-4 4 4-4 4 M20 17H4m4-4-4 4 4 4',
  chart: 'M4 3v17h17 M8 15v-4 M13 15V7 M18 15V4',
  trophy:
    'M8 3h8v6a4 4 0 0 1-8 0V3z M8 5H4v2a4 4 0 0 0 4 4 M16 5h4v2a4 4 0 0 1-4 4 M12 13v6 M8 21h8 M9 19h6',
  archive: 'M4 8h16v13H4z M3 3h18v5H3z M9 12h6',
  edit: 'M16 3l5 5-12 12H4v-5L16 3z M13 6l5 5',
} as const;

export function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
