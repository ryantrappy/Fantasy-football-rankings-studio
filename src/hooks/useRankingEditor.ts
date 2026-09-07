import { useCallback, useEffect, useRef, useState } from 'react';
import type { League, LeagueApi, WeeklyRanking } from '../types';
import { errorMessage } from '../api/client';
import { newRanking, orderTeams, rankingSignature } from '../util/rankings';

export function useRankingEditor(api: LeagueApi, league: League, year: number, week: number) {
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
  const inFlight = useRef<Promise<void>>(undefined);
  const alive = useRef(true);
  const dirty = !!ranking && rankingSignature(ranking) !== saved.current;

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    (async () => {
      const entries = await api.getRankings(league.leagueId);
      let current = entries.find((entry) => entry.year === year && entry.week === week);
      if (!current) current = newRanking(league, year, week, await api.getTeams(league.leagueId, year, week));
      current = { ...current, teams: orderTeams(current.teams) };
      if (cancelled) return;
      latest.current = current;
      saved.current = rankingSignature(current);
      setHistory(entries);
      setRanking(current);
    })().catch((error) => { if (!cancelled) setLoadError(errorMessage(error)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; alive.current = false; };
  }, [api, league, year, week, retry]);

  const update = useCallback((change: (current: WeeklyRanking) => WeeklyRanking) => {
    if (!latest.current) return;
    latest.current = change(latest.current);
    setRanking(latest.current);
    setSaveError('');
  }, []);

  const flush = useCallback((force = false): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    if (!latest.current || (!force && rankingSignature(latest.current) === saved.current)) return Promise.resolve();
    setSaving(true);
    setSaveError('');
    const persist = async () => {
      let createRequested = force && !latest.current?._id;
      while (latest.current && (createRequested || rankingSignature(latest.current) !== saved.current)) {
        createRequested = false;
        const snapshot = latest.current;
        const signature = rankingSignature(snapshot);
        const result = await api.saveRanking(snapshot);
        if (!result._id) throw new Error('The server did not return a ranking ID. Please retry.');
        saved.current = signature;
        latest.current = { ...latest.current, _id: result._id };
        if (alive.current) { setRanking(latest.current); setSavedAt(new Date()); }
      }
    };
    inFlight.current = persist().catch((error) => {
      if (alive.current) setSaveError(errorMessage(error));
      throw error;
    }).finally(() => {
      inFlight.current = undefined;
      if (alive.current) setSaving(false);
    });
    return inFlight.current;
  }, [api]);

  useEffect(() => {
    if (!dirty || saveError) return;
    const timer = window.setTimeout(() => { void flush().catch(() => {}); }, 1000);
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

  return { ranking, history, loading, loadError, saveError, saving, savedAt, dirty, update, flush, reload: () => setRetry((value) => value + 1) };
}
