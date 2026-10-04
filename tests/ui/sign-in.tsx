import { createRoot } from 'react-dom/client';
import { Button } from '@chakra-ui/react';
import { Provider } from '../../src/components/ui/provider';
import { SignInLanding } from '../../src/auth/SignInLanding';
import '../../src/index.css';
const state = new URLSearchParams(location.search).get('state');
createRoot(document.getElementById('root')!).render(
  <Provider>
    <SignInLanding
      state={state === 'loading' || state === 'unconfigured' ? state : 'signed-out'}
      onSignIn={() => {
        document.title = 'Sign-in requested';
      }}
      recovery={
        <div>
          <p>Password recovery is available through your sign-in provider.</p>
          <Button
            variant="outline"
            mt={3}
            onClick={() => {
              document.title = 'Recovery requested';
            }}
          >
            Reset password through Auth0
          </Button>
        </div>
      }
    />
  </Provider>,
);
