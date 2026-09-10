import { z } from 'zod';
const id = z.string().regex(/^\d{1,30}$/);
const year = z.number().int().min(2000).max(2100);
const week = z.number().int().min(1).max(18);
export const leagueIdSchema = z.object({ leagueId: id });
export const seasonSchema = leagueIdSchema.extend({ year });
export const weekSchema = seasonSchema.extend({ week });
export const objectIdSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) });
export const leagueSchema = z.object({
  leagueId: id,
  leagueName: z.string().trim().max(120).default(''),
  leagueType: z.union([z.literal(0), z.literal(1)]),
  seasonId: year,
});
const teamSchema = z.object({
  teamId: id,
  teamName: z.string().min(1).max(200),
  managerName: z.string().max(200),
  description: z.string().max(20000),
  wins: z.number().int().nonnegative(),
  loss: z.number().int().nonnegative(),
  ties: z.number().int().nonnegative(),
  position: z.number().int().min(1),
  delta: z.number().int().optional(),
});
export const rankingSchema = z.object({
  revision: z.number().int().nonnegative().optional(),
  _id: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  leagueId: id,
  rankingsTitle: z.string().trim().min(1).max(200),
  introduction: z.string().max(50000),
  year,
  week,
  teams: z
    .array(teamSchema)
    .min(1)
    .max(100)
    .refine(
      (teams) => new Set(teams.map((team) => team.teamId)).size === teams.length,
      'Each team may appear only once.',
    ),
});
export const updateWeekSchema = weekSchema.extend({ ranking: rankingSchema });
