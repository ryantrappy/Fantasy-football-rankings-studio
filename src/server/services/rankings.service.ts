import { isValidObjectId } from 'mongoose';
import { WeeklyRanking } from '../interfaces/weeklyRanking.interface';
import HttpException from '../exceptions/HttpException';
import rankingRevisionModel from '../models/ranking-revision.model';
import weeklyRankingModel from '../models/weeklyRanking.model';
import LeaguesService from './leagues.service';

const revisionFilter = (revision = 0) =>
  revision === 0 ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] } : { revision };
const conflict = () =>
  new HttpException(
    409,
    'A newer edition was saved elsewhere. Review the saved version before resolving this conflict.',
  );
class RankingsService {
  public weeklyRankings = weeklyRankingModel;
  public revisionHistory = rankingRevisionModel;
  public leagueService = new LeaguesService();

  private normalize(ranking: WeeklyRanking): WeeklyRanking {
    if (!ranking?.teams?.length) throw new HttpException(400, 'Add at least one team.');
    if (!ranking.rankingsTitle?.trim()) throw new HttpException(400, 'Enter a rankings title.');
    const teamIds = ranking.teams.map((team) => String(team.teamId));
    if (new Set(teamIds).size !== teamIds.length)
      throw new HttpException(400, 'Each team may appear only once.');
    return {
      rankingsTitle: ranking.rankingsTitle.trim(),
      introduction: ranking.introduction,
      leagueId: ranking.leagueId,
      week: ranking.week,
      year: ranking.year,
      teams: ranking.teams.map((team, index) => ({
        teamName: team.teamName,
        managerName: team.managerName,
        description: team.description,
        wins: team.wins,
        loss: team.loss,
        ties: team.ties,
        teamId: String(team.teamId),
        position: index + 1,
      })),
    };
  }

  public async createNewRanking(
    input: WeeklyRanking,
    ownerSubject: string,
  ): Promise<WeeklyRanking> {
    const ranking = this.normalize(input);
    await this.leagueService.getLeagueById(ranking.leagueId, ownerSubject);
    const existing = await this.weeklyRankings.exists({
      leagueId: ranking.leagueId,
      week: ranking.week,
      year: ranking.year,
    });
    if (existing)
      throw new HttpException(
        409,
        'Rankings already exist for this league, season, and week. Open them to edit.',
      );
    return this.weeklyRankings.create(ranking) as unknown as Promise<WeeklyRanking>;
  }

  public async updateRanking(
    rankingId: string,
    input: WeeklyRanking,
    ownerSubject: string,
  ): Promise<WeeklyRanking> {
    const current = await this.getRankingById(rankingId, ownerSubject);
    if (
      input.leagueId !== current.leagueId ||
      input.week !== current.week ||
      input.year !== current.year
    )
      throw new HttpException(400, 'A ranking cannot be moved to another league, season, or week.');
    if ((input.revision ?? 0) !== (current.revision ?? 0)) throw conflict();
    await this.migrateLegacyHistory(rankingId);
    await this.archiveRevision(rankingId, {
      savedAt: current.updatedAt?.toISOString() ?? new Date().toISOString(),
      ranking: { ...this.normalize(current), revision: current.revision ?? 0 },
    });
    const ranking = this.normalize(input);
    const result = await this.weeklyRankings.findOneAndUpdate(
      { _id: rankingId, ...revisionFilter(input.revision) },
      {
        $set: ranking,
        $inc: { revision: 1 },
      },
      { returnDocument: 'after', runValidators: true },
    );
    if (!result) throw conflict();
    return result as unknown as WeeklyRanking;
  }

  public async updateRankingByWeek(
    leagueId: string,
    week: number,
    year: number,
    input: WeeklyRanking,
    ownerSubject: string,
  ): Promise<WeeklyRanking> {
    await this.leagueService.getLeagueById(leagueId, ownerSubject);
    if (input.leagueId !== leagueId || input.week !== week || input.year !== year)
      throw new HttpException(400, 'Ranking details must match the URL.');
    const current = await this.weeklyRankings.findOne({ leagueId, week, year });
    if (!current) throw new HttpException(404, 'Ranking not found.');
    return this.updateRanking(String(current._id), input, ownerSubject);
  }

  private async archiveRevision(id: string, entry: { savedAt: string; ranking: WeeklyRanking }) {
    try {
      await this.revisionHistory.updateOne(
        { rankingId: id, revision: entry.ranking.revision ?? 0 },
        {
          $setOnInsert: {
            savedAt: entry.savedAt || new Date().toISOString(),
            ranking: entry.ranking,
          },
        },
        { upsert: true, runValidators: true },
      );
    } catch (error) {
      // A concurrent writer can have archived this same immutable revision.
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 11000)
        throw error;
    }
  }

  private async migrateLegacyHistory(id: string) {
    const legacy = await this.weeklyRankings.findById(id).select('revisions').lean();
    for (const entry of legacy?.revisions ?? []) await this.archiveRevision(id, entry);
    if (legacy?.revisions?.length) {
      // Remove embedded copies only after every immutable snapshot is durable.
      await this.weeklyRankings.updateOne({ _id: id }, { $unset: { revisions: '' } });
    }
  }

  public async getRevisions(id: string, owner: string, before?: number) {
    const current = await this.getRankingById(id, owner);
    await this.migrateLegacyHistory(id);
    const historical = await this.revisionHistory
      .find({
        rankingId: id,
        revision: { $lt: Math.min(before ?? Infinity, current.revision ?? 0) },
      })
      .sort({ revision: -1 })
      .limit(10)
      .lean();
    const entries = historical.map(({ savedAt, ranking }) => ({ savedAt, ranking }));
    return before === undefined
      ? [
          {
            savedAt: current.updatedAt?.toISOString() ?? '',
            ranking: { ...this.normalize(current), revision: current.revision ?? 0 },
          },
          ...entries,
        ]
      : entries;
  }

  public async restoreRevision(
    id: string,
    revision: number,
    expectedRevision: number,
    owner: string,
  ) {
    const current = await this.getRankingById(id, owner);
    await this.migrateLegacyHistory(id);
    const selected =
      revision === (current.revision ?? 0)
        ? current
        : (await this.revisionHistory.findOne({ rankingId: id, revision }).lean())?.ranking;
    if (!selected) throw new HttpException(404, 'Revision not found.');
    return this.updateRanking(
      id,
      { ...this.normalize(selected), revision: expectedRevision },
      owner,
    );
  }

  public async getRankingById(rankingId: string, ownerSubject: string): Promise<WeeklyRanking> {
    if (!isValidObjectId(rankingId)) throw new HttpException(400, 'Invalid ranking ID.');
    const result = await this.weeklyRankings.findById(rankingId).select('-revisions');
    if (!result) throw new HttpException(404, 'Ranking not found.');
    await this.leagueService.getLeagueById(result.leagueId, ownerSubject);
    return result as unknown as WeeklyRanking;
  }

  public async getByLeagueId(leagueId: string, ownerSubject: string): Promise<WeeklyRanking[]> {
    await this.leagueService.getLeagueById(leagueId, ownerSubject);
    return this.weeklyRankings
      .find({ leagueId })
      .select('-revisions')
      .sort({ year: -1, week: -1 }) as unknown as Promise<WeeklyRanking[]>;
  }
}
export default RankingsService;
