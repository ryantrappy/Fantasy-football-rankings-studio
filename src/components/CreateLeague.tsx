import { Box, Button, Field, Flex, Grid, Heading, Input, Text, chakra } from '@chakra-ui/react';
import { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import type { League, LeagueApi } from '../types';
import { errorMessage } from '../api/client';
import { defaultSeason } from '../util/rankings';
import { Icon } from './Icon';

export function CreateLeague({
  api,
  onCreated,
  onCancel,
}: {
  api: LeagueApi;
  onCreated: (league: League) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');
  const form = useForm({
    defaultValues: {
      leagueId: '',
      leagueName: '',
      leagueType: 0 as 0 | 1,
      seasonId: defaultSeason(),
    },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        onCreated(
          await api.createLeague({
            ...value,
            leagueId: value.leagueId.trim(),
            leagueName: value.leagueName.trim(),
          }),
        );
      } catch (failure) {
        setError(errorMessage(failure));
      }
    },
  });
  const {
    leagueId,
    leagueName,
    leagueType: provider,
    seasonId: season,
  } = useStore(form.store, (state) => state.values);
  const busy = useStore(form.store, (state) => state.isSubmitting);

  return (
    <Box className="create-page">
      <Button variant="plain" type="button" onClick={onCancel} disabled={busy}>
        ← Back to rankings
      </Button>
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        flexWrap="wrap"
        mt={4}
        mb={6}
        className="page-heading"
      >
        <Text mb={4} className="eyebrow">
          A new season of opinions
        </Text>
        <Heading as="h1" size="3xl" mb={4}>
          Create a league.
        </Heading>
        <Text mb={4}>Bring your league into the studio. We’ll take care of the teams.</Text>
      </Flex>
      <Grid
        templateColumns={{ base: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}
        gap={8}
        alignItems="start"
        className="create-layout"
      >
        <chakra.form
          bg="bg"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border"
          rounded="lg"
          p={{ base: 4, md: 6 }}
          className="panel league-form"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <fieldset disabled={busy}>
            <legend>
              01 <span>Choose your platform</span>
            </legend>
            <Flex gap={4} flexWrap={{ base: 'wrap', md: 'nowrap' }} className="provider-options">
              <label
                htmlFor="provider-sleeper"
                aria-label="Sleeper"
                className={`provider-option ${provider === 0 ? 'selected' : ''}`}
              >
                <chakra.input
                  accentColor="green.700"
                  width="auto"
                  type="radio"
                  name="provider"
                  id="provider-sleeper"
                  value="0"
                  checked={provider === 0}
                  onChange={() => form.setFieldValue('leagueType', 0)}
                />
                <span>
                  <strong>Sleeper</strong>
                  <small>Connect a Sleeper league</small>
                </span>
              </label>
              <label
                htmlFor="provider-espn"
                aria-label="ESPN"
                className={`provider-option ${provider === 1 ? 'selected' : ''}`}
              >
                <chakra.input
                  accentColor="green.700"
                  width="auto"
                  type="radio"
                  name="provider"
                  id="provider-espn"
                  value="1"
                  checked={provider === 1}
                  onChange={() => form.setFieldValue('leagueType', 1)}
                />
                <span>
                  <strong>ESPN</strong>
                  <small>Connect an ESPN league</small>
                </span>
              </label>
            </Flex>
          </fieldset>
          <fieldset disabled={busy}>
            <legend>
              02 <span>Make it yours</span>
            </legend>
            <Field.Root mb={5} gap={2} className="field">
              <Field.Label htmlFor="league-id">
                League ID <span className="required">Required</span>
              </Field.Label>
              <Input
                id="league-id"
                name="leagueId"
                inputMode="numeric"
                pattern="[0-9]+"
                maxLength={30}
                required
                value={leagueId}
                onChange={(event) => {
                  form.setFieldValue('leagueId', event.target.value);
                  setError('');
                }}
                placeholder="Enter your league ID"
                aria-describedby="league-id-help"
              />
              <small id="league-id-help">
                Copy the numeric ID from your league’s URL. Keep the full ID, including any leading
                zeros.
              </small>
            </Field.Root>
            <Field.Root mb={5} gap={2} className="field">
              <Field.Label htmlFor="league-name">
                Display name <span>Optional</span>
              </Field.Label>
              <Input
                id="league-name"
                name="leagueName"
                maxLength={120}
                value={leagueName}
                onChange={(event) => form.setFieldValue('leagueName', event.target.value)}
                placeholder="Use the name from your platform"
              />
            </Field.Root>
            <Field.Root mb={5} gap={2} className="field">
              <Field.Label htmlFor="league-season">Season</Field.Label>
              <Input
                className="season-field"
                id="league-season"
                name="season"
                type="number"
                min={2000}
                max={2100}
                required
                value={season}
                onChange={(event) => form.setFieldValue('seasonId', Number(event.target.value))}
              />
            </Field.Root>
          </fieldset>
          {error && (
            <Box className="notice error" role="alert">
              {error}
            </Box>
          )}
          <Flex
            align="center"
            justify="space-between"
            gap={4}
            flexWrap="wrap"
            mb={6}
            className="form-footer"
          >
            <Text mb={4}>Your league is checked before it’s added.</Text>
            <Button colorPalette="green" variant="solid" type="submit" disabled={busy}>
              {busy ? 'Connecting league…' : 'Create league'}
              {!busy && <Icon name="arrow" />}
            </Button>
          </Flex>
        </chakra.form>
        <Box as="aside" className="creation-guide">
          <span className="guide-mark">
            <Icon name="ball" size={30} />
          </span>
          <Heading as="h2" size="xl" mb={4}>
            Your league.
            <br />
            Your point of view.
          </Heading>
          <Text mb={4}>
            This creates a rankings workspace for a league you already run on Sleeper or ESPN.
          </Text>
          <ol>
            <li>
              <strong>Find your league ID</strong>
              <span>
                Open your league in a browser. Sleeper uses the number after /leagues/; ESPN uses
                the leagueId parameter.
              </span>
            </li>
            <li>
              <strong>Bring in your teams</strong>
              <span>Team names, managers, and records are loaded automatically.</span>
            </li>
            <li>
              <strong>Set the pecking order</strong>
              <span>Reorder the field, add your commentary, and export the finished rankings.</span>
            </li>
          </ol>
          <Text mb={4} className="guide-footnote">
            Private ESPN leagues use the cookies saved in your ESPN settings.
          </Text>
        </Box>
      </Grid>
    </Box>
  );
}
