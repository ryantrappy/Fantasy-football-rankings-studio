export function reportRefreshTime(generatedAt: string) {
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return 'an unknown time';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function reportFreshnessLabel(generatedAt: string) {
  return `Last successfully refreshed ${reportRefreshTime(generatedAt)}`;
}
