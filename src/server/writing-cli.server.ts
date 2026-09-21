import { EventType } from '@tanstack/ai';
import '@tanstack/react-start/server-only';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, isAbsolute, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { BaseTextAdapter } from '@tanstack/ai/adapters';
import type {
  AdapterYieldChunk,
  DefaultMessageMetadataByModality,
  TextOptions,
} from '@tanstack/ai';
import type { WritingProvider, WritingProviderOption } from '../writing';
import { getAiCredentials } from './ai-credentials.server';
import HttpException from './exceptions/HttpException';
const list = (name: string) =>
  (process.env[name] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const writingEnvironment = () =>
  Object.fromEntries(
    [
      'PATH',
      'HOME',
      'USER',
      'LOGNAME',
      'LANG',
      'TMPDIR',
      'CODEX_HOME',
      'CLAUDE_CONFIG_DIR',
    ].flatMap((key) => (process.env[key] ? [[key, process.env[key]!]] : [])),
  );
export async function findWritingCli(provider: WritingProvider) {
  for (const directory of (process.env.PATH || '').split(delimiter).filter(isAbsolute)) {
    const file = join(directory, provider);
    try {
      await access(file, constants.X_OK);
      return file;
    } catch {
      /* A PATH miss is an availability probe, not an application failure. */
    }
  }
  return undefined;
}
export async function checkWritingCliLogin(
  executable: string,
  provider: WritingProvider,
): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(
      executable,
      provider === 'codex' ? ['login', 'status'] : ['auth', 'status'],
      {
        cwd: tmpdir(),
        env: writingEnvironment(),
        stdio: 'ignore',
      },
    );
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ready);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(false);
    }, 5000);
    child.once('error', () => finish(false));
    child.once('close', (code) => finish(code === 0));
  });
}
export async function writingProviderConfig(owner: string): Promise<{
  providers: WritingProviderOption[];
  apiKeys: Partial<Record<WritingProvider, string>>;
}> {
  const apiKeys = await getAiCredentials(owner);
  const providers = await Promise.all(
    (['codex', 'claude'] as const).map(async (id) => {
      const executable = await findWritingCli(id);
      const installed = !!executable;
      const enabled =
        !!apiKeys[id] ||
        (list('WRITING_AI_PROVIDERS').includes(id) && list('WRITING_AI_USERS').includes(owner));
      const status: WritingProviderOption['status'] = !installed
        ? 'not-installed'
        : !enabled
          ? 'not-enabled'
          : apiKeys[id] || (await checkWritingCliLogin(executable, id))
            ? 'ready'
            : 'login-check-failed';
      return { id, installed, enabled, status };
    }),
  );
  return { providers, apiKeys };
}
export async function writingProviders(owner: string): Promise<WritingProviderOption[]> {
  return (await writingProviderConfig(owner)).providers;
}
/*
 * A saved API key is passed only to the matching transient CLI process. It is not inherited from
 * the host process and never reaches the browser or an unrelated provider.
 */
function writingEnvironmentForProvider(provider: WritingProvider, apiKey?: string) {
  return {
    ...writingEnvironment(),
    ...(apiKey ? { [provider === 'codex' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY']: apiKey } : {}),
  };
}
export function cliArguments(provider: WritingProvider, model: string) {
  return provider === 'codex'
    ? [
        'exec',
        '--ignore-user-config',
        '--ignore-rules',
        '--ephemeral',
        '--skip-git-repo-check',
        '--sandbox',
        'read-only',
        '-c',
        'approval_policy="never"',
        '-c',
        'model_reasoning_effort="low"',
        '-c',
        'features.shell_tool=false',
        '-c',
        'features.apps=false',
        '-c',
        'features.plugins=false',
        '-c',
        'web_search="disabled"',
        ...(model ? ['--model', model] : []),
        '-',
      ]
    : [
        '--print',
        '--tools',
        '',
        '--strict-mcp-config',
        '--mcp-config',
        '{"mcpServers":{}}',
        '--setting-sources',
        '',
        '--no-session-persistence',
        '--max-turns',
        '1',
        '--effort',
        'low',
        ...(model ? ['--model', model] : []),
      ];
}
export async function runWritingCli(
  executable: string,
  provider: WritingProvider,
  model: string,
  prompt: string,
  signal?: AbortSignal,
  apiKey?: string,
): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'fantasy-writing-'));
  // Host-login files are accessible, but application DB/cookie/API secrets are not inherited.
  const env = writingEnvironmentForProvider(provider, apiKey);
  try {
    return await new Promise<string>((resolve, reject) => {
      const child = spawn(executable, cliArguments(provider, model), {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        signal,
      });
      let output = '',
        size = 0,
        failed = false;
      const fail = (message: string) => {
        if (!failed) {
          failed = true;
          child.kill('SIGKILL');
          reject(new HttpException(502, message));
        }
      };
      const timer = setTimeout(
        () => fail('The writing assistant timed out. Try again with a faster model.'),
        60000,
      );
      child.stdout.on('data', (chunk) => {
        size += chunk.length;
        if (size > 32000) fail('The writing assistant returned too much output.');
        else output += chunk;
      });
      child.stderr.on('data', (chunk) => {
        size += chunk.length;
        if (size > 100000) fail('The writing assistant produced excessive output.');
      });
      child.on('error', () => {
        clearTimeout(timer);
        fail('The writing assistant could not start. Check its server login and configuration.');
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (failed) return;
        if (code !== 0 || !output.trim())
          reject(
            new HttpException(
              502,
              'The writing assistant failed. Check its server login/model or try again.',
            ),
          );
        else resolve(output.trim());
      });
      child.stdin.on('error', () =>
        fail('The writing assistant stopped before receiving the context.'),
      );
      child.stdin.end(prompt);
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}
export class WritingCliAdapter extends BaseTextAdapter<
  string,
  Record<string, never>,
  readonly ['text'],
  DefaultMessageMetadataByModality
> {
  readonly name = 'writing-cli';
  constructor(
    private executable: string,
    private provider: WritingProvider,
    model: string,
    private apiKey?: string,
  ) {
    super({}, model);
  }
  async *chatStream(options: TextOptions<Record<string, never>>): AsyncIterable<AdapterYieldChunk> {
    const prompt = options.messages
      .map(
        (m) =>
          `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`,
      )
      .join('\n\n');
    const text = await runWritingCli(
      this.executable,
      this.provider,
      this.model,
      prompt,
      options.abortController?.signal,
      this.apiKey,
    );
    const messageId = this.generateId();
    yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
    yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: text };
    yield { type: EventType.TEXT_MESSAGE_END, messageId };
    yield {
      type: EventType.RUN_FINISHED,
      threadId: options.threadId || 'writing',
      runId: options.runId || messageId,
      finishReason: 'stop',
    };
  }
  async structuredOutput(): Promise<never> {
    throw new Error('Writing suggestions use plain text.');
  }
}
