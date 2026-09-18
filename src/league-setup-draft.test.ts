import {
  clearLeagueSetupDraft,
  readLeagueSetupDraft,
  writeLeagueSetupDraft,
} from './league-setup-draft';

beforeEach(() => sessionStorage.clear());

it('validates and isolates non-secret league setup drafts by account', () => {
  const draft = {
    leagueId: '00123',
    leagueName: 'League',
    leagueType: 1 as const,
    seasonId: 2025,
  };
  writeLeagueSetupDraft('owner-a', draft);
  expect(readLeagueSetupDraft('owner-a')).toEqual(draft);
  expect(readLeagueSetupDraft('owner-b')).toBeNull();
  expect(JSON.stringify(sessionStorage)).not.toMatch(/espn_s2|SWID|token/i);

  clearLeagueSetupDraft('owner-a');
  expect(readLeagueSetupDraft('owner-a')).toBeNull();
});

it('ignores malformed or unscoped storage', () => {
  sessionStorage.setItem('fantasy-rankings:league-setup:owner-a', '{"leagueId":123}');
  expect(readLeagueSetupDraft('owner-a')).toBeNull();
  writeLeagueSetupDraft(undefined, {
    leagueId: '123',
    leagueName: '',
    leagueType: 0,
    seasonId: 2025,
  });
  expect(sessionStorage).toHaveLength(1);
});
