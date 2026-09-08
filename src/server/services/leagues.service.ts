import leagueModel from '../models/league.model';
import { League, LeagueType } from '../interfaces/league.interface';
import HttpException from '../exceptions/HttpException';
import { LeagueProvider } from '../providers/league-provider';
import SleeperProvider from '../providers/sleeper.provider';
import EspnProvider from '../providers/espn.provider';

class LeaguesService {
  public leagues = leagueModel;
  public providers: Record<LeagueType, LeagueProvider> = {
    [LeagueType.Sleeper]: new SleeperProvider(),
    [LeagueType.Espn]: new EspnProvider(),
  };

  public async getLeagueById(id: string, ownerSubject: string): Promise<League> {
    const league = await this.leagues.findOne({ leagueId: id, ownerSubject }).lean();
    if (!league) throw new HttpException(404, 'League not found.');
    return league as unknown as League;
  }

  public async listLeagues(ownerSubject: string) {
    return this.leagues.find({ ownerSubject }).sort({ leagueName: 1 }).lean();
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
    const info = await this.providers[league.leagueType].getLeague(league, league.seasonId);
    return this.leagues.create({
      ...league,
      leagueName: info.leagueName,
    }) as unknown as Promise<League>;
  }

  public async getLeagueInfo(id: string, seasonId: number, ownerSubject: string) {
    const league = await this.getLeagueById(id, ownerSubject);
    return this.providers[league.leagueType].getLeague(league, seasonId);
  }

  public async getTeams(id: string, seasonId: number, week: number, ownerSubject: string) {
    const league = await this.getLeagueById(id, ownerSubject);
    return this.providers[league.leagueType].getTeams(league, seasonId, week);
  }

  public async getMatchups(id: string, seasonId: number, week: number, ownerSubject: string) {
    const league = await this.getLeagueById(id, ownerSubject);
    return this.providers[league.leagueType].getMatchups(league, seasonId, week);
  }
}
export default LeaguesService;
