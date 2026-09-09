export interface SeasonResult {
  teamId: string;
  playoff: boolean | null;
  finish: number | null;
  champion: boolean | null;
  lastPlace: boolean | null;
}
export interface ScoreWeek {
  teamId: string;
  week: number;
  actual: number;
  projected: number | null;
  opponentTeamId?: string | null;
  lineupAvailable?: boolean;
  starters: { playerId: string; points: number }[];
  players?: { playerId: string; points: number }[];
}
export interface PlayerMove {
  id: string;
  week: number;
  timestamp: number;
  type: 'trade' | 'pickup' | 'drop';
  playerId: string;
  from: string | null;
  to: string | null;
}
export interface InsightsSource {
  results?: SeasonResult[];
  completedWeek: number;
  teams: { teamId: string; teamName: string; managerName: string; managerKey?: string }[];
  scores: ScoreWeek[];
  moves: PlayerMove[];
  playerNames: Record<string, string>;
  playerPositions?: Record<string, string>;
  draftPickTradeIds?: string[];
  notes: string[];
  draftPickTrades: number;
}
export interface TradeComparison {
  id: string;
  week: number;
  weeks: number[];
  possibleWeeks: number;
  verdict: 'leader' | 'close' | 'insufficient' | 'picks';
  winner: string | null;
  sides: {
    teamId: string;
    received: string[];
    sent: string[];
    receivedValue: number | null;
    sentValue: number | null;
    gain: number | null;
  }[];
}
export interface PickupComparison {
  position: string | null;
  baseline: string;
  lift: number | null;
  comparisonWeeks: number[];
  averagePoints: number | null;
  averageBaseline: number | null;
}
export interface SeasonInsights {
  results?: SeasonResult[];
  tradeComparisons: TradeComparison[];
  completedWeek: number;
  generatedAt: string;
  notes: string[];
  teams: (InsightsSource['teams'][number] & {
    weeks: number;
    total: number;
    average: number | null;
    best: number | null;
    projectedWeeks: number;
    projectionDelta: number | null;
    beatProjection: number;
    aboveMedian: number;
    tradeCount: number;
    receivedPoints: number;
    sentPoints: number;
    netTradePoints: number | null;
    tradeStarts: number;
  })[];
  scores: ScoreWeek[];
  pickups: (PickupComparison & {
    id: string;
    teamId: string;
    player: string;
    week: number;
    points: number;
    starts: number;
    eligibleWeeks: number;
  })[];
  trades: {
    id: string;
    week: number;
    teamId: string;
    received: string[];
    sent: string[];
    receivedPoints: number;
    sentPoints: number;
    net: number | null;
    starts: number;
    eligibleWeeks: number;
  }[];
}
