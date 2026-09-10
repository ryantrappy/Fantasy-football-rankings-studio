import { Box, Button, Heading, NativeSelect, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { copyEdition, type CopyOptions } from '../copy-edition';
import type { WeeklyRanking } from '../types';
export function CopyEdition({
  ranking,
  history,
  disabled,
  onCopy,
}: {
  ranking: WeeklyRanking;
  history: WeeklyRanking[];
  disabled: boolean;
  onCopy: (ranking: WeeklyRanking) => void;
}) {
  const choices = history.filter(
    (e) =>
      e.leagueId === ranking.leagueId &&
      (e.year < ranking.year || (e.year === ranking.year && e.week < ranking.week)),
  );
  const [selected, setSelected] = useState(''),
    [options, setOptions] = useState<CopyOptions>({
      introduction: false,
      commentary: false,
      order: false,
    }),
    [review, setReview] = useState(false),
    [notice, setNotice] = useState('');
  const source = choices.find((e) => `${e.year}:${e.week}` === selected);
  if (!choices.length) return null;
  const missing =
    source?.teams.filter((t) => !ranking.teams.some((d) => d.teamId === t.teamId)) ?? [];
  const renamed =
    source?.teams.filter((t) =>
      ranking.teams.some((d) => d.teamId === t.teamId && d.teamName !== t.teamName),
    ) ?? [];
  return (
    <Box as="details" mb={4}>
      <summary>Copy from a previous edition</summary>
      <Box p={4} bg="bg.muted" mt={2}>
        <NativeSelect.Root>
          <NativeSelect.Field
            aria-label="Source edition"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setReview(false);
            }}
          >
            <option value="">Choose an edition</option>
            {choices.map((e) => (
              <option key={`${e.year}:${e.week}`} value={`${e.year}:${e.week}`}>
                {e.year} · Week {e.week} · {e.rankingsTitle}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {(['introduction', 'commentary', 'order'] as const).map((key) => (
          <Box key={key} my={2}>
            <label>
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) => {
                  setOptions({ ...options, [key]: e.target.checked });
                  setReview(false);
                }}
              />{' '}
              Copy {key}
            </label>
          </Box>
        ))}
        <Button
          disabled={disabled || !source || !Object.values(options).some(Boolean)}
          onClick={() => setReview(true)}
        >
          Review copy
        </Button>
        {review && source && (
          <Box mt={3}>
            <Heading as="h3" size="md">
              {source.rankingsTitle}
            </Heading>
            <Text my={2}>
              Selected fields replace existing destination content. The destination title, team
              names and records stay unchanged. Unmatched destination teams are retained.
            </Text>
            <Text>
              {missing.length} source teams are absent and skipped. {renamed.length} renamed teams
              keep their destination names.
            </Text>
            <Text whiteSpace="pre-wrap" my={3}>
              {options.introduction ? source.introduction : ''}
            </Text>
            {options.commentary &&
              source.teams.map((t) => (
                <Text key={t.teamId} whiteSpace="pre-wrap" mb={2}>
                  {t.teamName}: {t.description}
                </Text>
              ))}
            <Button
              disabled={disabled}
              onClick={() => {
                onCopy(copyEdition(ranking, source, options));
                setReview(false);
                setNotice('Selected content copied.');
              }}
            >
              Confirm copy
            </Button>
          </Box>
        )}
        <Text as="output" mt={2}>
          {notice}
        </Text>
      </Box>
    </Box>
  );
}
