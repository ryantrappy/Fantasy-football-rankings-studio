import { Box, Heading, Stack, Text } from '@chakra-ui/react';
export function CalculationGuide() {
  return (
    <Box as="details" my={5} p={{ base: 4, md: 6 }} bg="bg" borderWidth="1px" rounded="lg">
      <summary>How are these numbers calculated?</summary>
      <Stack gap={4} mt={4}>
        <Heading as="h3" size="lg">
          Schedule luck: a worked example
        </Heading>
        <Text>
          Each week, expected wins = (opponents outscored + half of opponents tied) ÷ other teams.
          Actual wins are 1 for a win, 0.5 for a tie, and 0 for a loss. Extra wins = actual wins −
          expected wins. Luck index = 100 × extra wins ÷ measured games, expressed in percentage
          points (pp).
        </Text>
        <Text>
          Example: in a four-team league, scores are 120, 110, 100 and 90. The 110-point team beats
          two of its three possible opponents, so its expected wins are 2 ÷ 3 = 0.67. If it faces
          the 90-point team and wins, it earns 1 − 0.67 = +0.33 extra wins and a +33.3 pp index for
          that game. If it faces the 120-point team and loses, its index is −66.7 pp.
        </Text>
        <Text>
          Only regular-season games with a reciprocal opponent and every team’s score qualify. Byes,
          playoffs and missing opponents are excluded. Positive means a favorable schedule; negative
          means an unfavorable schedule. This does not measure injury luck.
        </Text>
        <Heading as="h3" size="lg">
          Scoring and projections
        </Heading>
        <Text>
          Average points = total points ÷ observed weeks. Best week is the highest score. The weekly
          median is the middle league score (or the average of the two middle scores). Above median
          counts strictly higher scores; ties do not count. Average vs. median averages 100 × (score
          − median) ÷ median across weeks with a positive median. Best week vs. median uses the
          largest percentage, which may differ from the highest raw score.
        </Text>
        <Text>
          All-play win rate compares each score with every other observed team score that week; ties
          count half. Unlike schedule luck, scoring and all-play can include playoff weeks and
          partially available league scores. Projection difference = actual − projected points; its
          average and beat-projection count use only weeks with a projection. Missing data appears
          as —, not zero.
        </Text>
        <Heading as="h3" size="lg">
          Trades and pickups
        </Heading>
        <Text>
          Trade net gain per week = received positional value − sent positional value. Each player’s
          value is points above the median of at least three other same-position starters, excluding
          traded players. All assets use the same available weeks in the first four weeks after the
          trade. A grade needs at least two shared weeks and 75% of the completed window. A leader
          needs more than a 1 point/week gap over the next side; otherwise it is close. Trades
          involving draft picks are ungraded.
        </Text>
        <Text>
          Pickup lift per start = average player points − average baseline points over at least two
          comparable starts in the first four weeks after acquisition, stopping before the next
          move. A single same-position add/drop pair uses the dropped player only with complete
          coverage; otherwise it uses one consistent positional starter-median baseline. The
          acquisition week is excluded for both trades and pickups.
        </Text>
        <Text>
          Trade gain / trade and pickup lift / pickup average only graded moves, with each move
          weighted equally. Pickup hit rate is positive-lift pickups ÷ rated pickups × 100. Measured
          pickup surplus sums each lift × compared starts; it is not a full-season total. Ungraded
          trades are not losses. Leader cards require 3 graded trades, 5 rated pickups, or 4 weeks
          with a positive median.
        </Text>
        <Heading as="h3" size="lg">
          Across seasons
        </Heading>
        <Text>
          History pools measured games, weeks, comparisons and moves before calculating rates; it
          does not average season percentages equally. Failed seasons are excluded. Managers match
          by provider account ID; ownership changes create separate records. Hiding former managers
          does not remove them from historical league baselines. Scores use each season’s league
          settings, so raw points across different scoring rules are not directly comparable.
        </Text>
      </Stack>
    </Box>
  );
}
