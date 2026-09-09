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
import { moveTeam } from '../util/rankings';
import { errorMessage } from '../api/client';
import { RankingPreview } from './RankingPreview';
import { Icon } from './Icon';
import { SortableRankingList } from './SortableRankingList';

export interface EditorHandle {
  flush: () => Promise<void>;
}

export const RankingEditor = forwardRef<
  EditorHandle,
  { api: LeagueApi; league: League; year: number; week: number }
>(function RankingEditor({ api, league, year, week }, ref) {
  const editor = useRankingEditor(api, league, year, week);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [undo, setUndo] = useState<WeeklyRanking>();
  const preview = useRef<HTMLDivElement>(null);
  const previewViewport = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  useEffect(() => {
    const viewport = previewViewport.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      setPreviewScale(Math.min(1, entry.contentRect.width / 1304));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [editor.loading, editor.loadError, tab]);
  const { flush } = editor;
  useImperativeHandle(ref, () => ({ flush: () => flush() }), [flush]);

  function reorder(from: number, to: number) {
    if (from === to || !editor.ranking) return;
    setUndo(editor.ranking);
    editor.update((ranking) => ({ ...ranking, teams: moveTeam(ranking.teams, from, to) }));
    setAnnouncement(`${editor.ranking.teams[from].teamName} moved to rank ${to + 1}.`);
  }

  async function download() {
    if (!preview.current || exporting) return;
    setExporting(true);
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
      link.download = `power-rankings-${year}-week-${week}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      logClientError('RankingEditor', error);
      setExportError(`Image export failed: ${errorMessage(error)}`);
    } finally {
      exportHost.remove();
      setExporting(false);
    }
  }

  if (editor.loading)
    return (
      <chakra.output
        bg="bg"
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border"
        rounded="lg"
        p={{ base: 4, md: 6 }}
        className="panel loading-state"
      >
        <span className="loading-bar" />
        <Heading as="h2" size="xl" mb={4}>
          Getting the field ready…
        </Heading>
        <Text mb={4}>Loading your saved rankings and league teams.</Text>
      </chakra.output>
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

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        flexWrap="wrap"
        mb={6}
        className="editor-topline"
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
      {api.publishing && ranking._id && (
        <PublishEdition
          key={ranking._id}
          api={api.publishing}
          id={ranking._id}
          revision={ranking.revision ?? 0}
          disabled={editor.dirty || editor.saving || !!editor.recovery || editor.hasConflict}
        />
      )}
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
          <Button onClick={editor.restoreDraft} mr={3}>
            Restore draft
          </Button>
          <Button variant="outline" onClick={editor.discardDraft}>
            Discard local draft
          </Button>
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
              <Button mr={3} onClick={() => editor.resolveConflict(false)}>
                Use saved version
              </Button>
              <Button variant="outline" onClick={() => editor.resolveConflict(true)}>
                Replace with my local draft
              </Button>
            </>
          )}
        </Box>
      )}
      <Grid
        templateColumns={{ base: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}
        gap={8}
        alignItems="start"
        className={`editor-layout showing-${tab}`}
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
          <Flex align="center" justify="space-between" gap={4} mb={6} className="section-heading">
            <Box>
              <span className="eyebrow">The weekly edition</span>
              <Heading as="h2" size="xl" mb={4}>
                Make your case.
              </Heading>
            </Box>
            <span className="week-stamp">W{String(week).padStart(2, '0')}</span>
          </Flex>
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
          <Flex
            align="center"
            justify="space-between"
            gap={4}
            flexWrap="wrap"
            mb={6}
            className="teams-heading"
          >
            <Box>
              <Heading as="h3" size="lg" mb={4}>
                Set the order
              </Heading>
              <Text mb={4}>Drag a team or use the arrows. Add a take below.</Text>
            </Box>
            <Button
              variant="plain"
              type="button"

              disabled={!undo}
              onClick={() => {
                if (undo) {
                  editor.update(() => undo);
                  setUndo(undefined);
                  setAnnouncement('Previous order restored.');
                }
              }}
            >
              Undo move
            </Button>
          </Flex>
          {api.writing && (
            <WritingSuggestions
              api={api.writing}
              leagueId={league.leagueId}
              year={year}
              week={week}
              teams={ranking.teams}
            />
          )}
          <SortableRankingList
            teams={ranking.teams}
            onReorder={reorder}
            renderItem={(team, index, handle) => (
              <>
                <Flex gap={3} align="center" mb={3} className="team-editor-heading">
                  <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                  <Box className="team-identity">
                    <strong>{team.teamName}</strong>
                    <small>
                      {team.managerName || 'Unassigned manager'}{' '}
                      <span>
                        · {team.wins}–{team.loss}
                        {team.ties ? `–${team.ties}` : ''}
                      </span>
                    </small>
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
                        entry.teamId === team.teamId
                          ? { ...entry, description: event.target.value }
                          : entry,
                      ),
                    }))
                  }
                />
              </>
            )}
          />
          <Flex
            align="center"
            justify="space-between"
            gap={4}
            flexWrap="wrap"
            mb={6}
            className="editor-footer"
          >
            <span>
              {comments} of {ranking.teams.length} takes written
            </span>
            <Button
              colorPalette="indigo"
              variant="solid"
              type="button"

              disabled={editor.saving || (!editor.dirty && !!ranking._id)}
              onClick={() => void editor.flush(true).catch(() => {})}
            >
              {editor.saving ? 'Saving…' : 'Save rankings'}
              <Icon name="check" size={17} />
            </Button>
          </Flex>
        </Box>
        <Box as="section" className="preview-panel" aria-label="Live ranking preview">
          <Flex
            align="center"
            justify="space-between"
            gap={4}
            flexWrap="wrap"
            mb={6}
            className="preview-toolbar"
          >
            <Box>
              <span className="live-dot" /> Live preview
            </Box>
            <Button variant="plain" type="button" onClick={download} disabled={exporting}>
              <Icon name="download" size={16} />
              {exporting ? 'Exporting…' : 'Download PNG'}
            </Button>
          </Flex>
          {exportError && (
            <Box className="notice error" role="alert">
              {exportError}
            </Box>
          )}
          <Box className="preview-scroll" ref={previewViewport}>
            <div ref={preview} className="export-canvas" style={{ zoom: previewScale }}>
              <RankingPreview ranking={ranking} history={editor.history} league={league} />
            </div>
          </Box>
          <Text mb={4} className="preview-note">
            Your changes appear here as you type. Movement compares with the previous week’s saved
            rankings.
          </Text>
        </Box>
      </Grid>
      <chakra.output className="sr-only">{announcement}</chakra.output>
    </>
  );
});
