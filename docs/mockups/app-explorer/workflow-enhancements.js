const workflowOriginalRankings = renderers[0];
const workflowOriginalLeagues = renderers[7];
const workflowOriginalConnect = renderers[8];
let workflowUndo = null,
  workflowArchive = false,
  workflowContextReturn = false;
let workflowConsent = { Codex: false, Claude: false },
  workflowProvider = 'Codex',
  workflowModel = '',
  workflowRunning = false,
  workflowGeneration = 0,
  workflowSuggestion = '',
  workflowShowRoster = false;
let workflowPublished = false,
  workflowSnapshot = false,
  workflowReadiness = 'ready';
function workflowButton(label, action, cls = '') {
  return `<button class="${cls}" data-workflow="${action}">${label}</button>`;
}
function workflowModal(title, body) {
  $('#dialog').classList.add('modal-wide');
  modal(title, body);
}
function expandedRankings() {
  let html = workflowOriginalRankings();
  html = html.replaceAll('class="rankrow ', 'draggable="true" tabindex="0" class="rankrow ');
  if (tab === 'Edit rankings')
    html = html.replace(
      '<div class="actions">' + btn('Copy edition', 'copy'),
      '<div class="ranking-secondary">' +
        workflowButton('Save rankings', 'save-ranking', 'primary') +
        workflowButton('Undo move', 'undo') +
        workflowButton('Draft & save status', 'draft') +
        '</div><div class="actions">' +
        btn('Copy edition', 'copy'),
    );
  return html;
}
function workflowRosterEvidence() {
  return `<div class="workflow-evidence"><h3>Current roster evidence</h3><p class="muted">Sample league · Week 7 · Captured 5 minutes ago · Only currently owned players</p>${table(
    ['Slot', 'Current starter', 'Bench option', 'Projection source'],
    [
      ['QB', 'Jalen Hurts · 24.0', 'Daniel Jones · 9.0', 'Sleeper + ESPN'],
      ['RB', 'James Cook · 20.2', 'Zach Charbonnet · 5.2', 'Sleeper + ESPN'],
      ['WR', 'Justin Jefferson · 16.4', 'Jordan Addison · 4.8', 'Sleeper + ESPN'],
    ],
  )}${helpTip('Historical ownership', 'Historical editions use an archived roster when available. A current roster is not substituted for unknown historical ownership.')}</div>`;
}
function showWritingAssistant() {
  const approved = workflowConsent[workflowProvider];
  workflowModal(
    'Writing assistant',
    `<div class="workflow-panel"><div class="workflow-row"><label>Assistant<select id="wf-provider"><option ${workflowProvider === 'Codex' ? 'selected' : ''}>Codex</option><option ${workflowProvider === 'Claude' ? 'selected' : ''}>Claude</option></select></label><label>Model<input id="wf-model" value="${esc(workflowModel)}" list="wf-model-list" placeholder="Use account default or enter a model"><datalist id="wf-model-list">${(workflowProvider === 'Codex' ? ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol'] : ['sonnet', 'opus', 'haiku']).map((x) => '<option value="' + x + '">').join('')}</datalist></label></div><div class="workflow-status"><strong>${workflowProvider}: ${workflowReadiness === 'ready' ? 'Ready' : workflowReadiness === 'disabled' ? 'Disabled for this application account' : workflowReadiness === 'missing' ? 'Server CLI is missing' : 'Login check failed'}</strong>${workflowReadiness === 'ready' ? 'Sample readiness check passed. Account access and quota are checked when generating.' : workflowReadiness === 'disabled' ? 'Ask the operator to enable your application account.' : workflowReadiness === 'missing' ? 'Ask the operator to rebuild the Docker image with the selected CLI.' : 'Ask the operator to sign in again on the Docker host.'} ${workflowButton('Refresh readiness', 'readiness')}</div><p class="identity-help">An API key is optional. Server-managed Codex uses the operator’s account and quota; a saved personal key takes precedence.</p><div class="saved-consent"><div><strong>League context sharing</strong><small style="display:block">${approved ? 'Approval saved for ' + workflowProvider : 'Approval required for ' + workflowProvider}</small></div>${approved ? workflowButton('Revoke approval', 'revoke') : workflowButton('Approve context sharing', 'approve', 'primary')}</div><p class="muted">Selected team, completed scores, matchups, ranking context, and current owned roster can be shared with the selected assistant. ${helpTip('What is shared', 'Only the approved league/team context for this request. Saved secrets and other users’ information are excluded. Approval can be revoked at any time.')}</p>${workflowButton(workflowShowRoster ? 'Hide roster evidence' : 'Inspect current roster evidence', 'roster')}${workflowShowRoster ? workflowRosterEvidence() : ''}<div class="actions"><button data-workflow="generate" class="primary" ${!approved || workflowRunning || workflowReadiness !== 'ready' ? 'disabled' : ''}>${workflowRunning ? 'Generating sample suggestion…' : 'Generate suggestion'}</button>${workflowRunning ? workflowButton('Cancel generation', 'cancel') : ''}</div>${workflowSuggestion ? `<label>Editable suggestion<textarea id="wf-suggestion">${esc(workflowSuggestion)}</textarea></label>${workflowButton('Use suggestion in team take', 'apply', 'primary')}` : ''}<small>Mockup only. No AI request is sent.</small></div>`,
  );
}
function expandedProfile() {
  const t = tabs(['Profile details', 'Writing connections', 'ESPN settings']);
  let body = '';
  if (tab === 'Profile details')
    body = `<div class="account-identity"><div><span>Email</span><strong>alex@example.com</strong><small class="good" style="display:block">Verified</small></div><div><span>Account identity</span><strong>Sample account</strong><small style="display:block">auth0|sample-alex</small></div></div><div class="fieldstack">${field('Name', 'Alex Morgan')}${field('Nickname', 'Alex')}${workflowButton('Save profile', 'profile-save', 'primary')}</div><div class="workflow-evidence" style="margin-top:20px"><h3>Password recovery</h3><p class="identity-help">Email/password accounts use Auth0’s “Forgot password?” flow. Google and other social accounts recover passwords with that provider.</p>${workflowButton('Reset password through Auth0', 'password')}</div>`;
  else if (tab === 'Writing connections')
    body = `${head('Writing connections', 'Use your own key or an enabled server-managed account.')}<div class="workflow-status"><strong>Server-managed Codex: ${workflowReadiness === 'ready' ? 'Ready' : workflowReadiness === 'disabled' ? 'Not enabled' : workflowReadiness === 'missing' ? 'Not installed' : 'Login check failed'}</strong>${workflowReadiness === 'ready' ? 'The server login check passed. Generation still depends on account access and available quota.' : 'Ask the operator to check account enablement, CLI installation, and login.'}</div><p class="identity-help">Your app sign-in does not connect ChatGPT. An operator signs in to Codex on the Docker host and enables your account. Authorized users share the operator’s account and quota. ${helpTip('API-key precedence', 'A saved personal OpenAI key takes precedence over the server-managed login. Removing that key returns to the enabled server login. Claude uses its corresponding saved key or configured server provider.')}</p><div class="actions">${workflowButton('Refresh Codex readiness', 'profile-readiness')}${workflowButton('Codex setup instructions', 'setup')}</div><div class="fieldstack" style="margin-top:18px">${kv('OpenAI API key', 'Saved · takes precedence')}${field('Replace OpenAI API key', '', 'password')}${workflowButton('Save OpenAI key', 'key-save')}${workflowButton('Remove OpenAI key', 'key-remove')}${kv('Anthropic API key', 'Saved')}${field('Replace Anthropic API key', '', 'password')}${workflowButton('Save Anthropic key', 'key-save')}${workflowButton('Remove Anthropic key', 'key-remove')}</div>`;
  else
    body = `${head('ESPN settings', 'Private leagues use encrypted, account-specific cookies.')}<div class="fieldstack">${field('espn_s2', '', 'password')}${field('SWID', '', 'password')}${workflowButton('Save ESPN settings', workflowContextReturn ? 'espn-return' : 'key-save', 'primary')}${workflowButton('Remove ESPN settings', 'key-remove')}${workflowContextReturn ? workflowButton('Skip and return to league setup', 'espn-skip') : ''}</div><div class="actions" style="margin-top:14px">${workflowButton('Find ESPN cookies', 'espn-help')}</div>`;
  return (
    heading('Your profile', 'Your identity and the connections you use to write and play.') +
    `<section class="workspace">${identity('Alex Morgan', 'Sample account', [['Connected leagues', '2']])}${t}${split('<div class="settings">' + body + '</div>', `<h3>Account settings</h3><p>Keys and cookies are never displayed after saving. ${helpTip('Stored credentials', 'Production stores encrypted credentials scoped to your authenticated account. This mockup does not send or store sensitive inputs.')}</p>${btn('Manage leagues', 'go:7')}`)}</section>`
  );
}
function expandedLeagues() {
  let html = workflowOriginalLeagues();
  html = html.replace(
    head('Connected leagues', 'Select a league to review or change its connection.'),
    head(
      workflowArchive ? 'Archived leagues' : 'Connected leagues',
      'Manage a league without changing its provider data.',
      workflowButton(
        workflowArchive ? 'Show active leagues' : 'Show archived leagues',
        'archive-view',
      ),
    ),
  );
  html = html.replace(
    '<h3>' + (selected ? 'Sunday league' : 'Sample league') + '</h3>',
    `<h3>${selected ? 'Sunday league' : 'Sample league'}</h3><div class="fieldstack" style="margin:12px 0">${select('Managed-team season', ['2025', '2024', '2023'])}${select('Managed team', ['No team / commissioner', ...teams])}${workflowButton('Save managed team', 'managed-save')}${workflowButton('Clear managed team', 'managed-clear')}${workflowButton(workflowArchive ? 'Restore league' : 'Archive league', 'archive')}</div>`,
  );
  return html;
}
function workflowShare() {
  workflowModal(
    'Share report',
    `<div class="workflow-panel"><div class="workflow-status"><strong>${workflowPublished ? 'Sharing enabled' : 'Sharing disabled'}</strong>${workflowSnapshot ? 'Frozen sample snapshot' : 'Current report link'} ${helpTip('ESPN snapshots', 'Private ESPN report snapshots use stored report data, do not expose cookies, and expire after 10 days. Revocation removes public access.')}</div><div class="actions">${workflowButton('Enable sharing', 'share-enable')}${workflowButton('Copy current report link', 'share-copy')}${workflowButton('Create frozen snapshot', 'snapshot')}${workflowButton('Revoke public access', 'share-revoke')}</div><small>Sample flow only; no public link is created.</small></div>`,
  );
}
renderers[0] = expandedRankings;
renderers[7] = expandedLeagues;
renderers[9] = expandedProfile;
document.addEventListener(
  'click',
  (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.action;
    if (['up', 'down'].includes(a?.split(':')[0])) workflowUndo = [...order];
    if (a === 'espn' && page === 8) workflowContextReturn = true;
    if (a === 'share') {
      e.stopImmediatePropagation();
      workflowShare();
    } else if (a === 'writing') {
      e.stopImmediatePropagation();
      showWritingAssistant();
    } else if (a === 'copy') {
      e.stopImmediatePropagation();
      workflowModal(
        'Copy a previous edition',
        `<div class="workflow-panel">${select('Source edition', ['2025 · Week 6', '2025 · Week 5', '2024 · Week 7'])}${['Introduction', 'Commentary', 'Order'].map((x) => `<label class="workflow-check"><input type="checkbox" class="wf-copy-option">Copy ${x.toLowerCase()}</label>`).join('')}${workflowButton('Review copy', 'copy-review')}</div>`,
      );
    } else if (a === 'revision') {
      e.stopImmediatePropagation();
      workflowModal(
        'Revision history',
        `<div class="workflow-panel">${select('Saved revision', ['Today 10:42 AM · Current', 'Today 10:26 AM', 'Yesterday 8:15 PM'])}${workflowButton('Preview selected revision', 'revision-preview')}</div>`,
      );
    } else if (a === 'shortcuts') {
      e.stopImmediatePropagation();
      workflowModal(
        'Keyboard shortcuts',
        table(
          ['Key', 'Action'],
          [
            ['Space / Enter', 'Lift or drop focused team'],
            ['Arrow up / down', 'Move a lifted team'],
            ['Escape', 'Cancel keyboard drag'],
            ['Enter / Space', 'Activate move or Undo buttons'],
          ],
        ) + '<p class="muted">Typing in commentary fields keeps normal keyboard behavior.</p>',
      );
    }
  },
  true,
);
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-workflow]');
  if (!b) return;
  const a = b.dataset.workflow;
  if (a === 'approve' || a === 'revoke') {
    workflowConsent[workflowProvider] = a === 'approve';
    if (a === 'revoke') {
      workflowRunning = false;
      workflowGeneration++;
    }
    showWritingAssistant();
  } else if (a === 'roster') {
    workflowShowRoster = !workflowShowRoster;
    showWritingAssistant();
  } else if (a === 'generate') {
    workflowRunning = true;
    workflowSuggestion = '';
    const run = ++workflowGeneration;
    showWritingAssistant();
    setTimeout(() => {
      if (run !== workflowGeneration || !workflowRunning) return;
      workflowRunning = false;
      workflowSuggestion =
        'Another strong scoring week keeps this team in contention. The current roster has reliable starters, with depth worth watching at running back.';
      showWritingAssistant();
    }, 1800);
  } else if (a === 'cancel') {
    workflowGeneration++;
    workflowRunning = false;
    showWritingAssistant();
    toast('Generation cancelled. Your team take is unchanged.');
  } else if (a === 'apply') {
    draftValues['Team take ' + order[selected]] = $('#wf-suggestion').value;
    $('#dialog').close();
    render();
    toast('Suggestion added to your editable team take.');
  } else if (a === 'readiness') {
    workflowReadiness = 'ready';
    showWritingAssistant();
  } else if (a === 'profile-readiness') {
    workflowReadiness = 'ready';
    render();
    toast('Sample readiness check passed.');
  } else if (a === 'setup') {
    workflowModal(
      'Server-managed Codex setup',
      `<ol><li>The server operator installs the CLI in the application image.</li><li>The operator signs in to Codex on the Docker host using the account running the app.</li><li>The operator verifies login and enables the application account for suggestions.</li><li>Refresh readiness here. Missing installation, disabled accounts, and failed login checks remain distinct.</li></ol><p>Authorized users share the operator’s account and quota. Saved personal keys take precedence.</p>`,
    );
  } else if (a === 'password') {
    workflowModal(
      'Password recovery',
      '<p>The final app opens Auth0 Universal Login and preserves your return path. Choose “Forgot password?” for email/password accounts. Social accounts recover through their identity provider.</p><p class="muted">This mockup does not start authentication.</p>',
    );
  } else if (a === 'copy-review') {
    const choices = [...document.querySelectorAll('.wf-copy-option:checked')];
    if (!choices.length) {
      toast('Choose at least one field to copy.');
      return;
    }
    workflowModal(
      'Review copy',
      '<p>Selected fields replace destination content. The edition title, team names and historical records stay unchanged. Unmatched destination teams are retained.</p>' +
        kv('Absent source teams', '1 skipped') +
        kv('Renamed teams', '1 keeps destination name') +
        table(
          ['Rank', 'Team', 'Sample commentary'],
          order.slice(0, 3).map((n, i) => [i + 1, n, 'Previous edition take']),
        ) +
        workflowButton('Confirm copy', 'copy-confirm', 'primary'),
    );
  } else if (a === 'copy-confirm') {
    workflowUndo = [...order];
    toast('Sample selected fields copied.');
    $('#dialog').close();
  } else if (a === 'revision-preview') {
    workflowModal(
      'Revision preview',
      `<h3>Week 7: Earlier edition</h3><p>Earlier opening take, order, and commentary are shown before restoration.</p>${table(
        ['Rank', 'Team', 'Commentary'],
        order.map((n, i) => [i + 1, n, 'Earlier saved take']),
      )}${workflowButton('Restore as new current revision', 'revision-restore', 'primary')}`,
    );
  } else if (a === 'revision-restore') {
    toast('Sample revision restored as a new revision. History retained.');
    $('#dialog').close();
  } else if (a === 'undo') {
    if (workflowUndo) {
      order = [...workflowUndo];
      workflowUndo = null;
      render();
      toast('Move undone.');
    } else toast('No move to undo yet.');
  } else if (a === 'save-ranking') {
    toast('Sample ranking saved. Production retains autosave and conflict checks.');
  } else if (a === 'draft') {
    workflowModal(
      'Draft & save status',
      `<div class="workflow-panel"><div class="workflow-status"><strong>Recovered local draft</strong>Review the title, opening take, order and commentary before restoring.</div>${table(
        ['Field', 'Recovered content'],
        [
          ['Title', 'Week 7: The contenders emerge'],
          ['Team order', order.join(', ')],
          ['Commentary', 'Your unsaved team takes'],
        ],
      )}<div class="actions">${workflowButton('Restore draft', 'draft-restore')}${workflowButton('Discard draft', 'draft-discard')}</div><h3>Newer saved edition found</h3><p>Your local draft is preserved. Inspect the newer version before resolving the conflict.</p><div class="actions">${workflowButton('Inspect saved edition', 'revision-preview')}${workflowButton('Use saved version', 'conflict-saved')}${workflowButton('Keep local version', 'conflict-local')}${workflowButton('Retry failed save', 'save-ranking')}</div></div>`,
    );
  } else if (a === 'espn-return' || a === 'espn-skip') {
    page = 8;
    tab = 'ESPN';
    workflowContextReturn = false;
    $('#dialog').close();
    render();
    toast(
      a === 'espn-return'
        ? 'Sample settings saved; league details preserved.'
        : 'Returned to league setup; details preserved.',
    );
  } else if (a === 'archive-view') {
    workflowArchive = !workflowArchive;
    render();
  } else if (a === 'archive') {
    toast(
      workflowArchive
        ? 'Sample league restored. Rankings retained.'
        : 'Sample league archived. Rankings retained.',
    );
    workflowArchive = !workflowArchive;
    render();
  } else if (a === 'managed-clear') {
    contextValues['Managed team'] = 'No team / commissioner';
    render();
    toast('Managed team cleared in this preview.');
  } else if (a === 'share-enable') {
    workflowPublished = true;
    workflowShare();
  } else if (a === 'snapshot') {
    workflowPublished = true;
    workflowSnapshot = true;
    workflowShare();
  } else if (a === 'share-revoke') {
    workflowPublished = false;
    workflowSnapshot = false;
    workflowShare();
  } else if (a === 'share-copy') {
    toast('Sample link preview only. No public access created.');
  } else if (a === 'espn-help') {
    workflowModal(
      'Find ESPN cookies',
      '<p>In your authenticated ESPN browser session, locate espn_s2 and SWID using the existing setup instructions. Save them in the private ESPN settings form. Saved values are never shown again.</p>',
    );
  } else {
    toast('Sample ' + a.replaceAll('-', ' ') + ' completed. No external action taken.');
    if (['draft-restore', 'draft-discard', 'conflict-saved', 'conflict-local'].includes(a))
      $('#dialog').close();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'wf-provider') {
    workflowProvider = e.target.value;
    workflowModel = '';
    workflowSuggestion = '';
    showWritingAssistant();
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'wf-model') workflowModel = e.target.value;
});
let workflowDragIndex = -1;
document.addEventListener('dragstart', (e) => {
  const row = e.target.closest('.rankrow[draggable]');
  if (!row || page !== 0) return;
  workflowDragIndex = [...row.parentElement.querySelectorAll('.rankrow')].indexOf(row);
  row.classList.add('dragging');
  e.dataTransfer.setData('text/plain', String(workflowDragIndex));
});
document.addEventListener('dragover', (e) => {
  if (page === 0 && e.target.closest('.rankrow[draggable]')) e.preventDefault();
});
document.addEventListener('drop', (e) => {
  const row = e.target.closest('.rankrow[draggable]');
  if (!row || page !== 0) return;
  e.preventDefault();
  const target = [...row.parentElement.querySelectorAll('.rankrow')].indexOf(row);
  if (workflowDragIndex >= 0 && target >= 0) {
    workflowUndo = [...order];
    const [moved] = order.splice(workflowDragIndex, 1);
    order.splice(target, 0, moved);
    selected = target;
    render();
    toast('Moved ' + moved + ' to rank ' + (target + 1) + '.');
  }
  workflowDragIndex = -1;
});
let workflowKeyboardDrag = -1,
  workflowKeyboardOriginal = null;
