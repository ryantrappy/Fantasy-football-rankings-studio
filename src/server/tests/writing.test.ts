// @vitest-environment node
const mocks = vi.hoisted(() => ({
  league: vi.fn(),
  access: vi.fn(),
  load: vi.fn(),
  providers: vi.fn(),
  find: vi.fn(),
  chat: vi.fn(),
}));
vi.mock('../services/leagues.service', () => ({
  default: class {
    getLeagueById = mocks.league;
    espnAccess = mocks.access;
  },
}));
vi.mock('../insights/load.server', () => ({ loadInsightsSource: mocks.load }));
vi.mock('../writing-cli.server', () => ({
  writingProviders: mocks.providers,
  findWritingCli: mocks.find,
  WritingCliAdapter: class {},
}));
vi.mock('@tanstack/ai', () => ({ chat: mocks.chat }));
import { generateWriting, getWritingContext } from '../writing.server';
const selection = { leagueId: '123', year: 2025, week: 2, teamId: '1' };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.league.mockResolvedValue({ leagueId: '123' });
  mocks.access.mockResolvedValue('public');
  mocks.load.mockResolvedValue({
    completedWeek: 3,
    teams: [{ teamId: '1', teamName: 'Team', managerName: 'Manager' }],
    scores: [],
    moves: [],
    playerNames: {},
    notes: [],
    draftPickTrades: 0,
  });
  mocks.providers.mockResolvedValue([{ id: 'codex', enabled: true, installed: true }]);
  mocks.find.mockResolvedValue('/bin/codex');
  mocks.chat.mockResolvedValue('- Discuss scoring.');
});
it('uses the verified owner for context and blocks other owners before provider reads', async () => {
  await getWritingContext('owner', selection);
  expect(mocks.league).toHaveBeenCalledWith('123', 'owner');
  mocks.league.mockRejectedValueOnce(new Error('Not your league'));
  mocks.load.mockClear();
  await expect(getWritingContext('other', selection)).rejects.toThrow('Not your league');
  expect(mocks.load).not.toHaveBeenCalled();
});
it('requires explicit approval and administrator enablement before generation', async () => {
  await expect(
    generateWriting('owner', { ...selection, provider: 'codex', model: '', approved: false }),
  ).rejects.toThrow();
  expect(mocks.chat).not.toHaveBeenCalled();
  mocks.providers.mockResolvedValue([{ id: 'codex', enabled: false, installed: true }]);
  await expect(
    generateWriting('owner', { ...selection, provider: 'codex', model: '', approved: true }),
  ).rejects.toMatchObject({ status: 403 });
  expect(mocks.load).not.toHaveBeenCalled();
});
it('passes only verified factual context to TanStack AI and permits retry after failure', async () => {
  mocks.chat.mockRejectedValueOnce(new Error('CLI failed'));
  const input = { ...selection, provider: 'codex', model: 'local-model', approved: true };
  await expect(generateWriting('owner', input)).rejects.toThrow('CLI failed');
  expect(await generateWriting('owner', input)).toBe('- Discuss scoring.');
  expect(mocks.chat.mock.calls[1][0].messages[0].content).toContain('No completed scoring weeks');
});
it('allows only one simultaneous request per account even during CLI discovery', async () => {
  let finish!: (value: string) => void;
  mocks.chat.mockImplementation(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const input = { ...selection, provider: 'codex', model: '', approved: true };
  const first = generateWriting('owner', input);
  const second = generateWriting('owner', input);
  await expect(second).rejects.toMatchObject({ status: 409 });
  await vi.waitFor(() => expect(mocks.chat).toHaveBeenCalledTimes(1));
  finish('A suggestion');
  await expect(first).resolves.toBe('A suggestion');
});
