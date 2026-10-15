import { PageHeading } from './PageHeading';
import { LoadingSkeleton } from './LoadingSkeleton';
import { CopyEdition } from './CopyEdition';
import { RevisionHistory } from './RevisionHistory';
import { PublishEdition } from './PublishEdition';
import { WritingSuggestions } from './WritingSuggestions';
import { logClientError } from '../logging';
import {
  Box,
  Button,
  Field,
  Flex,
  Grid,
  Heading,
  IconButton,
  Input,
  Text,
  Textarea,
  chakra,
} from '@chakra-ui/react';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import type { League, LeagueApi, WeeklyRanking } from '../types';
import { useRankingEditor } from '../hooks/useRankingEditor';
import { moveTeam, previousPosition } from '../util/rankings';
import { errorMessage } from '../api/client';
import { RankingPreview } from './RankingPreview';
import { Icon } from './Icon';
import { SortableRankingList } from './SortableRankingList';
import { KeyboardShortcutReference } from './KeyboardShortcutReference';
import { InfoTooltip } from './InfoTooltip';

export interface EditorHandle {
  flush: () => Promise<void>;
}

export const RankingEditor = forwardRef<
  EditorHandle,
  {
    api: LeagueApi;
    league: League;
    year: number;
    week: number;
    initialEditingMode?: 'focused' | 'all';
    showHeading?: boolean;
  }
