import { randomBytes } from 'node:crypto';
import leagueModel from '../models/league.model';
import { League, LeagueType } from '../interfaces/league.interface';
import HttpException from '../exceptions/HttpException';
import { LeagueProvider } from '../providers/league-provider';
import SleeperProvider from '../providers/sleeper.provider';
import EspnProvider from '../providers/espn.provider';
import { getEspnCredentials } from '../espn-credentials.server';
import rankingRevisionModel from '../models/ranking-revision.model';
import weeklyRankingModel from '../models/weeklyRanking.model';
import { reportSnapshotModel } from '../models/report-snapshot.model';

class LeaguesService {
  public leagues = leagueModel;
  public weeklyRankings = weeklyRankingModel;
  public revisionHistory = rankingRevisionModel;
  public reportSnapshots = reportSnapshotModel;
  public async providerFor(league: League, ownerSubject: string): Promise<LeagueProvider> {
    return league.leagueType === LeagueType.Espn
      ? new EspnProvider(await this.espnAccess(league, ownerSubject))
      : new SleeperProvider();
  }

  public async espnAccess(league: League, ownerSubject: string) {
    return league.leagueType === LeagueType.Espn
      ? ((await getEspnCredentials(ownerSubject)) ?? 'public')
      : 'public';
  }

  public async getLeagueById(id: string, ownerSubject: string): Promise<League> {
    const league = await this.leagues
      .findOne({ leagueId: id, ownerSubject, deleted: { $ne: true } })
      .lean();
    if (!league) throw new HttpException(404, 'League not found.');
    return league as unknown as League;
  }

  private async managedLeague(
    id: string,
    ownerSubject: string,
    includeDeleted = false,
  ): Promise<League> {
    const filter = { ownerSubject, ...(includeDeleted ? {} : { deleted: { $ne: true } }) };
    const exact = await this.leagues.findOne({ ...filter, leagueId: id }).lean();
    if (exact) return exact as unknown as League;
    const matches = await this.leagues
      .find({ ...filter, providerLeagueId: id })
      .limit(2)
      .lean();
    if (matches.length > 1)
      throw new HttpException(
        409,
        'This provider league ID matches multiple workspaces. Select the specific league in Manage leagues or use its workspace ID.',
      );
    if (!matches.length) throw new HttpException(404, 'League not found.');
    return matches[0] as unknown as League;
  }

  public async updateProviderLeagueId(id: string, providerLeagueId: string, owner: string) {
    const normalized =
      typeof providerLeagueId === 'string' ? providerLeagueId.replace(/^0+(?=\d)/, '') : '';
    if (!/^\d{1,30}$/.test(normalized))
      throw new HttpException(400, 'Enter a valid numeric provider league ID.');
    const current = await this.managedLeague(id, owner);
    if ((current.providerLeagueId ?? current.leagueId) === normalized) return current;
    const target = { ...current, providerLeagueId: normalized };
    // Validate the target before changing the saved association. Keep the owner's display name local.
    await (await this.providerFor(target, owner)).getLeague(target, target.seasonId);
    const result = await this.leagues.findOneAndUpdate(
      { leagueId: current.leagueId, ownerSubject: owner, deleted: { $ne: true } },
      { $set: { providerLeagueId: normalized, managedTeams: {} } },
      { returnDocument: 'after', runValidators: true },
    );
    if (!result) throw new HttpException(404, 'League not found.');
    return result as unknown as League;
  }

  public async deleteLeague(id: string, owner: string) {
    const league = await this.managedLeague(id, owner, true);
    const marked = await this.leagues.findOneAndUpdate(
      { leagueId: league.leagueId, ownerSubject: owner },
      { $set: { deleted: true, publicReports: false } },
      { returnDocument: 'after' },
    );
    if (!marked) throw new HttpException(404, 'League not found.');
    const rankings = await this.weeklyRankings
      .find({ leagueId: league.leagueId })
      .select('_id')
      .lean();
    const rankingIds = [
      ...new Set([
        ...(league.deletionRankingIds ?? []),
        ...rankings.map((ranking) => String(ranking._id)),
      ]),
    ];
    await this.leagues.updateOne(
      { leagueId: league.leagueId, ownerSubject: owner, deleted: true },
      { $addToSet: { deletionRankingIds: { $each: rankingIds } } },
    );
    // Publications are keyed by ranking ID; loading this model here avoids a service import cycle.
    const { publicationModel } = await import('../publishing.server');
    await Promise.all([
      rankingIds.length
        ? publicationModel.deleteMany({ rankingId: { $in: rankingIds } })
        : undefined,
      rankingIds.length
        ? this.revisionHistory.deleteMany({ rankingId: { $in: rankingIds } })
        : undefined,
      this.weeklyRankings.deleteMany({ leagueId: league.leagueId }),
      this.reportSnapshots.deleteMany({ leagueId: league.leagueId, ownerSubject: owner }),
    ]);
    const result = await this.leagues.deleteOne({ leagueId: league.leagueId, ownerSubject: owner });
    if (!result.deletedCount) throw new HttpException(404, 'League not found.');
  }

