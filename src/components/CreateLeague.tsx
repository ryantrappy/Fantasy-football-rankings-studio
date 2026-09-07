import { useState, type FormEvent } from 'react';
import type { League, LeagueApi } from '../types';
import { errorMessage } from '../api/client';
import { defaultSeason } from '../util/rankings';
import { Icon } from './Icon';

export function CreateLeague({ api, onCreated, onCancel }: { api: LeagueApi; onCreated: (league: League) => void; onCancel: () => void }) {
  const [provider, setProvider] = useState<0 | 1>(0);
  const [leagueId, setLeagueId] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [season, setSeason] = useState(defaultSeason());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!leagueId.trim()) { setError('Enter the league ID from your fantasy platform.'); return; }
    setBusy(true);
    setError('');
    try {
      const league = await api.createLeague({ leagueId: leagueId.trim(), leagueName: leagueName.trim(), leagueType: provider, seasonId: season });
      onCreated(league);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }

  return <div className="create-page">
    <button className="text-button" onClick={onCancel} disabled={busy}>← Back to rankings</button>
    <div className="page-heading"><p className="eyebrow">A new season of opinions</p><h1>Create a league.</h1><p>Bring your league into the studio. We’ll take care of the teams.</p></div>
    <div className="create-layout">
      <form className="panel league-form" onSubmit={submit}>
        <fieldset disabled={busy}>
          <legend>01 <span>Choose your platform</span></legend>
          <div className="provider-options">
            <label className={`provider-option ${provider === 0 ? 'selected' : ''}`}><input type="radio" name="provider" value="0" checked={provider === 0} onChange={() => setProvider(0)} /><span><strong>Sleeper</strong><small>Connect a Sleeper league</small></span></label>
            <label className={`provider-option ${provider === 1 ? 'selected' : ''}`}><input type="radio" name="provider" value="1" checked={provider === 1} onChange={() => setProvider(1)} /><span><strong>ESPN</strong><small>Connect an ESPN league</small></span></label>
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>02 <span>Make it yours</span></legend>
          <div className="field"><label htmlFor="league-id">League ID <span className="required">Required</span></label><input id="league-id" name="leagueId" inputMode="numeric" pattern="[0-9]+" maxLength={30} required value={leagueId} onChange={(event) => { setLeagueId(event.target.value); setError(''); }} placeholder="Enter your league ID" aria-describedby="league-id-help" /><small id="league-id-help">Copy the numeric ID from your league’s URL. Keep the full ID, including any leading zeros.</small></div>
          <div className="field"><label htmlFor="league-name">Display name <span>Optional</span></label><input id="league-name" name="leagueName" maxLength={120} value={leagueName} onChange={(event) => setLeagueName(event.target.value)} placeholder="Use the name from your platform" /></div>
          <div className="field"><label htmlFor="league-season">Season</label><input className="season-field" id="league-season" name="season" type="number" min={2000} max={2100} required value={season} onChange={(event) => setSeason(Number(event.target.value))} /></div>
        </fieldset>
        {error && <div className="notice error" role="alert">{error}</div>}
        <div className="form-footer"><p>Your league is checked before it’s added.</p><button className="button primary" type="submit" disabled={busy}>{busy ? 'Connecting league…' : 'Create league'}{!busy && <Icon name="arrow" />}</button></div>
      </form>
      <aside className="creation-guide"><span className="guide-mark"><Icon name="ball" size={30} /></span><h2>Your league.<br />Your point of view.</h2><p>This creates a rankings workspace for a league you already run on Sleeper or ESPN.</p><ol><li><strong>Find your league ID</strong><span>Open your league in a browser. Sleeper uses the number after /leagues/; ESPN uses the leagueId parameter.</span></li><li><strong>Bring in your teams</strong><span>Team names, managers, and records are loaded automatically.</span></li><li><strong>Set the pecking order</strong><span>Reorder the field, add your commentary, and export the finished rankings.</span></li></ol><p className="guide-footnote">Private ESPN leagues need server access configured by your administrator.</p></aside>
    </div>
  </div>;
}