>(function RankingEditor(
  { api, league, year, week, initialEditingMode = 'focused', showHeading = true },
  ref,
) {
  const editor = useRankingEditor(api, league, year, week);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [editingMode, setEditingMode] = useState(initialEditingMode);
  const [teamSelection, setTeamSelection] = useState({ scope: '', teamId: '' });
  const tools = useRef<HTMLDetailsElement>(null);
  const teamDetail = useRef<HTMLElement>(null);
  const [exporting, setExporting] = useState<'original' | 'compact' | null>(null);
  const [exportError, setExportError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [undo, setUndo] = useState<WeeklyRanking>();
  const rankingScope = `${league.leagueId}:${year}:${week}`;
  const [aiSummaries, setAiSummaries] = useState<{
    scope: string;
    values: Record<string, string>;
  }>({ scope: rankingScope, values: {} });
  const [aiReady, setAiReady] = useState(false);
  const [aiGeneratingTeam, setAiGeneratingTeam] = useState<string>();
  const aiController = useRef<{ generate: (teamId: string) => Promise<void> } | undefined>(
    undefined,
  );
  const layout = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const previewViewport = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewFormat, setPreviewFormat] = useState<'original' | 'compact'>('original');
  const previewWidth = previewFormat === 'compact' ? 720 : 1304;
  useEffect(() => {
    const viewport = previewViewport.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      setPreviewScale(Math.min(1, entry.contentRect.width / previewWidth));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [editor.loading, editor.loadError, tab, previewWidth]);
  useEffect(() => {
    const workspace = layout.current;
    const header = document.querySelector('.workspace-header');
    if (!workspace || !header) return;
    const resize = () => {
      workspace.style.setProperty(
        '--ranking-header-height',
        `${header.getBoundingClientRect().height}px`,
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(header);
    resize();
    return () => observer.disconnect();
  }, [editor.loading, editor.loadError]);
  const { flush } = editor;
  useImperativeHandle(ref, () => ({ flush: () => flush() }), [flush]);

  function reorder(from: number, to: number) {
    if (from === to || !editor.ranking) return;
    setUndo(editor.ranking);
    editor.update((ranking) => ({ ...ranking, teams: moveTeam(ranking.teams, from, to) }));
    setAnnouncement(`${editor.ranking.teams[from].teamName} moved to rank ${to + 1}.`);
  }

  async function download(format: 'original' | 'compact') {
    if (!preview.current || exporting) return;
    setExporting(format);
    setExportError('');
    const exportHost = document.createElement('div');
    exportHost.setAttribute('aria-hidden', 'true');
    exportHost.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none';
    try {
      await document.fonts.ready;
      const { toPng } = await import('html-to-image');
      // Measure at the original size before html-to-image copies computed styles.
      // Resetting zoom only in toPng is too late: scaled table geometry is rounded.
      const canvas = preview.current.cloneNode(true) as HTMLDivElement;
      canvas.style.zoom = '1';
      canvas.classList.toggle('compact-export', format === 'compact');
      // Export header labels without the interactive preview's sorting controls.
      canvas.querySelectorAll('.table-sort-indicator').forEach((indicator) => indicator.remove());
      canvas.querySelectorAll('.table-sort-button').forEach((button) => {
        button.replaceWith(document.createTextNode(button.textContent || ''));
      });
      exportHost.appendChild(canvas);
      document.body.appendChild(exportHost);
      const image = await toPng(canvas, {
        pixelRatio: 1,
        backgroundColor: '#f8f8f2',
        style: { zoom: '1' },
      });
      const link = document.createElement('a');
      link.download = `power-rankings-${year}-week-${week}${format === 'compact' ? '-compact' : ''}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      logClientError('RankingEditor', error);
      setExportError(`Image export failed: ${errorMessage(error)}`);
    } finally {
      exportHost.remove();
      setExporting(null);
    }
  }

  const pageHeading = showHeading && (
    <PageHeading
      title="Rankings studio"
      eyebrow={`${league.leagueName} · ${year} · Week ${week}`}
      description="Set the order, write your take, and turn this week’s story into an edition worth sharing."
    />
  );
  if (editor.loading)
    return (
      <>
        {pageHeading}
        <LoadingSkeleton
          label="Getting the field ready…"
          description="Loading your saved rankings and league teams."
        />
      </>
    );
  if (editor.loadError)
    return (
      <Box
        bg="bg"
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border"
        rounded="lg"
        p={{ base: 4, md: 6 }}
        className="panel empty-state"
      >
        <Heading as="h2" size="xl" mb={4}>
          We couldn’t load this week.
        </Heading>
        <Text mb={4} role="alert">
          {editor.loadError}
        </Text>
        <Button colorPalette="indigo" variant="solid" type="button" onClick={editor.reload}>
          Try again
        </Button>
      </Box>
    );
  const ranking = editor.ranking;
  if (!ranking) return null;
  if (!ranking.teams.length)
    return (
      <Box
        bg="bg"
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border"
        rounded="lg"
        p={{ base: 4, md: 6 }}
        className="panel empty-state"
      >
        <Heading as="h2" size="xl" mb={4}>
          No teams on the field yet.
        </Heading>
        <Text mb={4}>Check that your league has teams for the selected season, then refresh.</Text>
        <Button variant="outline" type="button" onClick={editor.reload}>
          Refresh teams
        </Button>
      </Box>
    );
  const comments = ranking.teams.filter((team) => team.description.trim()).length;

  const selectedTeam =
    ranking.teams.find(
      (team) => teamSelection.scope === rankingScope && team.teamId === teamSelection.teamId,
    ) || ranking.teams[0];
  if (teamSelection.scope !== rankingScope || teamSelection.teamId !== selectedTeam.teamId) {
    setTeamSelection({ scope: rankingScope, teamId: selectedTeam.teamId });
  }
  function openEditionTools(selector?: string) {
    const panel = tools.current;
    if (!panel) return;
    panel.open = true;
    const target = selector ? panel.querySelector<HTMLElement>(selector) : panel;
    const disclosure = target?.closest('details');
    if (disclosure) disclosure.open = true;
    target?.scrollIntoView({ block: 'nearest' });
    const control = target?.matches('summary, button')
      ? target
      : target?.querySelector<HTMLElement>('summary, button');
    control?.focus();
  }
  const renderTeamTake = (team: WeeklyRanking['teams'][number]) => (
    <>
      <Textarea
        aria-label={`Commentary for ${team.teamName}`}
        name={`comment-${team.teamId}`}
        rows={2}
        maxLength={10000}
        placeholder="What’s the story with this team?"
        value={team.description}
        onChange={(event) =>
          editor.update((current) => ({
            ...current,
            teams: current.teams.map((entry) =>
              entry.teamId === team.teamId ? { ...entry, description: event.target.value } : entry,
            ),
          }))
        }
      />
      <Button
        mt={3}
        size="sm"
        type="button"
        variant="outline"
        disabled={!aiReady || Boolean(aiGeneratingTeam && aiGeneratingTeam !== team.teamId)}
        onClick={() => void aiController.current?.generate(team.teamId)}
      >
        {aiGeneratingTeam === team.teamId ? 'Generating…' : 'Generate AI summary'}
      </Button>
      {aiSummaries.scope === rankingScope && Object.hasOwn(aiSummaries.values, team.teamId) && (
        <Box mt={3} p={3} bg="bg.subtle" borderWidth="1px" rounded="md">
          <Text fontWeight="bold" mb={1}>
            AI summary
          </Text>
          <Textarea
            aria-label={`AI suggestion for ${team.teamName}`}
            rows={5}
            value={aiSummaries.values[team.teamId]}
            onChange={(event) =>
              setAiSummaries((current) => ({
                ...current,
                values: { ...current.values, [team.teamId]: event.target.value },
              }))
            }
          />
          <Button
            type="button"
            mt={2}
            variant="outline"
            onClick={() =>
              editor.update((current) => ({
                ...current,
                teams: current.teams.map((entry) =>
                  entry.teamId === team.teamId
                    ? { ...entry, description: aiSummaries.values[team.teamId] }
                    : entry,
                ),
              }))
            }
          >
            Apply suggestion to take
          </Button>
        </Box>
      )}
    </>
  );

  return (
    <>
      {pageHeading}
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        flexWrap="wrap"
        mb={6}
        className="editor-topline ranking-view-tabs"
      >
        <Box className="view-switch" aria-label="Ranking view">
          <Button
            variant={tab === 'edit' ? 'solid' : 'outline'}
            colorPalette="indigo"
            type="button"
            aria-pressed={tab === 'edit'}
            onClick={() => setTab('edit')}
          >
            Edit rankings
          </Button>
          <Button
            variant={tab === 'preview' ? 'solid' : 'outline'}
            colorPalette="indigo"
            type="button"
            aria-pressed={tab === 'preview'}
            onClick={() => setTab('preview')}
          >
            Preview & export
          </Button>
        </Box>
        <chakra.output className={`save-status ${editor.saveError ? 'failed' : ''}`}>
          {editor.saving
            ? 'Saving changes…'
            : editor.saveError
              ? 'Changes not saved'
              : editor.dirty
                ? 'Unsaved changes'
                : editor.savedAt || ranking._id
                  ? 'All changes saved'
                  : 'New draft · save when ready'}
          {!editor.dirty && ranking._id && <Icon name="check" size={15} />}
        </chakra.output>
      </Flex>
      {editor.storageError && (
        <Text role="alert" mb={4}>
          {editor.storageError}
        </Text>
      )}
      {editor.recovery && (
        <Box as="section" aria-label="Recover unsaved ranking" className="notice" bg="bg.muted">
          <Heading as="h2" size="md">
            Unsaved work found on this browser
          </Heading>
          <Text mb={3}>
            Restore “{editor.recovery.rankingsTitle}” for this edition, or discard it to keep the
            saved version. Editing is paused until you choose.
          </Text>
          <Flex gap={2} flexWrap="wrap">
            <Button onClick={editor.restoreDraft}>Restore draft</Button>
            <Button variant="outline" onClick={editor.discardDraft}>
              Discard local draft
            </Button>
          </Flex>
        </Box>
      )}
      {editor.saveError && (
        <Box className="notice error" role="alert">
          <Box>
            <strong>Your changes are still here.</strong>
            <Text mb={4}>{editor.saveError}</Text>
          </Box>
          <Button
            variant="outline"
            type="button"
            disabled={editor.hasConflict}
            onClick={() => void editor.flush().catch(() => {})}
          >
            Retry save
          </Button>
        </Box>
      )}
      {editor.hasConflict && (
        <Box
          as="section"
          aria-label="Resolve save conflict"
          p={4}
          mb={4}
          borderWidth="1px"
          bg="bg.muted"
        >
          <Heading as="h2" size="md">
            Review the newer saved edition
          </Heading>
          <Button onClick={() => void editor.inspectConflict()} my={3}>
            Load saved version for comparison
          </Button>
          {editor.conflictVersion && (
            <>
              <Box maxH="400px" overflowY="auto" p={3} bg="bg" mb={3}>
                <Text fontWeight="bold">{editor.conflictVersion.rankingsTitle}</Text>
                <Text whiteSpace="pre-wrap">{editor.conflictVersion.introduction}</Text>
                {editor.conflictVersion.teams.map((t) => (
                  <Box key={t.teamId} mb={3}>
                    <Text fontWeight="bold">
                      {t.position}. {t.teamName}
                    </Text>
                    <Text whiteSpace="pre-wrap">{t.description}</Text>
                  </Box>
                ))}
              </Box>
              <Flex gap={2} flexWrap="wrap">
                <Button onClick={() => editor.resolveConflict(false)}>Use saved version</Button>
                <Button variant="outline" onClick={() => editor.resolveConflict(true)}>
                  Replace with my local draft
                </Button>
              </Flex>
            </>
          )}
        </Box>
      )}
      <Grid
        ref={layout}
        templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1.1fr)' }}
        gap={4}
        alignItems="stretch"
        className={`editor-layout showing-${tab}${editingMode === 'focused' ? ' ranking-focused' : ''}`}
      >
        <Box
          as="section"
          bg="bg"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border"
          rounded="lg"
          p={{ base: 4, md: 6 }}
          className="editor-panel panel"
          aria-label="Ranking editor"
        >
          <div className="ranking-studio-toolbar" aria-label="Edition actions">
            <Button
              colorPalette="indigo"
              variant="solid"
              type="button"
              disabled={editor.saving || (!editor.dirty && !!ranking._id)}
              onClick={() => void editor.flush(true).catch(() => {})}
            >
              {editor.saving ? 'Saving…' : 'Save rankings'}
              <Icon name="check" size={17} />
            </Button>{' '}
            <Button
              variant="plain"
              type="button"
              disabled={!undo}
              onClick={() => {
                if (undo) {
                  editor.update((current) => ({
                    ...current,
                    teams: [...current.teams].sort(
                      (a, b) =>
                        undo.teams.findIndex((team) => team.teamId === a.teamId) -
                        undo.teams.findIndex((team) => team.teamId === b.teamId),
                    ),
                  }));
                  setUndo(undefined);
                  setAnnouncement('Previous order restored.');
                }
              }}
            >
              Undo move
            </Button>
            <Button variant="outline" type="button" onClick={() => openEditionTools()}>
              Draft &amp; save status
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={
                !editor.history.some(
                  (entry) => entry.year < year || (entry.year === year && entry.week < week),
                )
              }
              onClick={() => openEditionTools('.editor-tools-content > details > summary')}
            >
              Copy edition
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={!api.revisions || !ranking._id}
              onClick={() => openEditionTools('[aria-label="Revision history"]')}
            >
              Revision history
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => openEditionTools('.shortcut-reference > summary')}
            >
              Shortcuts
            </Button>
          </div>
          <Box as="section" className="editor-setup" aria-label="Edition settings" mb={4}>
            <Box className="editor-fields">
              <Field.Root mb={5} gap={2} className="field">
                <Field.Label htmlFor="ranking-title">Edition title</Field.Label>
                <Input
                  id="ranking-title"
                  name="rankingsTitle"
                  maxLength={200}
                  value={ranking.rankingsTitle}
                  onChange={(event) =>
                    editor.update((current) => ({ ...current, rankingsTitle: event.target.value }))
                  }
                />
              </Field.Root>
              <Field.Root mb={5} gap={2} className="field">
                <Field.Label htmlFor="ranking-intro">
                  Opening take <span>Optional</span>
                </Field.Label>
                <Textarea
                  id="ranking-intro"
                  name="introduction"
                  rows={3}
                  maxLength={10000}
                  placeholder="Set the scene for this week…"
                  value={ranking.introduction}
                  onChange={(event) =>
                    editor.update((current) => ({ ...current, introduction: event.target.value }))
                  }
                />
              </Field.Root>
            </Box>
            <details className="editor-tools" ref={tools}>
              <summary>Edition tools, AI context sharing & keyboard shortcuts</summary>
              <Box className="editor-tools-content">
                {!ranking._id && (
                  <Text mb={4} role="note">
                    Suggested starting order uses completed scoring and point margin before this
                    week, with early results pulled toward the league average. It is a power signal,
                    not a player or season projection; adjust it with your own judgment before
                    saving.
                    {league.leagueType === 1 &&
                      ' ESPN matchups follow each scoring week’s published period. Multiweek aggregate scores and unavailable weekly scores are excluded from this suggestion.'}
                  </Text>
                )}
                <CopyEdition
                  ranking={ranking}
                  history={editor.history}
                  disabled={editor.saving || !!editor.recovery || editor.hasConflict}
                  onCopy={(next) => editor.update(() => next)}
                />
                {api.revisions && ranking._id && (
                  <RevisionHistory
                    key={`revisions:${ranking._id}`}
                    api={api.revisions}
                    ranking={ranking}
                    disabled={
                      editor.dirty || editor.saving || !!editor.recovery || editor.hasConflict
                    }
                    onRestored={editor.reload}
                  />
                )}
                {api.publishing && ranking._id && (
                  <PublishEdition
                    key={`publishing:${ranking._id}`}
                    api={api.publishing}
                    id={ranking._id}
                    revision={ranking.revision ?? 0}
                    disabled={
                      editor.dirty || editor.saving || !!editor.recovery || editor.hasConflict
                    }
                  />
                )}
                <KeyboardShortcutReference />
                {api.writing && (
                  <WritingSuggestions
                    api={api.writing}
                    leagueId={league.leagueId}
                    year={year}
                    week={week}
                    teams={ranking.teams}
                    selectedTeamId={selectedTeam.teamId}
                    onSummaryChange={(teamId, summary) =>
                      setAiSummaries((current) => ({
                        scope: rankingScope,
                        values: {
                          ...(current.scope === rankingScope ? current.values : {}),
                          [teamId]: summary,
                        },
                      }))
                    }
                    onControllerChange={(controller) => {
                      aiController.current = controller;
                      setAiReady(controller.ready);
                    }}
                    onGenerationStateChange={setAiGeneratingTeam}
                  />
                )}
              </Box>
            </details>
          </Box>
          <Flex
            align="center"
            justify="space-between"
            gap={4}
            flexWrap="wrap"
            mb={3}
            className="teams-heading"
          >
            <Box>
              <Heading as="h2" size="lg" mb={1}>
                Team entries
              </Heading>
              <Text fontSize="sm">
                Drag a team or use the arrows. Select a team to write its take.
              </Text>
            </Box>
            <Flex align="center" gap={3} flexWrap="wrap">
              <span className="ranking-progress-pill" aria-label="Take completion progress">
                <span>
                  {comments} of {ranking.teams.length} ready
                </span>
                <span className="ranking-mini-progress" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.round((comments / Math.max(1, ranking.teams.length)) * 100)}%`,
                    }}
                  />
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingMode((mode) => (mode === 'focused' ? 'all' : 'focused'))}
              >
                {editingMode === 'focused' ? 'Edit all takes' : 'Focus one team'}
              </Button>
            </Flex>
          </Flex>
          <Box
            as="section"
            className="team-entries-scroll"
            tabIndex={0}
            aria-label="Scrollable team entries"
          >
            <SortableRankingList
              teams={ranking.teams}
              onReorder={reorder}
              renderItem={(team, index, handle) => (
                <>
                  <Flex gap={3} align="center" mb={3} className="team-editor-heading">
                    <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                    <Box className="team-identity">
                      <button
                        type="button"
                        className="ranking-team-select"
                        aria-pressed={selectedTeam.teamId === team.teamId}
                        onClick={() => {
                          setTeamSelection({ scope: rankingScope, teamId: team.teamId });
                          if (window.matchMedia('(max-width: 991px)').matches) {
                            teamDetail.current?.scrollIntoView({ block: 'start' });
                            teamDetail.current?.focus({ preventScroll: true });
                          }
                        }}
                      >
                        <strong>{team.teamName}</strong>
                      </button>
                      <small>
                        {team.managerName || 'Unassigned manager'}{' '}
                        <span>
                          · {team.wins}–{team.loss}
                          {team.ties ? `–${team.ties}` : ''}
                        </span>
                      </small>
                      <span className="ranking-movement">
                        {(() => {
                          const previous = previousPosition(editor.history, ranking, team.teamId);
                          const delta = previous === undefined ? undefined : previous - index - 1;
                          return delta === undefined
                            ? 'New'
                            : delta === 0
                              ? 'No change'
                              : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}`;
                        })()}
                      </span>
                      {editingMode === 'focused' && (
                        <span className="ranking-take-meta">
                          <span
                            className={`ranking-take-badge ${team.description.trim() ? 'ready' : 'draft'}`}
                          >
                            {team.description.trim() ? '✓ Take ready' : 'Draft needed'}
                          </span>
                          <span className="ranking-take-snippet">
                            {team.description.trim() ||
                              'No commentary yet — select row to write or generate a suggestion.'}
                          </span>
                        </span>
                      )}
                    </Box>
                    <Flex gap={1} className="reorder-controls">
                      <IconButton
                        variant="outline"
                        type="button"
                        title="Drag to reorder"
                        {...handle}
                        className="ranking-drag-handle"
                        aria-label={`Drag ${team.teamName} to reorder`}
                      >
                        ⠿
                      </IconButton>
                      <IconButton
                        variant="outline"
                        type="button"
                        disabled={index === 0}
                        onClick={() => reorder(index, index - 1)}
                        aria-label={`Move ${team.teamName} up`}
                      >
                        <Icon name="up" size={16} />
                      </IconButton>
                      <IconButton
                        variant="outline"
                        type="button"
                        disabled={index === ranking.teams.length - 1}
                        onClick={() => reorder(index, index + 1)}
                        aria-label={`Move ${team.teamName} down`}
                      >
                        <Icon name="down" size={16} />
                      </IconButton>
                    </Flex>
                  </Flex>
                  {editingMode === 'all' && renderTeamTake(team)}
                </>
              )}
            />
          </Box>
        </Box>
        {editingMode === 'focused' && (
          <aside
            ref={teamDetail}
            tabIndex={-1}
            className="ranking-team-detail"
            aria-label="Selected team take"
          >
            <div className="ranking-detail-stepper">
              <p className="ranking-detail-context">
                Writing for rank {ranking.teams.indexOf(selectedTeam) + 1}
              </p>
              <Flex gap={1}>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={ranking.teams.indexOf(selectedTeam) <= 0}
                  onClick={() => {
                    const idx = ranking.teams.indexOf(selectedTeam);
                    if (idx > 0) {
                      setTeamSelection({
                        scope: rankingScope,
                        teamId: ranking.teams[idx - 1].teamId,
                      });
                    }
                  }}
                >
                  ← Prev
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={ranking.teams.indexOf(selectedTeam) >= ranking.teams.length - 1}
                  onClick={() => {
                    const idx = ranking.teams.indexOf(selectedTeam);
                    if (idx < ranking.teams.length - 1) {
                      setTeamSelection({
                        scope: rankingScope,
                        teamId: ranking.teams[idx + 1].teamId,
                      });
                    }
                  }}
                >
                  Next →
                </Button>
              </Flex>
            </div>
            <h2>{selectedTeam.teamName}</h2>
            <p>
              {selectedTeam.managerName || 'Unassigned manager'} · {selectedTeam.wins}–
              {selectedTeam.loss}
              {selectedTeam.ties ? `–${selectedTeam.ties}` : ''}
            </p>
            <div className="ranking-evidence-chips">
              <div className="ranking-evidence-chip">
                <span>Current rank</span>
                <strong>
                  #{ranking.teams.indexOf(selectedTeam) + 1} of {ranking.teams.length}
                </strong>
              </div>
              <div className="ranking-evidence-chip">
                <span>Record</span>
                <strong>
                  {selectedTeam.wins}–{selectedTeam.loss}
                  {selectedTeam.ties ? `–${selectedTeam.ties}` : ''}
                </strong>
              </div>
              <div className="ranking-evidence-chip">
                <span>Take status</span>
                <strong>{selectedTeam.description.trim() ? 'Ready' : 'Needs take'}</strong>
              </div>
            </div>
            {renderTeamTake(selectedTeam)}
            <Button
              type="button"
              mt={4}
              variant="outline"
              onClick={() => {
                if (tools.current) {
                  tools.current.open = true;
                  tools.current.scrollIntoView({ block: 'nearest' });
                  tools.current.querySelector('summary')?.focus();
                }
              }}
            >
              Writing assistant & edition tools
            </Button>
            <InfoTooltip label="Writing suggestions and draft safety">
              Suggestions stay separate until you apply them. Autosave and manual save use the same
              protected draft; review recovery or conflicts before publication.
            </InfoTooltip>
          </aside>
        )}
        <Box as="section" className="preview-panel" aria-label="Live ranking preview">
          <Flex
            align="center"
            justify="space-between"
            gap={4}
            flexWrap="wrap"
            mb={3}
            className="preview-toolbar"
          >
            <Box>
              <span className="live-dot" /> Live preview
            </Box>
            <Flex gap={2} flexWrap="wrap">
              <Button
                variant="plain"
                type="button"
                onClick={() => void download('original')}
                disabled={Boolean(exporting)}
              >
                <Icon name="download" size={16} />
                {exporting === 'original' ? 'Exporting…' : 'Download PNG'}
              </Button>
              <Button
                variant="plain"
                type="button"
                onClick={() => void download('compact')}
                disabled={Boolean(exporting)}
              >
                <Icon name="download" size={16} />
                {exporting === 'compact' ? 'Exporting compact…' : 'Download compact PNG'}
              </Button>
            </Flex>
          </Flex>
          <div className="view-switch export-preview-format" aria-label="Export preview format">
            <Button
              type="button"
              variant="outline"
              aria-pressed={previewFormat === 'original'}
              onClick={() => setPreviewFormat('original')}
            >
              Original preview (1304px)
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-pressed={previewFormat === 'compact'}
              onClick={() => setPreviewFormat('compact')}
            >
              Compact preview (720px)
            </Button>
          </div>
          {exportError && (
            <Box className="notice error" role="alert">
              {exportError}
            </Box>
          )}
          <Box className="preview-scroll" ref={previewViewport}>
            <div
              ref={preview}
              className={`export-canvas${previewFormat === 'compact' ? ' compact-export' : ''}`}
              style={{ zoom: previewScale }}
            >
              <RankingPreview ranking={ranking} history={editor.history} league={league} />
            </div>
          </Box>
        </Box>
      </Grid>
      <chakra.output className="sr-only">{announcement}</chakra.output>
    </>
  );
});
