export function CodexSetupGuide() {
  return (
    <details className="codex-setup-guide">
      <summary>Operator Codex setup instructions</summary>
      <div>
        <p>
          These steps are for the person who runs this application server. Your app sign-in does not
          connect a personal ChatGPT account. Ask the operator to complete setup if you do not
          manage the server.
        </p>
        <ol>
          <li>
            Enable Codex in <code>WRITING_AI_PROVIDERS</code> and add each authorized user's app
            account ID to <code>WRITING_AI_USERS</code>. Use the account ID shown in Your profile,
            not an email address. Start or recreate the app with the updated configuration.
          </li>
          <li>
            For Docker, run device login on the app server in the directory containing the Compose
            file:
            <pre>
              <code>{`docker compose exec rankings_studio codex -c 'cli_auth_credentials_store="file"' login --device-auth`}</code>
            </pre>
            Follow the CLI's sign-in instructions in your own browser. Device-code login may need to
            be enabled in the ChatGPT account's security settings or by its administrator. A login
            on another computer does not sign in the app container.
          </li>
          <li>
            Check the container's login:
            <pre>
              <code>docker compose exec rankings_studio codex login status</code>
            </pre>
            It should report <strong>Logged in using ChatGPT</strong>. Keep the Compose Codex home
            volume so container recreation preserves the login. For a non-Docker deployment, run
            Codex login and its status check as the same operating-system account that runs the app.
          </li>
          <li>
            Refresh readiness here, then choose Codex and approve the displayed context before
            generating. A ready login still needs available model access and quota.
          </li>
        </ol>
        <p>
          Authorized users share the operator's ChatGPT account and quota. A saved personal OpenAI
          key takes precedence; remove it in Your profile only if you want to use the server login.
          Never paste login tokens or credential files into the app or a shared report.
        </p>
      </div>
    </details>
  );
}
