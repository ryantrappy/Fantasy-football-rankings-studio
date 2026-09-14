import { describe, expect, it } from 'vitest';
import {
  readStudioSelection,
  rememberStudioSelection,
  resolveStudioSelection,
  validateStudioSearch,
} from './studio-selection';

const leagues = [
  { leagueId: '111', leagueName: 'One', leagueType: 0 as const, seasonId: 2025 },
  { leagueId: '222', leagueName: 'Two', leagueType: 1 as const, seasonId: 2026 },
];

describe('studio selection', () => {
  it('gives valid URL values precedence over the remembered workspace', () => {
    expect(
      resolveStudioSelection(
        leagues,
        { leagueId: '222', year: 2024, week: 8 },
        {
          leagueId: '111',
          year: 2025,
          week: 3,
        },
      ),
    ).toEqual({ leagueId: '222', year: 2024, week: 8 });
  });

  it('falls back from unavailable remembered leagues without carrying their edition', () => {
    expect(resolveStudioSelection(leagues, {}, { leagueId: '333', year: 2020, week: 18 })).toEqual({
      leagueId: '111',
      year: 2025,
      week: 1,
    });
  });

  it('does not apply an archived URL league edition to the fallback workspace', () => {
    expect(
      resolveStudioSelection(
        leagues,
        { leagueId: '333', year: 2020, week: 18 },
        { leagueId: '222', year: 2026, week: 7 },
      ),
    ).toEqual({ leagueId: '222', year: 2026, week: 7 });
  });

  it('stores selections separately for each account and ignores malformed data', () => {
    const values = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    rememberStudioSelection('account-a', { leagueId: '111', year: 2025, week: 4 });
    rememberStudioSelection('account-b', { leagueId: '222', year: 2026, week: 7 });
    window.localStorage.setItem('studio-selection:v1:"account-c"', '{');
    expect(readStudioSelection('account-a')).toEqual({ leagueId: '111', year: 2025, week: 4 });
    expect(readStudioSelection('account-b')).toEqual({ leagueId: '222', year: 2026, week: 7 });
    expect(readStudioSelection('account-c')).toBeUndefined();
    expect(readStudioSelection()).toBeUndefined();
  });

  it('accepts only supported URL selection values', () => {
    expect(validateStudioSearch({ leagueId: '222', year: 2026, week: 18 })).toEqual({
      leagueId: '222',
      year: 2026,
      week: 18,
    });
    expect(validateStudioSearch({ leagueId: 'archived', year: 1999, week: 19 })).toEqual({});
  });
});
