import './decision-explorer.css';
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
  const renderAlert = (alert: (typeof alerts)[number]) => (
    <Box key={alert.id} mt={2} className="roster-risk" data-severity={alert.severity}>
      <Text fontSize="sm">
        <strong>{alert.severity}</strong> · Week {alert.week} · {alert.message}
      </Text>
      <Text fontSize="xs">Source: {alert.timestamp}</Text>
      {alert.playerId && (
        <PlayerProfileLink leagueId={leagueId} year={year} playerId={alert.playerId}>
          Review affected player
        </PlayerProfileLink>
      )}{' '}
      <a
        href={`#lineup-${leagueId}`}
        onClick={() => document.getElementById(`lineup-${leagueId}`)?.setAttribute('open', '')}
      >
        Review lineup
      </a>{' '}
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
  );
  return (
    <Box
      as="section"
      className="decision-explorer-risks"
      aria-label={`${team.name} roster risks · League ${leagueId} · ${year}`}
      mt={3}
    >
      <Heading as="h4" size="md">
        Roster risks
      </Heading>
      {!alerts.length && (
        <Text>
          No active alerts in the available inputs. Missing coverage is not evidence that every
          player is healthy.
        </Text>
      )}
      {!!alerts.length && (
        <Text className="roster-risk-count">
          {alerts.length} active · {alerts.filter((alert) => alert.severity === 'High').length} high
          priority.{' '}
          {alerts.length > 1 ? 'First priority shown below; expand to review every condition.' : ''}
        </Text>
      )}
      {alerts[0] && renderAlert(alerts[0])}
      {alerts.length > 1 && (
        <details className="roster-risk-details">
          <summary>Expand all {alerts.length} roster risks</summary>
          {alerts.slice(1).map(renderAlert)}
        </details>
      )}
      {dismissed.some((id) => conditions.some((alert) => alert.id === id)) && (
        <Button
          mt={2}
          aria-label="Show dismissed risks for this team"
          variant="outline"
          onClick={() => {
            const next = dismissed.filter((id) => !conditions.some((alert) => alert.id === id));
            setDismissed(next);
            saveAlertDismissals(subject, next);
          }}
        >
          Show dismissed risks for this team · Dismissed alerts (
          {conditions.filter((alert) => dismissed.includes(alert.id)).length})
        </Button>
      )}
    </Box>
  );
}