  public async getPublicLeagueById(id: string): Promise<League> {
    const league = await this.leagues
      .findOne({ leagueId: id, deleted: { $ne: true }, publicReports: { $ne: false } })
      .select({
        _id: 0,
        leagueId: 1,
        leagueName: 1,
        leagueType: 1,
        seasonId: 1,
        providerLeagueId: 1,
      })
      .lean();
    if (!league) throw new HttpException(404, 'League not found.');
    return {
      leagueId: league.leagueId,
      ...(league.providerLeagueId ? { providerLeagueId: league.providerLeagueId } : {}),
      leagueName: league.leagueName,
      leagueType: league.leagueType,
      seasonId: league.seasonId,
    };
  }

  public async setReportSharing(id: string, enabled: boolean, owner: string) {
    const result = await this.leagues.findOneAndUpdate(
      { leagueId: id, ownerSubject: owner, deleted: { $ne: true } },
      { $set: { publicReports: enabled } },
      { returnDocument: 'after' },
    );
    if (!result) throw new HttpException(404, 'League not found.');
    return result.publicReports !== false;
  }

  public async listLeagues(ownerSubject: string, archived = false) {
    return this.leagues
      .find({ ownerSubject, deleted: { $ne: true }, archived: archived ? true : { $ne: true } })
      .sort({ leagueName: 1 })
      .lean();
  }

  public async listDeleting(ownerSubject: string) {
    return this.leagues.find({ ownerSubject, deleted: true }).sort({ leagueName: 1 }).lean();
  }

  public async verifyWrite(leagueId: string, owner: string, cleanup: () => Promise<unknown>) {
    try {
      await this.getLeagueById(leagueId, owner);
    } catch (error) {
      if (error instanceof HttpException && error.status === 404) await cleanup();
      throw error;
    }
  }

  public async setArchived(id: string, archived: boolean, owner: string) {
    const league = await this.managedLeague(id, owner);
    const result = await this.leagues.findOneAndUpdate(
      { leagueId: league.leagueId, ownerSubject: owner, deleted: { $ne: true } },
      { $set: { archived } },
      { returnDocument: 'after' },
    );
    if (!result) throw new HttpException(404, 'League not found.');
  }

  public async rename(id: string, name: string, owner: string): Promise<League> {
    const leagueName = typeof name === 'string' ? name.trim() : '';
    if (!leagueName) throw new HttpException(400, 'Enter a league display name.');
    if (leagueName.length > 120)
      throw new HttpException(400, 'League display name must be at most 120 characters.');
    const league = await this.managedLeague(id, owner);
    const result = await this.leagues.findOneAndUpdate(
      { leagueId: league.leagueId, ownerSubject: owner, deleted: { $ne: true } },
      { $set: { leagueName } },
      { returnDocument: 'after' },
    );
    if (!result) throw new HttpException(404, 'League not found.');
    return result as unknown as League;
  }

