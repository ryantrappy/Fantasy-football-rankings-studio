// @vitest-environment node
const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  instructions: vi.fn(),
  saveInstructions: vi.fn(),
  header: vi.fn(),
  status: vi.fn(),
}));
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    validator() {
      return this;
    },
    handler(fn: unknown) {
      return fn;
    },
  }),
}));
vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeader: () => 'Bearer user-token',
  setResponseHeader: mocks.header,
  setResponseStatus: mocks.status,
}));
vi.mock('../server/auth.server', () => ({ verifyAuthorization: mocks.verify }));
vi.mock('../server/profile.server', () => ({
  getProfile: mocks.get,
  updateProfile: mocks.update,
  getWritingInstructions: mocks.instructions,
  saveWritingInstructions: mocks.saveInstructions,
}));
import {
  getProfile,
  updateProfile,
  getWritingInstructions,
  saveWritingInstructions,
} from './profile.functions';
import HttpException from '../server/exceptions/HttpException';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.verify.mockResolvedValue('auth0|verified');
  mocks.get.mockResolvedValue({ name: 'Verified' });
  mocks.update.mockResolvedValue({ name: 'Updated' });
  mocks.instructions.mockResolvedValue({ instructions: 'Private style' });
  mocks.saveInstructions.mockResolvedValue({ instructions: 'Updated style' });
});
it('derives reads and writes from verified authorization and disables caching', async () => {
  await getProfile();
  await updateProfile({ data: { name: 'Updated', nickname: 'Nick' } });
  expect(mocks.verify).toHaveBeenCalledWith('Bearer user-token');
  expect(mocks.get).toHaveBeenCalledWith('auth0|verified');
  expect(mocks.update).toHaveBeenCalledWith('auth0|verified', {
    name: 'Updated',
    nickname: 'Nick',
  });
  expect(mocks.header).toHaveBeenCalledWith('Cache-Control', 'no-store');
});
it('never calls profile services when authorization fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.verify.mockRejectedValue(new HttpException(401, 'Sign in.'));
  expect(await getProfile()).toMatchObject({ ok: false, error: { status: 401 } });
  expect(await updateProfile({ data: { name: 'A', nickname: 'B' } })).toMatchObject({
    ok: false,
    error: { status: 401 },
  });
  expect(mocks.get).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

it('scopes writing-instruction reads and writes to the verified subject with no caching', async () => {
  expect(await getWritingInstructions()).toEqual({
    ok: true,
    data: { instructions: 'Private style' },
  });
  expect(await saveWritingInstructions({ data: { instructions: 'Updated style' } })).toEqual({
    ok: true,
    data: { instructions: 'Updated style' },
  });
  expect(mocks.instructions).toHaveBeenCalledWith('auth0|verified');
  expect(mocks.saveInstructions).toHaveBeenCalledWith('auth0|verified', {
    instructions: 'Updated style',
  });
  expect(mocks.header).toHaveBeenCalledWith('Cache-Control', 'no-store');
  mocks.verify.mockResolvedValue('auth0|other');
  await getWritingInstructions();
  expect(mocks.instructions).toHaveBeenLastCalledWith('auth0|other');
});

it('rejects unauthenticated instruction reads and writes before touching account metadata', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.verify.mockRejectedValue(new HttpException(401, 'Sign in.'));
  expect(await getWritingInstructions()).toMatchObject({ ok: false, error: { status: 401 } });
  expect(await saveWritingInstructions({ data: { instructions: 'Private style' } })).toMatchObject({
    ok: false,
    error: { status: 401 },
  });
  expect(mocks.instructions).not.toHaveBeenCalled();
  expect(mocks.saveInstructions).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
