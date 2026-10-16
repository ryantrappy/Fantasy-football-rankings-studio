import { act, renderHook } from '@testing-library/react';
import { useExportTheme } from './useExportTheme';

beforeEach(() => window.localStorage.clear());

it('defaults to Classic and persists the choice per account across visits', () => {
  const first = renderHook(() => useExportTheme('owner-a'));
  expect(first.result.current.theme).toBe('classic');
  act(() => first.result.current.selectTheme('new'));
  first.unmount();
  const next = renderHook(({ subject }) => useExportTheme(subject), {
    initialProps: { subject: 'owner-a' },
  });
  expect(next.result.current.theme).toBe('new');
  next.rerender({ subject: 'owner-b' });
  expect(next.result.current.theme).toBe('classic');
  act(() => next.result.current.selectTheme('classic'));
  next.rerender({ subject: 'owner-a' });
  expect(next.result.current.theme).toBe('new');
});

it('ignores invalid preferences and handles unavailable storage without blocking exports', () => {
  window.localStorage.setItem('ranking-export-theme:v1:owner', 'invalid');
  const hook = renderHook(() => useExportTheme('owner'));
  expect(hook.result.current.theme).toBe('classic');
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage unavailable');
  });
  act(() => hook.result.current.selectTheme('new'));
  expect(hook.result.current.theme).toBe('new');
  expect(hook.result.current.storageError).toContain('could not be saved');
  write.mockRestore();
});

it('does not share anonymous choices with a later account', () => {
  const hook = renderHook(({ subject }: { subject?: string }) => useExportTheme(subject), {
    initialProps: {},
  });
  act(() => hook.result.current.selectTheme('new'));
  hook.rerender({ subject: 'owner' });
  expect(hook.result.current.theme).toBe('classic');
  expect(window.localStorage.length).toBe(0);
});
