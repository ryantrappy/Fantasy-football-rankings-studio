import '@tanstack/react-start/server-only';
import axios from 'axios';
import * as credentials from './espn-credentials.server';
import { logServerError } from './logging.server';
import { discoverSeasons } from './insights/seasons.server';
import { loadInsights } from './insights/load.server';
import { z } from 'zod';
import type { League, WeeklyRanking } from '../types';
import { connectDatabase } from './database.server';
import { verifyAuthorization } from './auth.server';
import HttpException from './exceptions/HttpException';
import LeaguesService from './services/leagues.service';
import RankingsService from './services/rankings.service';
import {
  leagueSchema,
  leagueIdSchema,
  seasonSchema,
  weekSchema,
  objectIdSchema,
  rankingSchema,
  updateWeekSchema,
} from './validation';

const leagues = new LeaguesService();
const rankings = new RankingsService();
// Select only public fields; Mongoose documents, owner subjects and internal metadata never cross RPC.
function publicLeague(value: League): League {
  return {
    _id: String(value._id),
    leagueId: value.leagueId,
    leagueName: value.leagueName,
    leagueType: value.leagueType,
    seasonId: value.seasonId,
  };
}
function publicRanking(value: WeeklyRanking): WeeklyRanking {
  return {
    revision: value.revision ?? 0,
    _id: String(value._id),
    leagueId: value.leagueId,
    rankingsTitle: value.rankingsTitle,
    introduction: value.introduction,
    week: value.week,
    year: value.year,
    teams: value.teams.map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      managerName: team.managerName,
      wins: team.wins,
      loss: team.loss,
      ties: team.ties,
      description: team.description,
      position: team.position,
    })),
  };
}
export type OperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { status: number; message: string } };
export async function execute<T>(
  authorization: string | undefined,
  action: (owner: string) => Promise<T>,
  operation = 'private.serverCall',
): Promise<OperationResult<T>> {
  return executePublic(async () => {
    const owner = await verifyAuthorization(authorization);
    await connectDatabase();
    return action(owner);
  }, operation);
}
// Shared error envelope; only explicitly public read operations use this without auth.
export async function executePublic<T>(
  action: () => Promise<T>,
  operation = 'public.serverCall',
): Promise<OperationResult<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    let status = 500,
      message = 'The server could not complete this request. Please try again.';
    if (error instanceof HttpException) {
      status = error.status;
      message = error.message;
    } else if (error instanceof z.ZodError) {
      status = 400;
      message = 'The submitted data is invalid. Check IDs, season, week, and ranking fields.';
    } else if (axios.isAxiosError(error)) {
      status = error.response?.status === 404 ? 404 : 502;
      message =
        'The league provider could not be reached. Check the league, season, and privacy settings.';
    } else if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
      status = 409;
      message = 'This league or weekly ranking already exists.';
    }
    logServerError(operation, error, status);
    return { ok: false, error: { status, message } };
  }
}
export const operations = {
  getEspnCredentialStatus: credentials.getEspnCredentialStatus,
  saveEspnCredentials: credentials.saveEspnCredentials,
  removeEspnCredentials: credentials.removeEspnCredentials,
  skipEspnSetup: credentials.skipEspnSetup,
  getLeagueSeasons: async (owner: string, input: unknown) => {
    const { leagueId } = leagueIdSchema.parse(input);
    const league = await leagues.getLeagueById(leagueId, owner);
    return discoverSeasons(league, await leagues.espnAccess(league, owner));
  },
  getInsights: async (owner: string, input: unknown) => {
    const data = seasonSchema.parse(input);
    const league = await leagues.getLeagueById(data.leagueId, owner);
    return loadInsights(league, data.year, await leagues.espnAccess(league, owner));
  },
  listLeagues: async (owner: string) => (await leagues.listLeagues(owner)).map(publicLeague),
  createLeague: async (owner: string, input: unknown) =>
    publicLeague(await leagues.createNewLeague(leagueSchema.parse(input), owner)),
  getLeague: async (owner: string, input: unknown) =>
    publicLeague(await leagues.getLeagueById(leagueIdSchema.parse(input).leagueId, owner)),
  getLeagueInfo: async (owner: string, input: unknown) => {
    const data = seasonSchema.parse(input);
    const info = await leagues.getLeagueInfo(data.leagueId, data.year, owner);
    return { ...publicLeague(info), teamCount: info.teamCount, maxWeek: info.maxWeek };
  },
  getTeams: async (owner: string, input: unknown) => {
    const data = weekSchema.parse(input);
    return leagues.getTeams(data.leagueId, data.year, data.week, owner);
  },
  getMatchups: async (owner: string, input: unknown) => {
    const data = weekSchema.parse(input);
    return leagues.getMatchups(data.leagueId, data.year, data.week, owner);
  },
  getRankings: async (owner: string, input: unknown) =>
    (await rankings.getByLeagueId(leagueIdSchema.parse(input).leagueId, owner)).map(publicRanking),
  getRanking: async (owner: string, input: unknown) =>
    publicRanking(await rankings.getRankingById(objectIdSchema.parse(input).id, owner)),
  saveRanking: async (owner: string, input: unknown) => {
    const data = rankingSchema.parse(input);
    return publicRanking(
      data._id
        ? await rankings.updateRanking(data._id, data, owner)
        : await rankings.createNewRanking(data, owner),
    );
  },
  updateRankingByWeek: async (owner: string, input: unknown) => {
    const data = updateWeekSchema.parse(input);
    return publicRanking(
      await rankings.updateRankingByWeek(data.leagueId, data.week, data.year, data.ranking, owner),
    );
  },
};
