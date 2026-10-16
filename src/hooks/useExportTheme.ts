import { useState } from 'react';

export type ExportTheme = 'classic' | 'new';

function readTheme(subject?: string): ExportTheme {
  try {
    return subject && window.localStorage.getItem(`ranking-export-theme:v1:${subject}`) === 'new'
      ? 'new'
      : 'classic';
  } catch {
    return 'classic';
  }
}

export function useExportTheme(subject?: string) {
  const [selection, setSelection] = useState(() => ({ subject, theme: readTheme(subject) }));
  const [error, setError] = useState({ subject, message: '' });
  const storageError = error.subject === subject ? error.message : '';
  const theme = selection.subject === subject ? selection.theme : readTheme(subject);
  function selectTheme(next: ExportTheme) {
    setSelection({ subject, theme: next });
    setError({ subject, message: '' });
    if (!subject) return;
    try {
      window.localStorage.setItem(`ranking-export-theme:v1:${subject}`, next);
    } catch {
      setError({ subject, message: 'The export theme could not be saved for your next visit.' });
    }
  }
  return { theme, selectTheme, storageError };
}
