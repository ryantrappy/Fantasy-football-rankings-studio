import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { League, LeagueApi, WeeklyRanking } from '../types';
import { useRankingEditor } from '../hooks/useRankingEditor';
import { moveTeam } from '../util/rankings';
import { errorMessage } from '../api/client';
import { RankingPreview } from './RankingPreview';
import { Icon } from './Icon';

export interface EditorHandle { flush: () => Promise<void> }

export const RankingEditor = forwardRef<EditorHandle, { api: LeagueApi; league: League; year: number; week: number }>(function RankingEditor({ api, league, year, week }, ref) {
  const editor = useRankingEditor(api, league, year, week);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [undo, setUndo] = useState<WeeklyRanking>();
  const preview = useRef<HTMLDivElement>(null);
  const dragged = useRef<number>(undefined);
  useImperativeHandle(ref, () => ({ flush: () => editor.flush() }), [editor.flush]);

  function reorder(from: number, to: number) {
    if (from === to) return;
    setUndo(editor.ranking);
    editor.update((ranking) => ({ ...ranking, teams: moveTeam(ranking.teams, from, to) }));
    setAnnouncement(`${editor.ranking.teams[from].teamName} moved to rank ${to + 1}.`);
  }

  async function download() {
    if (!preview.current || exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const { toPng } = await import('html-to-image');
      const image = await toPng(preview.current, { pixelRatio: 2, backgroundColor: '#fffdf8' });
      const link = document.createElement('a');
      link.download = `power-rankings-${year}-week-${week}.png`;
      link.href = image;
      link.click();
    } catch (error) { setExportError(`Image export failed: ${errorMessage(error)}`); }
    finally { setExporting(false); }
  }

  if (editor.loading) return <div className="panel loading-state" role="status"><span className="loading-bar" /><h2>Getting the field ready…</h2><p>Loading your saved rankings and league teams.</p></div>;
  if (editor.loadError) return <div className="panel empty-state"><h2>We couldn’t load this week.</h2><p role="alert">{editor.loadError}</p><button className="button primary" onClick={editor.reload}>Try again</button></div>;
  const ranking = editor.ranking;
  if (!ranking) return null;
  if (!ranking.teams.length) return <div className="panel empty-state"><h2>No teams on the field yet.</h2><p>Check that your league has teams for the selected season, then refresh.</p><button className="button secondary" onClick={editor.reload}>Refresh teams</button></div>;
  const comments = ranking.teams.filter((team) => team.description.trim()).length;

  return <>
    <div className="editor-topline"><div className="view-switch" aria-label="Ranking view"><button aria-pressed={tab === 'edit'} onClick={() => setTab('edit')}>Edit rankings</button><button aria-pressed={tab === 'preview'} onClick={() => setTab('preview')}>Preview & export</button></div><span className={`save-status ${editor.saveError ? 'failed' : ''}`} role="status">{editor.saving ? 'Saving changes…' : editor.saveError ? 'Changes not saved' : editor.dirty ? 'Unsaved changes' : editor.savedAt || ranking._id ? 'All changes saved' : 'New draft · save when ready'}{!editor.dirty && ranking._id && <Icon name="check" size={15} />}</span></div>
    {editor.saveError && <div className="notice error" role="alert"><div><strong>Your changes are still here.</strong><p>{editor.saveError}</p></div><button className="button secondary" onClick={() => void editor.flush().catch(() => {})}>Retry save</button></div>}
    <div className={`editor-layout showing-${tab}`}>
      <section className="editor-panel panel" aria-label="Ranking editor">
        <div className="section-heading"><div><span className="eyebrow">The weekly edition</span><h2>Make your case.</h2></div><span className="week-stamp">W{String(week).padStart(2, '0')}</span></div>
        <div className="editor-fields"><div className="field"><label htmlFor="ranking-title">Edition title</label><input id="ranking-title" name="rankingsTitle" maxLength={200} value={ranking.rankingsTitle} onChange={(event) => editor.update((current) => ({ ...current, rankingsTitle: event.target.value }))} /></div><div className="field"><label htmlFor="ranking-intro">Opening take <span>Optional</span></label><textarea id="ranking-intro" name="introduction" rows={3} maxLength={10000} placeholder="Set the scene for this week…" value={ranking.introduction} onChange={(event) => editor.update((current) => ({ ...current, introduction: event.target.value }))} /></div></div>
        <div className="teams-heading"><div><h3>Set the order</h3><p>Drag a team or use the arrows. Add a take below.</p></div><button className="text-button" disabled={!undo} onClick={() => { if (undo) { editor.update(() => undo); setUndo(undefined); setAnnouncement('Previous order restored.'); } }}>Undo move</button></div>
        <ol className="team-editor-list">{ranking.teams.map((team, index) => <li className="team-editor" key={team.teamId} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (dragged.current !== undefined) reorder(dragged.current, index); dragged.current = undefined; }}>
          <div className="team-editor-heading"><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><div className="team-identity"><strong>{team.teamName}</strong><small>{team.managerName || 'Unassigned manager'} <span>· {team.wins}–{team.loss}{team.ties ? `–${team.ties}` : ''}</span></small></div><div className="reorder-controls"><button title="Drag to reorder" className="drag-handle" draggable onDragStart={(event) => { dragged.current = index; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', team.teamId); }} onDragEnd={() => { dragged.current = undefined; }} aria-label={`Drag ${team.teamName} to reorder`} tabIndex={-1}>⠿</button><button disabled={index === 0} onClick={() => reorder(index, index - 1)} aria-label={`Move ${team.teamName} up`}><Icon name="up" size={16} /></button><button disabled={index === ranking.teams.length - 1} onClick={() => reorder(index, index + 1)} aria-label={`Move ${team.teamName} down`}><Icon name="down" size={16} /></button></div></div>
          <textarea aria-label={`Commentary for ${team.teamName}`} name={`comment-${team.teamId}`} rows={2} maxLength={10000} placeholder="What’s the story with this team?" value={team.description} onChange={(event) => editor.update((current) => ({ ...current, teams: current.teams.map((entry) => entry.teamId === team.teamId ? { ...entry, description: event.target.value } : entry) }))} />
        </li>)}</ol>
        <div className="editor-footer"><span>{comments} of {ranking.teams.length} takes written</span><button className="button primary" disabled={editor.saving || (!editor.dirty && !!ranking._id)} onClick={() => void editor.flush(true).catch(() => {})}>{editor.saving ? 'Saving…' : 'Save rankings'}<Icon name="check" size={17} /></button></div>
      </section>
      <section className="preview-panel" aria-label="Live ranking preview"><div className="preview-toolbar"><div><span className="live-dot" /> Live preview</div><button className="text-button" onClick={download} disabled={exporting}><Icon name="download" size={16} />{exporting ? 'Exporting…' : 'Download PNG'}</button></div>{exportError && <div className="notice error" role="alert">{exportError}</div>}<div ref={preview}><RankingPreview ranking={ranking} history={editor.history} league={league} /></div><p className="preview-note">Your changes appear here as you type. Movement compares with the previous week’s saved rankings.</p></section>
    </div>
    <p className="sr-only" role="status">{announcement}</p>
  </>;
});
