import { z } from 'zod';
import { leagueIdSchema } from './validation';
import type { SeasonInsights } from '../insights';

const text = z.string().max(20000);
const num = z.number();
const count = z.number().int().nonnegative();
const year = z.number().int().min(2000).max(2100);
const strings = z.array(text).max(10000);
const player = z.object({ playerId: text, points: num });
const season: z.ZodType<SeasonInsights> = z.object({
  completedWeek: count.max(18),
  generatedAt: z.string().datetime(),
  notes: strings,
  partialFailures: z.array(z.object({ section: text, message: text })).optional(),
  playoffSettings: z.object({ regularSeasonEnd: num, playoffTeams: num }).optional(),
  playoffProjection: z
    .object({
      provider: z.enum(['Sleeper', 'ESPN']),
      week: num,
      teamPoints: z.record(text, num),
      coveredStarters: count,
      totalStarters: count,
      benchSelections: count.optional(),
      optimizedLineup: z.boolean().optional(),
      note: text.optional(),
    })
    .optional(),
  results: z
    .array(
      z.object({
        teamId: text,
        playoff: z.boolean().nullable(),
        finish: num.nullable(),
        champion: z.boolean().nullable(),
        lastPlace: z.boolean().nullable(),
      }),
    )
    .max(100)
    .optional(),
  teams: z
    .array(
      z.object({
        teamId: text,
        teamName: text,
        managerName: text,
        managerKey: text.optional(),
        weeks: count,
        total: num,
        average: num.nullable(),
        best: num.nullable(),
        projectedWeeks: count,
        projectionDelta: num.nullable(),
        beatProjection: count,
        aboveMedian: count,
        bestLineupPoints: num,
        lineupWeeks: count,
        correctStarts: count,
        lineupSlots: count,
        tradeCount: count,
        receivedPoints: num,
        sentPoints: num,
        netTradePoints: num.nullable(),
        tradeStarts: count,
      }),
    )
    .max(100),
  scores: z
    .array(
      z.object({
        teamId: text,
        week: num,
        actual: num,
        projected: num.nullable(),
        opponentTeamId: text.nullable().optional(),
        lineupAvailable: z.boolean().optional(),
        starters: z.array(player).max(200),
        players: z.array(player).max(200).optional(),
        bestLineup: z.object({ points: num, correctStarts: count, slots: count }).optional(),
      }),
    )
    .max(1800),
  pickups: z
    .array(
      z.object({
        id: text,
        teamId: text,
        player: text,
        week: num,
        points: num,
        starts: count,
        eligibleWeeks: count,
        position: text.nullable(),
        baseline: text,
        lift: num.nullable(),
        comparisonWeeks: z.array(num),
        averagePoints: num.nullable(),
        averageBaseline: num.nullable(),
      }),
    )
    .max(10000),
  trades: z
    .array(
      z.object({
        id: text,
        week: num,
        teamId: text,
        received: strings,
        sent: strings,
        receivedPoints: num,
        sentPoints: num,
        net: num.nullable(),
        starts: count,
        eligibleWeeks: count,
      }),
    )
    .max(10000),
  tradeComparisons: z
    .array(
      z.object({
        id: text,
        week: num,
        weeks: z.array(num),
        possibleWeeks: count,
        verdict: z.enum(['leader', 'close', 'insufficient', 'picks']),
        winner: text.nullable(),
        sides: z
          .array(
            z.object({
              teamId: text,
              received: strings,
              sent: strings,
              receivedValue: num.nullable(),
              sentValue: num.nullable(),
              gain: num.nullable(),
            }),
          )
          .max(100),
      }),
    )
    .max(10000),
});

// Zod objects strip unknown fields at every level before anything is persisted or returned.
export const snapshotInputSchema = leagueIdSchema.extend({
  view: z.enum(['insights', 'history', 'playoffs']),
  activeSeason: year,
  activeManagerKeys: strings,
  records: z
    .array(z.object({ year, data: season }))
    .min(1)
    .max(101)
    .refine(
      (records) => new Set(records.map((r) => r.year)).size === records.length,
      'Each season may appear only once.',
    ),
});
