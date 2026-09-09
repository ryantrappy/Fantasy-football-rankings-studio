import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  defaultAnimateLayoutChanges,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { WeeklyRanking } from '../types';

type Team = WeeklyRanking['teams'][number];
type HandleProps = ComponentProps<'button'>;
type RenderItem = (team: Team, index: number, handle: HandleProps) => ReactNode;
const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

function SortableTeam({
  team,
  index,
  renderItem,
  reducedMotion,
}: {
  team: Team;
  index: number;
  renderItem: RenderItem;
  reducedMotion: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: team.teamId,
    transition: reducedMotion ? null : { duration: 260, easing },
    animateLayoutChanges: (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
  });
  return (
    <li
      ref={setNodeRef}
      className={`team-editor${isDragging ? ' team-editor-placeholder' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {renderItem(team, index, { ...attributes, ...listeners, ref: setActivatorNodeRef })}
    </li>
  );
}

export function SortableRankingList({
  teams,
  onReorder,
  renderItem,
}: {
  teams: Team[];
  onReorder: (from: number, to: number) => void;
  renderItem: RenderItem;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      scrollBehavior: reducedMotion ? 'auto' : 'smooth',
    }),
  );
  const activeIndex = teams.findIndex((team) => team.teamId === activeId);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        if (!over) return;
        const from = teams.findIndex((team) => team.teamId === active.id);
        const to = teams.findIndex((team) => team.teamId === over.id);
        if (from >= 0 && to >= 0) onReorder(from, to);
      }}
    >
      <SortableContext
        items={teams.map((team) => team.teamId)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="team-editor-list">
          {teams.map((team, index) => (
            <SortableTeam
              key={team.teamId}
              team={team}
              index={index}
              renderItem={renderItem}
              reducedMotion={reducedMotion}
            />
          ))}
        </ol>
      </SortableContext>
      {typeof document !== 'undefined' &&
        createPortal(
          <DragOverlay
            dropAnimation={
              reducedMotion
                ? null
                : {
                    duration: 280,
                    easing,
                    sideEffects: defaultDropAnimationSideEffects({
                      styles: { active: { opacity: '0' } },
                    }),
                  }
            }
          >
            {activeIndex >= 0 ? (
              <div className="team-editor team-editor-overlay" aria-hidden="true" inert>
                {renderItem(teams[activeIndex], activeIndex, { tabIndex: -1 })}
              </div>
            ) : null}
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  );
}
