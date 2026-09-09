import { useAuth0 } from '@auth0/auth0-react';
import { Box, Button, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { logClientError } from '../logging';

export function PasswordReset() {
  const { loginWithRedirect } = useAuth0();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <Box mt={4} textAlign="left">
      <Text fontSize="sm" color="fg.muted" mb={2}>
        For an email and password account, open the sign-in screen and choose “Forgot password?” (or
        “Don’t remember your password?”). For Google or another provider, reset your password with
        that provider.
      </Text>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError(false);
          try {
            await loginWithRedirect({
              authorizationParams: { prompt: 'login', screen_hint: 'login' },
              appState: { returnTo: window.location.pathname + window.location.search },
            });
          } catch (failure) {
            logClientError('auth.passwordReset', failure);
            setError(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Opening sign-in…' : 'Reset password through Auth0'}
      </Button>
      {error && (
        <Text role="alert" mt={2}>
          Could not open password recovery. Please try again.
        </Text>
      )}
    </Box>
  );
}