  public async createNewLeague(input: League, ownerSubject: string): Promise<League> {
    if (!input || typeof input.leagueId !== 'string' || !/^\d{1,30}$/.test(input.leagueId))
      throw new HttpException(400, 'Enter a valid numeric league ID.');
    if (![LeagueType.Sleeper, LeagueType.Espn].includes(input.leagueType))
      throw new HttpException(400, 'Choose Sleeper or ESPN.');
    if (!Number.isInteger(input.seasonId) || input.seasonId < 2000 || input.seasonId > 2100)
      throw new HttpException(400, 'Enter a valid season year.');
    if (
      input.leagueName != null &&
      (typeof input.leagueName !== 'string' || input.leagueName.length > 120)
    )
      throw new HttpException(400, 'League name must be at most 120 characters.');
    const providerLeagueId = input.leagueId.replace(/^0+(?=\d)/, '');
    if (
      await this.leagues.exists({
        ownerSubject,
        leagueType: input.leagueType,
        $or: [
          { providerLeagueId },
          { providerLeagueId: { $exists: false }, leagueId: providerLeagueId },
        ],
      })
    )
      throw new HttpException(409, 'This league is already registered.');
    const league: League = {
      leagueId: BigInt('0x' + randomBytes(12).toString('hex')).toString(),
      providerLeagueId,
      leagueType: input.leagueType,
      leagueName: input.leagueName?.trim() || '',
      seasonId: input.seasonId,
      ownerSubject,
    };
    const info = await (
      await this.providerFor(league, ownerSubject)
    ).getLeague(league, league.seasonId);
    try {
      return (await this.leagues.create({
        ...league,
        leagueName: info.leagueName,
      })) as unknown as League;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000)
        throw new HttpException(
          409,
          'This league is already registered or its workspace ID collided. Refresh and retry.',
        );
      throw error;
    }
  }

  public async managedTeamSelection(id: string, year: number, owner: string) {
    const league = await this.getLeagueById(id, owner);
    const teams = await (await this.providerFor(league, owner)).getTeams(league, year, 1);
    const saved = league.managedTeams?.[String(year)];
    const selected = teams.find(
      (team) => team.teamId === saved?.teamId && (team.managerKey ?? '') === saved.managerKey,
    );
    return {
      teams: teams.map(({ teamId, teamName, managerName }) => ({ teamId, teamName, managerName })),
      teamId: selected?.teamId ?? null,
      needsReselection: Boolean(saved && !selected),
    };
  }

  public async setManagedTeam(id: string, year: number, teamId: string | null, owner: string) {
    const league = await this.getLeagueById(id, owner);
    const path = `managedTeams.${year}`;
    const teams = await (
      await this.providerFor(league, owner)
    )
      .getTeams(league, year, 1)
      .catch((error) => {
        if (teamId !== null) throw error;
        return [];
      });
    let update: object = { $unset: { [path]: '' } };
    if (teamId !== null) {
      const team = teams.find((entry) => entry.teamId === teamId);
      if (!team) throw new HttpException(400, 'Choose a team from this league and season.');
      update = { $set: { [path]: { teamId, managerKey: team.managerKey ?? '' } } };
    }
    const result = await this.leagues.findOneAndUpdate(
      {
        leagueId: id,
        ownerSubject: owner,
        deleted: { $ne: true },
        providerLeagueId: league.providerLeagueId,
      },
      update,
      { returnDocument: 'after', runValidators: true },
    );
    if (!result)
      throw new HttpException(409, 'The league changed. Reload and choose your team again.');
    if ((result.managedTeams?.[String(year)]?.teamId ?? null) !== teamId)
      throw new HttpException(
        503,
        'The server did not persist your team choice. Restart the application to reload its database schema, then retry.',
      );
    // The write returned the committed selection. A second provider read could fail after
    // persistence and make the browser report a failed save that actually succeeded.
    return {
      teams: teams.map(({ teamId, teamName, managerName }) => ({ teamId, teamName, managerName })),
      teamId,
      needsReselection: false,
    };
  }

  public async getLeagueInfo(id: string, seasonId: number, ownerSubject: string) {
    const league = await this.getLeagueById(id, ownerSubject);
    return (await this.providerFor(league, ownerSubject)).getLeague(league, seasonId);
  }

  public async getTeams(id: string, seasonId: number, week: number, ownerSubject: string) {
    const league = await this.getLeagueById(id, ownerSubject);
    return (await this.providerFor(league, ownerSubject)).getHistoricalTeams(
      league,
      seasonId,
      week,
    );
  }

  public async getMatchups(id: string, seasonId: number, week: number, ownerSubject: string) {
    const league = await this.getLeagueById(id, ownerSubject);
    return (await this.providerFor(league, ownerSubject)).getMatchups(league, seasonId, week);
  }
}
export default LeaguesService;
