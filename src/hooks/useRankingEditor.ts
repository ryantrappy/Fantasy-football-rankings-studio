import { draftKey, readDraft, writeDraft, clearSavedDraft } from '../draft-storage';
import { logClientError } from '../logging';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { League, LeagueApi, WeeklyRanking } from '../types';
import { errorMessage } from '../api/client';
import { newRanking, orderTeams, rankingSignature } from '../util/rankings';

export function useRankingEditor(api: LeagueApi, league: League, year: number, week: number) {
  const storageKey = draftKey(api.subject, league.leagueId, year, week);
  const [recovery, setRecovery] = useState<WeeklyRanking>();
  const recoveryPending = useRef(false);
  const [storageError, setStorageError] = useState('');
  const [ranking, setRanking] = useState<WeeklyRanking>();
  const [history, setHistory] = useState<WeeklyRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date>();
  const [retry, setRetry] = useState(0);
  const latest = useRef<WeeklyRanking>(undefined);
  const saved = useRef('');
  const [savedSignature, setSavedSignature] = useState('');
  const inFlight = useRef<Promise<void>>(undefined);
  const alive = useRef(true);
  const dirty = !!ranking && rankingSignature(ranking) !== savedSignature;

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    // Loading is reset when the external league/week request changes.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setLoadError('');
    (async () => {
      const entries = await api.getRankings(league.leagueId);
      let current = entries.find((entry) => entry.year === year && entry.week === week);
      if (!current)
        current = newRanking(league, year, week, await api.getTeams(league.leagueId, year, week));
      current = { ...current, teams: orderTeams(current.teams) };
      if (cancelled) return;
      try {
        const draft = readDraft(storageKey, current);
        recoveryPending.current = !!draft && rankingSignature(draft) !== rankingSignature(current);
        setRecovery(recoveryPending.current ? draft : undefined);
      } catch (error) {
        logClientError('draft.read', error);
        setStorageError(
          'Local draft recovery is unavailable. Keep this tab open until changes are saved.',
        );
      }
      latest.current = current;
      saved.current = rankingSignature(current);
      setSavedSignature(saved.current);
      setHistory(entries);
      setRanking(current);
    })()
      .catch((error) => {
        logClientError('useRankingEditor', error);
        if (!cancelled) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      alive.current = false;
    };
  }, [api, league, year, week, retry, storageKey]);

  const update = useCallback(
    (change: (current: WeeklyRanking) => WeeklyRanking) => {
      if (!latest.current || recoveryPending.current) return;
      latest.current = change(latest.current);
      try {
        writeDraft(storageKey, latest.current);
      } catch (error) {
        logClientError('draft.write', error);
        setStorageError('Local draft backup failed. Keep this tab open until changes are saved.');
      }
      setRanking(latest.current);
      setSaveError('');
    },
    [storageKey],
  );

  const flush = useCallback(
    (force = false): Promise<void> => {
      if (recoveryPending.current)
        return Promise.reject(
          new Error('Restore or discard the recovered draft before continuing.'),
        );
      if (inFlight.current) return inFlight.current;
      if (!latest.current || (!force && rankingSignature(latest.current) === saved.current))
        return Promise.resolve();
      setSaving(true);
      setSaveError('');
      const persist = async () => {
        let createRequested = force && !latest.current?._id;
        while (
          latest.current &&
          (createRequested || rankingSignature(latest.current) !== saved.current)
        ) {
          createRequested = false;
          const snapshot = latest.current;
          const signature = rankingSignature(snapshot);
          const result = await api.saveRanking(snapshot);
          if (!result._id) throw new Error('The server did not return a ranking ID. Please retry.');
          try {
            clearSavedDraft(storageKey, snapshot);
          } catch (error) {
            logClientError('draft.clear', error);
          }
          saved.current = signature;
          latest.current = { ...latest.current, _id: result._id };
          if (alive.current) {
            setSavedSignature(signature);
            setRanking(latest.current);
            setSavedAt(new Date());
          }
        }
      };
      inFlight.current = persist()
        .catch((error) => {
          logClientError('useRankingEditor', error);
          if (alive.current) setSaveError(errorMessage(error));
          throw error;
        })
        .finally(() => {
          inFlight.current = undefined;
          if (alive.current) setSaving(false);
        });
      return inFlight.current;
    },
    [api, storageKey],
  );

  useEffect(() => {
    if (!dirty || saveError) return;
    const timer = window.setTimeout(() => {
      void flush().catch(() => {});
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [ranking, dirty, flush, saveError]);

  useEffect(() => {
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (latest.current && rankingSignature(latest.current) !== saved.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, []);

  return {
    recovery,
    storageError,
    restoreDraft: () => {
      if (!recovery || !latest.current) return;
      const draft = { ...recovery, _id: latest.current._id };
      recoveryPending.current = false;
      setRecovery(undefined);
      update(() => draft);
    },
    discardDraft: () => {
      try {
        if (storageKey) window.localStorage.removeItem(storageKey);
      } catch (error) {
        logClientError('draft.discard', error);
        setStorageError('Could not remove the local backup.');
      }
      recoveryPending.current = false;
      setRecovery(undefined);
    },
    ranking,
    history,
    loading,
    loadError,
    saveError,
    saving,
    savedAt,
    dirty,
    update,
    flush,
    reload: () => setRetry((value) => value + 1),
  };
}
