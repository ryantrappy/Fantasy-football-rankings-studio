import type { ReactNode } from 'react';
import './sign-in.css';

const features = [
  {
    number: '01',
    title: 'A weekly view of your leagues',
    text: 'See your managed teams, matchups, lineup risks and playoff outlook in one workspace.',
  },
  {
    number: '02',
    title: 'More context for every decision',
    text: 'Compare players, explore legal lineup swaps and test trades with your league’s scoring rules.',
  },
  {
    number: '03',
    title: 'Rankings worth sharing',
    text: 'Turn your analysis into weekly power rankings, add your commentary and publish an approved edition.',
  },
];
export function SignInLanding({
  onSignIn,
  signingIn = false,
  error,
  recovery,
  state = 'signed-out',
}: {
  onSignIn?: () => void;
  signingIn?: boolean;
  error?: string;
  recovery?: ReactNode;
  state?: 'signed-out' | 'loading' | 'unconfigured';
}) {
  return (
    <div className="sign-in-page">
      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Trapp Fantasy Studio home">
          <span className="landing-mark" aria-hidden="true">
            <img src="/studio-icon.svg" width="44" height="44" alt="" />
          </span>
          <span>
            TRAPP<span className="landing-brand-subtitle">FANTASY STUDIO</span>
          </span>
        </a>
        <a className="landing-nav-link" href="#workspace-features">
          Explore the workspace <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-intro">
            <p className="landing-eyebrow">
              <span aria-hidden="true">—</span> YOUR NFL ANALYTICS WORKSPACE
            </p>
            <h1 id="landing-title">
              Know your team.
              <br />
              <span>Own your week.</span>
            </h1>
            <p className="landing-description">
              All your leagues. Better-informed decisions. A place to connect the numbers, set your
              weekly strategy and share your take.
            </p>
            <div className="landing-providers" aria-label="Supported league providers">
              <span>SLEEPER</span>
              <span className="landing-provider-divider" aria-hidden="true">
                /
              </span>
              <span>ESPN</span>
              <span className="landing-provider-caption">Your leagues, together.</span>
            </div>
            <div className="landing-login-area">
              {state === 'loading' ? (
                <output className="landing-state">Loading your session…</output>
              ) : state === 'unconfigured' ? (
                <div className="landing-error" role="alert">
                  <strong>Sign-in is not configured.</strong>
                  <p>
                    The server operator needs to finish account setup before you can open your
                    studio.
                  </p>
                </div>
              ) : (
                <>
                  <button
                    className="landing-primary-action"
                    type="button"
                    disabled={signingIn}
                    onClick={onSignIn}
                  >
                    {signingIn ? 'Opening sign-in…' : 'Sign in'} <span aria-hidden="true">→</span>
                  </button>
                  <p className="landing-login-note">
                    Your private workspace starts with your account.
                  </p>
                </>
              )}
              {error && (
                <p role="alert" className="landing-error">
                  {error}
                </p>
              )}
            </div>
          </div>
          <div className="landing-preview" aria-label="Illustrative weekly workspace preview">
            <div className="landing-preview-top">
              <span>YOUR WEEKLY WORKSPACE</span>
              <span className="landing-preview-badge">PREVIEW</span>
            </div>
            <div className="landing-preview-heading">
              <h2>The week ahead</h2>
              <span>NFL · WEEKLY VIEW</span>
            </div>
            <div className="landing-demo-matchup">
              <div className="landing-demo-title">
                <span>SUNDAY LEAGUE</span>
                <span>Sleeper</span>
              </div>
              <div className="landing-demo-teams">
                <div>
                  <span className="landing-demo-avatar">FL</span>
                  <strong>Fourth &amp; Long</strong>
                  <span>Your team</span>
                </div>
                <span className="landing-demo-vs">vs</span>
                <div>
                  <span className="landing-demo-avatar landing-demo-avatar-alt">PD</span>
                  <strong>Prime Dynasty</strong>
                  <span>Opponent</span>
                </div>
              </div>
              <div className="landing-demo-metrics">
                <div>
                  <span>League-scored projections</span>
                  <strong>Compare both sources</strong>
                </div>
                <div>
                  <span>Weekly strategy</span>
                  <strong>
                    Review your lineup <span aria-hidden="true">↗</span>
                  </strong>
                </div>
              </div>
            </div>
            <div className="landing-demo-insight">
              <span className="landing-insight-icon" aria-hidden="true">
                ↗
              </span>
              <div>
                <strong>See the whole picture.</strong>
                <p>
                  Player comparisons, roster risks and trade scenarios, connected to your league.
                </p>
              </div>
            </div>
            <div className="landing-demo-chart" aria-hidden="true">
              <span>PROJECTION SOURCES</span>
              <div>
                <span>ESPN</span>
                <i />
                <b>01</b>
              </div>
              <div>
                <span>Sleeper</span>
                <i />
                <b>02</b>
              </div>
            </div>
            <p className="landing-preview-caption">
              Illustrative preview. Connect your league after signing in.
            </p>
          </div>
        </section>
        <section
          className="landing-features"
          id="workspace-features"
          aria-labelledby="features-title"
        >
          <div className="landing-features-heading">
            <p className="landing-eyebrow">FROM ANALYSIS TO ACTION</p>
            <h2 id="features-title">One place for your weekly game plan.</h2>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article key={feature.number}>
                <span className="landing-feature-number">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>
        {recovery && state === 'signed-out' && (
          <section className="landing-recovery" aria-label="Account recovery">
            <div>
              <h2>Need a hand signing in?</h2>
              <p>Return to your studio through your account’s sign-in provider.</p>
            </div>
            <div>{recovery}</div>
          </section>
        )}
      </main>
      <footer className="landing-footer">
        <span>TRAPP FANTASY STUDIO</span>
        <span>Built for the way you play.</span>
      </footer>
    </div>
  );
}
