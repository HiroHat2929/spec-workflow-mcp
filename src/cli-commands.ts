// Non-MCP CLI subcommands for spec-workflow.
//
// These subcommands replace the MCP tools so the workflow can run without an
// MCP server (organization policy now restricts MCP). They reuse the existing,
// tested handlers (approvalsHandler / logImplementationHandler) so the on-disk
// formats stay fully compatible with the standalone dashboard.
//
// Subcommands:
//   init [path] [--force]                Scaffold .claude/ skills+commands (and seed .spec-workflow/)
//   approval request|status|delete ...   Manage dashboard approval records
//   log --input <json> | --spec ...      Append an implementation log entry

import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { approvalsHandler } from './tools/approvals.js';
import { logImplementationHandler } from './tools/log-implementation.js';
import { WorkspaceInitializer } from './core/workspace-initializer.js';
import { ToolContext, ToolResponse } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Bundled assets live at the package root (../assets relative to dist/).
const ASSETS_ROOT = resolve(__dirname, '..', 'assets');

type Flags = Record<string, string | boolean>;

function parseFlags(argv: string[]): { flags: Flags; positional: string[] } {
  const flags: Flags = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq > -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function str(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function splitList(value: string | boolean | undefined): string[] {
  const s = str(value);
  if (!s) return [];
  return s.split(',').map((v) => v.trim()).filter(Boolean);
}

function printResult(result: ToolResponse): void {
  // Emit machine-readable JSON on stdout so the calling agent can parse it.
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

async function getVersion(): Promise<string> {
  try {
    const pkg = JSON.parse(await fs.readFile(resolve(__dirname, '..', 'package.json'), 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(
  src: string,
  dest: string,
  force: boolean,
  result: { copied: string[]; skipped: string[] }
): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d, force, result);
    } else {
      if ((await pathExists(d)) && !force) {
        result.skipped.push(d);
        continue;
      }
      await fs.mkdir(dirname(d), { recursive: true });
      await fs.copyFile(s, d);
      result.copied.push(d);
    }
  }
}

const DEFAULT_CONFIG_TOML = `# spec-workflow config
# 承認モード: "inline"（チャット内承認・Node 不要）または "dashboard"（音声ダッシュボード経由）
approvalMode = "inline"
lang = "ja"
port = 5000
`;

export async function runInit(argv: string[]): Promise<number> {
  const { flags, positional } = parseFlags(argv);
  const targetPath = resolve(positional[0] || str(flags.project) || process.cwd());
  const force = flags.force === true || flags.force === 'true';

  const claudeSrc = join(ASSETS_ROOT, 'claude');
  if (!(await pathExists(claudeSrc))) {
    process.stderr.write(`Error: bundled assets not found at ${claudeSrc}\n`);
    return 1;
  }

  // 1) Scaffold .claude/ (skills + commands)
  const result = { copied: [] as string[], skipped: [] as string[] };
  await copyDir(claudeSrc, join(targetPath, '.claude'), force, result);

  // 2) Seed .spec-workflow/ (dirs + templates + user-templates README) only for a fresh project.
  const specWorkflowDir = join(targetPath, '.spec-workflow');
  const seededWorkspace = !(await pathExists(specWorkflowDir));
  if (seededWorkspace) {
    const version = await getVersion();
    const initializer = new WorkspaceInitializer(targetPath, version);
    await initializer.initializeWorkspace();
  }

  // 3) Seed config.toml only if absent (never clobber an existing one).
  const configPath = join(specWorkflowDir, 'config.toml');
  if (!(await pathExists(configPath))) {
    await fs.mkdir(specWorkflowDir, { recursive: true });
    await fs.writeFile(configPath, DEFAULT_CONFIG_TOML, 'utf-8');
  }

  process.stdout.write(
    `spec-workflow init 完了: ${targetPath}\n` +
      `  .claude へコピー: ${result.copied.length} 件` +
      (result.skipped.length ? ` (既存スキップ: ${result.skipped.length} 件, 上書きは --force)` : '') +
      `\n` +
      (seededWorkspace ? `  .spec-workflow を新規作成（テンプレート展開）\n` : `  .spec-workflow は既存のため温存\n`) +
      `\n次の手順:\n` +
      `  - Claude Code を再起動 / リロードして /spec-create などのコマンドを認識させる\n` +
      `  - 音声ダッシュボードを使う場合は config.toml の approvalMode を "dashboard" に\n`
  );
  return 0;
}

export async function runApproval(argv: string[]): Promise<number> {
  const action = argv[0];
  if (!action || !['request', 'status', 'delete'].includes(action)) {
    process.stderr.write('Usage: spec-workflow approval <request|status|delete> [--project <path>] ...\n');
    return 1;
  }
  const { flags } = parseFlags(argv.slice(1));
  const projectPath = resolve(str(flags.project) || process.cwd());
  const context: ToolContext = { projectPath, dashboardUrl: str(flags['dashboard-url']) };

  let toolArgs: any;
  if (action === 'request') {
    toolArgs = {
      action: 'request',
      projectPath,
      title: str(flags.title),
      filePath: str(flags.file),
      type: str(flags.type) || 'document',
      category: str(flags.category) || 'spec',
      categoryName: str(flags['category-name']),
    };
  } else {
    toolArgs = { action, projectPath, approvalId: str(flags.id) };
  }

  const result = await approvalsHandler(toolArgs, context);
  printResult(result);
  return result.success ? 0 : 1;
}

export async function runLog(argv: string[]): Promise<number> {
  const { flags } = parseFlags(argv);
  const projectPath = resolve(str(flags.project) || process.cwd());

  let payload: any;
  const inputPath = str(flags.input);
  if (inputPath) {
    payload = JSON.parse(await fs.readFile(resolve(inputPath), 'utf-8'));
  } else {
    payload = {
      specName: str(flags.spec),
      taskId: str(flags.task),
      summary: str(flags.summary),
      filesModified: splitList(flags['files-modified']),
      filesCreated: splitList(flags['files-created']),
      statistics: {
        linesAdded: Number(str(flags['lines-added']) || 0),
        linesRemoved: Number(str(flags['lines-removed']) || 0),
      },
      artifacts: flags.artifacts ? JSON.parse(str(flags.artifacts) || '{}') : {},
    };
  }

  const result = await logImplementationHandler({ projectPath, ...payload }, { projectPath });
  printResult(result);
  return result.success ? 0 : 1;
}

/**
 * Dispatch a CLI subcommand. Returns the process exit code, or null when the
 * first argument is not a recognized subcommand (caller should continue with
 * the normal MCP-server / --dashboard flow).
 */
export async function dispatchSubcommand(argv: string[]): Promise<number | null> {
  const sub = argv[0];
  switch (sub) {
    case 'init':
      return runInit(argv.slice(1));
    case 'approval':
      return runApproval(argv.slice(1));
    case 'log':
      return runLog(argv.slice(1));
    default:
      return null;
  }
}
