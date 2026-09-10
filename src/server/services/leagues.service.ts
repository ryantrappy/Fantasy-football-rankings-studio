import leagueModel from '../models/league.model';
import { League, LeagueType } from '../interfaces/league.interface';
import HttpException from '../exceptions/HttpException';
import { LeagueProvider } from '../providers/league-provider';
import SleeperProvider from '../providers/sleeper.provider';
import EspnProvider from '../providers/espn.provider';
import { getEspnCredentials } from '../espn-credentials.server';

class LeaguesService {
  public leagues = leagueModel;
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
    const league = await this.leagues.findOne({ leagueId: id, ownerSubject }).lean();
    if (!league) throw new HttpException(404, 'League not found.');
    return league as unknown as League;
  }

  public async getPublicLeagueById(id: string): Promise<League> {
    const league = await this.leagues
      .findOne({ leagueId: id, publicReports: { $ne: false } })
      .select({ _id: 0, leagueId: 1, leagueName: 1, leagueType: 1, seasonId: 1 })
      .lean();
    if (!league) throw new HttpException(404, 'League not found.');
    return {
      leagueId: league.leagueId,
      leagueName: league.leagueName,
      leagueType: league.leagueType,
      seasonId: league.seasonId,
    };
  }

  public async setReportSharing(id: string, enabled: boolean, owner: string) {
    const result = await this.leagues.findOneAndUpdate(
      { leagueId: id, ownerSubject: owner },
      { $set: { publicReports: enabled } },
      { returnDocument: 'after' },
    );
    if (!result) throw new HttpException(404, 'League not found.');
    return result.publicReports !== false;
  }

  public async listLeagues(ownerSubject: string, archived = false) {
    return this.leagues
      .find({ ownerSubject, archived: archived ? true : { $ne: true } })
      .sort({ leagueName: 1 })
      .lean();
  }

  public async setArchived(id: string, archived: boolean, owner: string) {
    const result = await this.leagues.findOneAndUpdate(
      { leagueId: id, ownerSubject: owner },
      { $set: { archived } },
      { returnDocument: 'after' },
    );
    if (!result) throw new HttpException(404, 'League not found.');
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
    const leagueId = input.leagueId.replace(/^0+(?=\d)/, '');
    if (await this.leagues.exists({ leagueId }))
      throw new HttpException(409, 'This league is already registered.');
    const league: League = {
      leagueId,
      leagueType: input.leagueType,
      leagueName: input.leagueName?.trim() || '',
      seasonId: input.seasonId,
      ownerSubject,
    };
    const info = await (
      await this.providerFor(league, ownerSubject)
    ).getLeague(league, league.seasonId);
    return this.leagues.create({
      ...league,
      leagueName: info.leagueName,
    }) as unknown as Promise<League>;
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
