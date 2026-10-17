// Captures only affected screens into a separate native proposal. Baseline stays intact.
import { execFileSync } from 'node:child_process';
const env = {
  ...process.env,
  DESIGN_BASE_URL: process.env.DESIGN_BASE_URL || 'http://127.0.0.1:3108',
  DESIGN_OUTPUT_DIR: './ui-refinement/',
  DESIGN_SCREEN_TITLES:
    'Rankings studio|Season insights|Live matchups|Manage leagues|Connect league',
  DESIGN_FILE_NAME: 'ui-refinement.fig',
  DESIGN_PAGE_LABEL: 'UI refinement proposal',
};
for (const script of ['capture.mjs', 'build.mjs']) {
  execFileSync(process.execPath, [new URL(script, import.meta.url).pathname], {
    env,
    stdio: 'inherit',
  });
}
