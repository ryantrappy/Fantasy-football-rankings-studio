export function ChartPointTooltip({
  x,
  y,
  chartWidth,
  chartHeight,
  title,
  detail,
}: {
  x: number;
  y: number;
  chartWidth: number;
  chartHeight: number;
  title: string;
  detail: string;
}) {
  const width = Math.min(320, Math.max(190, Math.max(title.length, detail.length) * 7 + 24));
  const left = Math.max(8, Math.min(x + 12, chartWidth - width - 8));
  const top = y + 70 < chartHeight ? y + 12 : y - 66;
  return (
    <g transform={`translate(${left} ${top})`} pointerEvents="none" aria-hidden="true">
      <rect
        width={width}
        height="54"
        rx="7"
        fill="var(--chakra-colors-bg)"
        stroke="var(--chakra-colors-border)"
      />
      <text x="12" y="21" fill="var(--chakra-colors-fg)" fontSize="13" fontWeight="700">
        {title}
      </text>
      <text x="12" y="41" fill="var(--chakra-colors-fg)" fontSize="12">
        {detail}
      </text>
    </g>
  );
}
