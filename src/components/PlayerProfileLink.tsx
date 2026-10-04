import { Link } from '@tanstack/react-router';
export function PlayerProfileLink({
  leagueId,
  year,
  playerId,
  children,
}: {
  leagueId: string;
  year: number;
  playerId: string;
  children: React.ReactNode;
}) {
  return (
    <Link to="/players" search={{ leagueId, year, playerId }}>
      {children}
    </Link>
  );
}
