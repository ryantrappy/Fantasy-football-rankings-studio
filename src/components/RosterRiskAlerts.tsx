import { Box, Button, Heading, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { LiveTeam } from '../live-matchups';
import { rosterAlerts, readAlertDismissals, saveAlertDismissals } from '../roster-alerts';
import { PlayerProfileLink } from './PlayerProfileLink';
export function RosterRiskAlerts({
  team,
  leagueId,
  year,
  week,
  capturedAt,
  slots,
  subject,
}: {
  team: LiveTeam;
  leagueId: string;
  year: number;
  week: number;
  capturedAt?: string;
  slots?: string[];
  subject?: string;
}) {
  const [dismissed, setDismissed] = useState(() => readAlertDismissals(subject));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const conditions = rosterAlerts(team, leagueId, year, week, capturedAt, slots, now);
  const alerts = conditions.filter((alert) => !dismissed.includes(alert.id));
  return (
    <Box as="section" aria-label={`${team.name} roster risks`} mt={3}>
      <Heading as="h4" size="md">
        Roster risks
      </Heading>
      {!alerts.length && (
        <Text>
          No active alerts in the available inputs. Missing coverage is not evidence that every
          player is healthy.
        </Text>
      )}
      {alerts.map((alert) => (
        <Box key={alert.id} mt={2} borderWidth="1px" p={2}>
          <Text>
            <strong>{alert.severity}</strong> · Week {alert.week} · {alert.message}
          </Text>
          <Text fontSize="sm">Source: {alert.timestamp}</Text>
          {alert.playerId && (
            <PlayerProfileLink leagueId={leagueId} year={year} playerId={alert.playerId}>
              Review affected player
            </PlayerProfileLink>
          )}{' '}
          <a href={`#lineup-${leagueId}`}>Review lineup</a>{' '}
          <Button
            size="xs"
            variant="outline"
            aria-label={`Dismiss ${alert.message}`}
            onClick={() => {
              const next = [...dismissed, alert.id];
              setDismissed(next);
              saveAlertDismissals(subject, next);
            }}
          >
            Dismiss
          </Button>
        </Box>
      ))}
      {dismissed.some((id) => conditions.some((alert) => alert.id === id)) && (
        <Button
          mt={2}
          variant="outline"
          onClick={() => {
            const next = dismissed.filter((id) => !conditions.some((alert) => alert.id === id));
            setDismissed(next);
            saveAlertDismissals(subject, next);
          }}
        >
          Show dismissed risks for this team
        </Button>
      )}
    </Box>
  );
}