document.addEventListener('keydown', (e) => {
  if (page !== 0 || tab !== 'Edit rankings' || !e.target.matches('.rankrow[draggable]')) return;
  const rows = [...document.querySelectorAll('.rankrow[draggable]')];
  const index = rows.indexOf(e.target);
  if ([' ', 'Enter'].includes(e.key)) {
    e.preventDefault();
    if (workflowKeyboardDrag < 0) {
      workflowKeyboardOriginal = [...order];
      workflowUndo = [...order];
      workflowKeyboardDrag = index;
      toast('Team lifted. Use arrow keys, then Enter to drop or Escape to cancel.');
    } else {
      workflowKeyboardDrag = -1;
      toast('Team dropped.');
    }
  } else if (workflowKeyboardDrag >= 0 && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    const next = workflowKeyboardDrag + (e.key === 'ArrowUp' ? -1 : 1);
    if (next >= 0 && next < order.length) {
      const [moved] = order.splice(workflowKeyboardDrag, 1);
      order.splice(next, 0, moved);
      workflowKeyboardDrag = next;
      selected = next;
      render();
      document.querySelectorAll('.rankrow[draggable]')[next].focus();
    }
  } else if (workflowKeyboardDrag >= 0 && e.key === 'Escape') {
    e.preventDefault();
    order = [...workflowKeyboardOriginal];
    workflowKeyboardDrag = -1;
    render();
    toast('Keyboard drag cancelled.');
  }
});
document.addEventListener('dragend', () =>
  document.querySelectorAll('.dragging').forEach((x) => x.classList.remove('dragging')),
);
$('#dialog').addEventListener('close', () => {
  if (workflowRunning) {
    workflowRunning = false;
    workflowGeneration++;
  }
});
