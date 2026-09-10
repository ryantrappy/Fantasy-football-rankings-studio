import HttpException from '../exceptions/HttpException';
import type { Team } from '../interfaces/teams.interface';

export function unavailableRecords(): never {
  throw new HttpException(
    422,
    'Historical records could not be established for this week or league format. Current season records have not been substituted.',
  );
}
export type RecordGame = {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  winner?: 'HOME' | 'AWAY' | 'TIE';
};
export function withHistoricalRecords(teams: Team[], games: RecordGame[]): Team[] {
  const records = new Map(teams.map((t) => [t.teamId, { wins: 0, loss: 0, ties: 0 }]));
  for (const game of games) {
    const home = records.get(game.home),
      away = records.get(game.away);
    if (!home || !away || !Number.isFinite(game.homeScore) || !Number.isFinite(game.awayScore))
      unavailableRecords();
    const winner =
      game.winner ||
      (game.homeScore > game.awayScore ? 'HOME' : game.homeScore < game.awayScore ? 'AWAY' : 'TIE');
    if (winner === 'TIE') {
      home.ties++;
      away.ties++;
    } else if (winner === 'HOME') {
      home.wins++;
      away.loss++;
    } else {
      home.loss++;
      away.wins++;
    }
  }
  return teams.map((t) => ({ ...t, ...records.get(t.teamId)! }));
}
