import { createFileRoute, Link, useBlocker } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '../auth/Authentication';
import { errorMessage } from '../api/client';
import { RankingEditor, type EditorHandle } from '../components/RankingEditor';
import { useLiveQuery } from '@tanstack/react-db';
import { defaultSeason } from '../util/rankings';

export const Route = createFileRoute('/_authenticated/')({ component: RankingsPage });

function RankingsPage() {
  const api = useApi();
  const { data: leagues = [] } = useLiveQuery({
    query: (q) =>
      q.from({ league: api.leagueCollection }).orderBy(({ league }) => league.leagueName, 'asc'),
  });
  const [selected, setSelected] = useState('');
  const [year, setYear] = useState(defaultSeason);
  const [week, setWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [switching, setSwitching] = useState(false);
  const editor = useRef<EditorHandle>(null);
  useBlocker({
    shouldBlockFn: async () => {
      try {
        await editor.current?.flush();
        return false;
      } catch (failure) {
        setError(errorMessage(failure));
        return true;
      }
    },
    enableBeforeUnload: false,
  });

  useEffect(() => {
    let cancelled = false;
    api
      .listLeagues()
      .then((entries) => {
        if (cancelled) return;
        setSelected(entries[0]?.leagueId || '');
        setYear(entries[0]?.seasonId || defaultSeason());
      })
      .catch((failure) => {
        if (!cancelled) setError(errorMessage(failure));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, retry]);

  async function changeSelection(change: () => void) {
    setSwitching(true);
    try {
      await editor.current?.flush();
      setError('');
      change();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSwitching(false);
    }
  }
  const league = leagues.find((entry) => entry.leagueId === selected);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">The weekly edition</p>
          <h1>Power rankings studio</h1>
        </div>
        <Link className="button primary" to="/leagues/new">
          Create league
        </Link>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
          {!leagues.length && (
            <button
              onClick={() => {
                setLoading(true);
                setError('');
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}
      {loading ? (
        <output>Loading leagues…</output>
      ) : league ? (
        <>
          <fieldset className="selection-bar" disabled={switching}>
            <legend className="sr-only">Choose rankings</legend>
            <label>
              League
              <select
                value={selected}
                onChange={(event) => {
                  const id = event.target.value;
                  void changeSelection(() => {
                    setSelected(id);
                    setYear(
                      leagues.find((entry) => entry.leagueId === id)?.seasonId || defaultSeason(),
                    );
                  });
                }}
              >
                {leagues.map((entry) => (
                  <option key={entry.leagueId} value={entry.leagueId}>
                    {entry.leagueName || entry.leagueId}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Season
              <select
                value={year}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  void changeSelection(() => setYear(value));
                }}
              >
                {Array.from({ length: 101 }, (_, index) => 2100 - index).map((season) => (
                  <option key={season}>{season}</option>
                ))}
              </select>
            </label>
            <label>
              Week
              <select
                value={week}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  void changeSelection(() => setWeek(value));
                }}
              >
                {Array.from({ length: 18 }, (_, index) => index + 1).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </fieldset>
          <RankingEditor
            key={`${selected}-${year}-${week}`}
            ref={editor}
            api={api}
            league={league}
            year={year}
            week={week}
          />
        </>
      ) : (
        !error && (
          <section className="panel">
            <h2>Create your first league</h2>
            <p>Connect a Sleeper or ESPN league to start ranking your teams.</p>
            <Link to="/leagues/new">Create league</Link>
          </section>
        )
      )}
    </>
  );
}
