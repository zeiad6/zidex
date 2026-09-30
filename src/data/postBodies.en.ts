/**
 * English article bodies, loaded with the Arabic ones and only when a reader
 * opens a post. Same split and same reason: shipping every translation in the
 * entry bundle charged the first paint for content nobody had scrolled to.
 */
import type { Block } from './posts'
import { getProgram, primaryDownload } from './programs'

const edms = getProgram('edms-archive-pro')!
const edmsFile = primaryDownload(edms)
const edmsDownload: Block = {
  type: 'download',
  href: edmsFile.href,
  label: `Archive Pro ${edms.version} — ${edms.platform}`,
  meta: `${edmsFile.file} · ${edmsFile.size} · ${edmsFile.host}`,
}

const aiFakeEn: Block[] = [
  {
    type: 'p',
    text: 'An Android app that checks images, videos, video links and text **entirely on the device**, with no file ever uploaded. Written in Kotlin and Jetpack Compose on top of `onnxruntime-android`, so the deepfake detectors run locally.',
  },
  {
    type: 'download',
    href: 'https://www.mediafire.com/file/medmpqfun7h00e3/AiFake-v0.1.0-release-new.apk/file',
    label: 'Download AiFake v0.1.0 — APK',
    meta: 'AiFake-v0.1.0-release-new.apk · Android 8.0+ · MediaFire',
    also: [
      {
        href: 'https://drive.google.com/uc?export=download&id=1zhU55QMifujaTSbzXLHtuwZpzDFzH9hD',
        label: 'Mirror on Google Drive',
        meta: 'same file · Google Drive',
      },
    ],
  },
  {
    type: 'callout',
    tone: 'warn',
    title: 'Before you install',
    items: [
      'You have to allow installation from **unknown sources**.',
      'The file is large — the base model ships inside the package.',
      'The signing fingerprint has changed since earlier builds. An existing install signed with the old key needs `uninstall` first, or the system refuses the upgrade.',
    ],
  },

  {
    type: 'h2',
    id: 'how-it-works',
    text: 'How it works',
  },
  {
    type: 'p',
    text: 'The base is a ViT model quantised to INT8 and bundled inside the app at 23 MB, running on a `1×3×384×384` input. On top of that sits **multi-model fusion**: every scan combines the selected model with the other verified models through an equally weighted log-odds average.',
  },
  {
    type: 'ul',
    items: [
      '**Cap by device tier:** LOW=1 model, MID=2, HIGH=3.',
      'Models run sequentially in a single in-memory session — the cost is **time, not memory**.',
      'The ensemble never downloads a model on its own.',
    ],
  },
  {
    type: 'p',
    text: 'What separates it from a percentage generator is that every result carries **evidence**: each model\'s individual reading and whether they agree, a per-frame AI probability that catches partial edits, how many faces were examined, and a source-metadata pass.',
  },

  {
    type: 'h2',
    id: 'models',
    text: 'Available models',
  },
  {
    type: 'table',
    caption: 'What ships inside the package, and what downloads on demand.',
    head: ['Model', 'Size', 'Status'],
    rows: [
      ['DeepfakeDet-ViT INT8', '23 MB', 'Bundled · default'],
      ['CommunityForensics 2026', '44 MB', 'Trained on 2025–2026 generators · first in the ensemble'],
      ['Deepfake ViT-base/16', '84 MB', 'Strongest'],
      ['Deep-Fake Detector v2', '87 MB', 'Experimental'],
      ['AI vs Deepfake vs Real', '87 MB', 'Separates deepfake from AI'],
    ],
  },

  {
    type: 'h2',
    id: 'metadata',
    text: 'Source-metadata forensics',
  },
  {
    type: 'p',
    text: 'The app reads the fingerprint a generator leaves in the file itself: C2PA, IPTC `trainedAlgorithmicMedia`, Stable Diffusion / ComfyUI / InvokeAI parameters in PNG, generator names, and camera EXIF.',
  },
  {
    type: 'callout',
    tone: 'info',
    title: 'How it affects the verdict',
    items: [
      'An explicit generator marker pushes the AI probability to **at least 95%**.',
      'Missing data, or a clean camera, changes **nothing** — both are trivial to strip or forge.',
    ],
  },

  {
    type: 'h2',
    id: 'screens',
    text: 'The interface',
  },
  {
    type: 'image',
    src: '/img/aifake-1.webp',
    fallback: '/img/aifake-1.jpg',
    alt: 'The app home screen with the circular authenticity dial',
    caption: 'Home screen — the circular authenticity dial.',
  },
  {
    type: 'image',
    src: '/img/aifake-2.webp',
    fallback: '/img/aifake-2.jpg',
    alt: 'Scan results with each model read separately',
    caption: 'Result detail — every model read, and whether they agree.',
  },
  {
    type: 'image',
    src: '/img/aifake-3.webp',
    fallback: '/img/aifake-3.jpg',
    alt: 'Scan history and settings inside the app',
    caption: 'Scan history and settings.',
  },

  {
    type: 'h2',
    id: 'limits',
    text: 'Limits you should know',
  },
  {
    type: 'ul',
    items: [
      'Public detector accuracy **drops sharply** on recent deepfakes. The result is always probabilistic.',
      'Text checking is stylistic, not a language model — deliberately the weakest mode.',
      'The cloud provider APIs were written from public documentation and never tested with real keys.',
      'The gap between FP32 and INT8 output can be real on generators outside the training distribution.',
      'The mixed `int8/uint8` `ConvInteger` path depends on ORT 1.27.0 device kernels and needs an on-device smoke test.',
    ],
  },
  {
    type: 'callout',
    tone: 'tip',
    title: 'Bottom line',
    items: [
      'Treat the app as a **second opinion**, not proof.',
      'Corroborate it with the metadata pass and human review before acting on any verdict.',
    ],
  },
]

export const postBodiesEn: Record<string, Block[]> = {
  "ai-fake-detector-android": aiFakeEn,

  'cloudcli-setup-guide': [
      {
        type: 'p',
        text: 'A long, hands-on article that documents the environment exactly as it is installed on a **Linux/arm64 machine inside PRoot**, step by step, explaining what each component does and how to add it.',
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Security notice',
        items: [
          'Every key in the examples is a placeholder (`<your-key-here>`).',
          'Never paste real keys into articles or repositories.',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '3', label: 'coding agents wired in' },
          { value: '~90', label: 'skills per tool' },
          { value: '~238', label: 'agents in OpenCode' },
          { value: '~25', label: 'MCP servers' },
        ],
      },

      { type: 'h2', id: 'roadmap', text: 'The roadmap: what we built' },
      {
        type: 'p',
        text: 'In short: **CloudCLI is the hub** — a web UI that drives Claude Code from the browser and exposes a browser-control service (browser-use) that both Codex and OpenCode consume over MCP. Around that hub sit three coding agents, a large library of skills and specialist agents, and dozens of MCP servers.',
      },
      {
        type: 'hub',
        center: { title: 'CloudCLI :3001', sub: 'The hub — web UI + browser-use' },
        nodes: [
          { title: 'Claude Code', sub: 'Pro subscription · OAuth direct to Anthropic', role: 'Driven by CloudCLI' },
          { title: 'Codex', sub: 'ccpro gateway · `gpt-5.5`', role: 'browser-use over MCP' },
          { title: 'OpenCode', sub: 'OpenRouter + local · `sonnet-5`', role: 'browser-use over MCP' },
        ],
        caption: 'CloudCLI drives Claude Code, and serves its browser-control tool to Codex and OpenCode over MCP.',
      },
      {
        type: 'table',
        caption: 'The environment',
        head: ['Component', 'Actual value'],
        rows: [
          ['System', 'Linux aarch64 (arm64) inside PRoot-Distro'],
          ['Node', 'From the system npm (`/usr/bin/node`)'],
          ['Claude Code', 'v2.1.280 — Pro (OAuth) auth on Anthropic models'],
          ['Codex', '`@openai/codex@0.155.1` — through an external `model_provider`'],
          ['CloudCLI', '`@cloudcli-ai/cloudcli@1.37.3` — port `3001`'],
          ['OpenCode', 'Default model `openrouter/anthropic/claude-sonnet-5`'],
          ['Config paths', '`~/.claude/` · `~/.codex/` · `~/.config/opencode/` · `~/.cloudcli/`'],
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Why PRoot matters',
        items: [
          'The missing uid mapping breaks some features, such as cross-session messaging in Claude Code.',
          'The fix is documented in [part seven](#ops).',
        ],
      },

      { type: 'h2', id: 'install', text: 'Part one: installing CloudCLI' },
      { type: 'h3', id: 'what-is-cloudcli', text: 'What is CloudCLI?' },
      {
        type: 'p',
        text: 'An npm package called `@cloudcli-ai/cloudcli`. Its official description: **"A web-based UI for Claude Code CLI"** — a web interface that controls Claude Code from the browser. It includes:',
      },
      {
        type: 'ul',
        items: [
          'A web server (port `3001` by default).',
          '`sandbox` commands for running isolated Docker environments.',
          'A `browser-use-mcp` server — this is **the connection point** with the other tools ([part two](#connect)).',
          'A `status` command that shows where the config and database live.',
        ],
      },
      { type: 'h3', id: 'install-steps', text: 'Installation steps' },
      {
        type: 'code',
        lang: 'bash',
        code: `# 1) Global install through npm (needs write access to /usr/lib/node_modules)
npm install -g @cloudcli-ai/cloudcli

# 2) Check the version
cloudcli version          # 1.37.3 at the time of writing
# or
cloudcli --help

# 3) Check status and file locations
cloudcli status`,
      },
      {
        type: 'table',
        caption: 'Real cloudcli status output on this machine',
        head: ['Item', 'Path'],
        rows: [
          ['Install folder', '`/usr/lib/node_modules/@cloudcli-ai/cloudcli`'],
          ['Database', '`/root/.cloudcli/auth.db`'],
          ['Port', '`3001` (default; change with `--port` or `SERVER_PORT`)'],
          ['Claude CLI it drives', '`claude` (default; change with `CLAUDE_CLI_PATH`)'],
          ['Claude projects folder', '`/root/.claude/projects`'],
          ['Config file', '`/usr/lib/node_modules/@cloudcli-ai/cloudcli/.env`'],
        ],
      },
      { type: 'h3', id: 'run', text: 'Running it' },
      {
        type: 'code',
        lang: 'bash',
        code: `cloudcli                  # start with defaults (port 3001)
cloudcli --port 8080      # custom port
cloudcli status           # check config and data locations
cloudcli update           # update to the latest release`,
      },
      {
        type: 'table',
        caption: 'Supported environment variables',
        head: ['Variable', 'Purpose', 'Default'],
        rows: [
          ['`SERVER_PORT` / `PORT`', 'Server port', '`3001`'],
          ['`DATABASE_PATH`', 'Database location', '`~/.cloudcli/auth.db`'],
          ['`CLAUDE_CLI_PATH`', 'The Claude command it drives', '`claude`'],
          ['`CONTEXT_WINDOW`', 'Context window size', '`160000`'],
        ],
      },
      { type: 'p', text: 'Official docs: [cloudcli.ai](https://cloudcli.ai)' },

      { type: 'h2', id: 'connect', text: 'Part two: connecting the three agents' },
      { type: 'p', text: 'This is the heart of it: three different tools, each connected its own way.' },
      { type: 'h3', id: 'connect-claude', text: 'Connection one: Claude Code — driven directly by CloudCLI' },
      {
        type: 'p',
        text: 'The relationship here is **direct control**: CloudCLI runs the `claude` command itself (per `CLAUDE_CLI_PATH`), shows its sessions in the web UI, and reads its projects from `~/.claude/projects`.',
      },
      { type: 'p', text: 'Claude Code’s own authentication is a **Pro subscription over OAuth** (not an API key):' },
      {
        type: 'ul',
        items: [
          'Evidence: `~/.claude/.credentials.json` holds `claudeAiOauth` with `subscriptionType: pro`.',
          'Requests go straight to Anthropic, using the native `opus` / `sonnet` models.',
          'Main config: `~/.claude/settings.json` — the key part:',
        ],
      },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "model": "opus",
  "language": "arabic"
}`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'A golden rule, learned the hard way',
        items: [
          'Never export `ANTHROPIC_BASE_URL` pointing at an external gateway in your shell files (`~/.bashrc` / `~/.zshrc`) — it switches Claude Code from the Pro subscription to a pay-per-token gateway.',
          '`~/.config/openrouter/env.sh` is deliberately designed to export only `OPENROUTER_API_KEY` and never touch `ANTHROPIC_*` — that is intentional, not an omission.',
        ],
      },
      { type: 'h3', id: 'connect-codex', text: 'Connection two: Codex — consumes browser-use from CloudCLI over MCP' },
      { type: 'p', text: 'Codex is connected on two sides. **A) The model provider (the ccpro gateway)** in `~/.codex/config.toml`:' },
      {
        type: 'code',
        lang: 'toml',
        code: `model_provider = "JY"

[model_providers.JY]
name = "JY"
base_url = "https://api.ccpro.cn/v1"
wire_api = "responses"
env_key = "OPENAI_API_KEY"
requires_openai_auth = true

model = "gpt-5.5"`,
      },
      {
        type: 'p',
        text: 'So Codex speaks the OpenAI-compatible protocol to the `api.ccpro.cn` gateway, and the key is read from the `OPENAI_API_KEY` environment variable — not stored as text in the file, which is the right practice.',
      },
      { type: 'p', text: '**B) The CloudCLI browser-use server**, in the same `config.toml`:' },
      {
        type: 'code',
        lang: 'toml',
        code: `[mcp_servers.cloudcli-browser]
command = "/usr/bin/node"
args = [
  "/usr/lib/node_modules/@cloudcli-ai/cloudcli/dist-server/server/modules/browser-use/browser-use-mcp.js"
]

  [mcp_servers.cloudcli-browser.env]
  CLOUDCLI_BROWSER_USE_MCP_TOKEN = "<your-token-here>"
  CLOUDCLI_BROWSER_USE_API_URL = "http://127.0.0.1:3001/api/browser-use-mcp"`,
      },
      {
        type: 'p',
        text: 'Note the chain: Codex → (stdio through node) → the `browser-use-mcp.js` script → (local HTTP) → the CloudCLI server on `127.0.0.1:3001`. The script really runs as a process (`ps` shows it), so the connection is live, not theoretical.',
      },
      {
        type: 'ol',
        items: [
          'Install CloudCLI ([part one](#install)) and start the server on `3001`.',
          'Copy the `[mcp_servers.cloudcli-browser]` block above into `~/.codex/config.toml`.',
          'Replace the placeholder with the real token (taken from the CloudCLI UI).',
          'Restart Codex — the `cloudcli-browser` server appears in the MCP list.',
        ],
      },
      { type: 'h3', id: 'connect-opencode', text: 'Connection three: OpenCode — OpenRouter for models + browser-use from CloudCLI' },
      { type: 'p', text: 'OpenCode is connected on two sides too. **A) The default model provider (OpenRouter)** in `~/.config/opencode/opencode.jsonc`:' },
      {
        type: 'code',
        lang: 'jsonc',
        code: `{
  "$schema": "https://opencode.ai/config.json",
  "model": "openrouter/anthropic/claude-sonnet-5",
  "provider": {
    "openrouter": {
      "options": {
        "baseURL": "https://openrouter.ai/api/v1",
        "apiKey": "<your-OpenRouter-key-here>"
      },
      "models": {
        "anthropic/claude-sonnet-5": { "name": "Claude Sonnet 5", "...": "..." },
        "anthropic/claude-opus-5":   { "name": "Claude Opus 5",   "...": "..." },
        "anthropic/claude-haiku-4.5": { "name": "Claude Haiku 4.5", "...": "..." }
      }
    }
  }
}`,
      },
      {
        type: 'p',
        text: '**B) The CloudCLI browser-use server:** inside the `"mcp"` block of the same file there is a `cloudcli-browser` entry (same idea as Codex: a node script + the `127.0.0.1:3001` address), alongside ~25 other MCP servers ([part five](#mcp)).',
      },
      {
        type: 'ol',
        items: [
          'Install OpenCode and create `~/.config/opencode/opencode.jsonc`.',
          'Add a `provider.openrouter` block with your key.',
          'Add a `cloudcli-browser` entry under the `"mcp"` block, in the same pattern as the other servers.',
          '`opencode.jsonc` accepts comments (`//`) — use them to document each server.',
        ],
      },
      { type: 'h3', id: 'compare', text: 'Quick comparison' },
      {
        type: 'table',
        head: ['Tool', 'Model auth', 'CloudCLI’s role'],
        rows: [
          ['Claude Code', 'Pro OAuth, direct to Anthropic', '**Drives it**: runs `claude` and shows it on the web'],
          ['Codex', 'ccpro gateway via `OPENAI_API_KEY`', '**Serves it**: consumes `browser-use` over MCP'],
          ['OpenCode', 'OpenRouter via `opencode.jsonc`', '**Serves it**: consumes `browser-use` over MCP'],
        ],
      },

      { type: 'h2', id: 'skills', text: 'Part three: skills' },
      { type: 'h3', id: 'what-is-skill', text: 'What is a skill?' },
      {
        type: 'p',
        text: 'A skill is a folder with a `SKILL.md` file that starts with a `name` and `description` header, followed by detailed instructions. The agent **loads it only when the task matches its description** — capabilities on demand. The rule: one skill for the matching task, and never load what you do not need.',
      },
      {
        type: 'table',
        caption: 'Where skills live — the same library copied so every tool can reach it',
        head: ['Path', 'Serves'],
        rows: [
          ['`~/.config/opencode/skill/`', 'OpenCode (~90 skills)'],
          ['`~/.claude/skills/`', 'Claude Code (~90 skills)'],
          ['`~/.codex/skills/`', 'Codex (~90 skills)'],
          ['`~/.agents/skills/`', 'A shared library (such as `agent-reach` and `android-kotlin`)'],
        ],
      },
      { type: 'h3', id: 'key-skills', text: 'The key skills used here' },
      {
        type: 'table',
        caption: 'Infrastructure and memory skills',
        head: ['Skill', 'Purpose'],
        rows: [
          ['`error-memory`', 'A persistent error memory in SQLite — stores every error with its fix so it never repeats. Called at session start and on any new error'],
          ['`codebase-memory`', 'A knowledge graph of the code: who calls whom, call tracing, impact analysis before an edit'],
          ['`agent-reach`', '**The internet gateway**: web search, page fetching, GitHub, YouTube, RSS — for any outside research'],
          ['`agent-handoff-protocol`', 'A protocol for passing context between agents when delegating'],
          ['`advisor-orchestrator-worker`', 'Splits large tasks across a team of agents (an advisor + workers) in parallel'],
          ['`cli-hub-meta-skill`', 'Discovers and installs agent-ready CLI tools on its own (`cli-hub search/install`)'],
          ['`model-router`', 'Routes tasks to the best-fit model: cheap for easy work, strong for hard work'],
        ],
      },
      {
        type: 'table',
        caption: 'Cybersecurity skills — the standout specialty of this setup',
        head: ['Skill', 'Purpose'],
        rows: [
          ['`violin-pentest`', 'Supervised, authorised penetration testing: a full cycle (scope → recon → vulns → exploitation → report), with 35 playbooks covering every vulnerability class'],
          ['`cyberintel`', 'A local cyber-intelligence base (CVE/KEV/attack techniques) + a daily update script'],
          ['`kali-pentest`', 'Runs testing through Kali tools (SSH/Docker): recon, vulnerability analysis, web and API testing'],
          ['`lite-pentest-toolkit`', 'Recon kit on the device itself (nmap in a safe no-root mode, subfinder, nuclei, sqlmap…)'],
          ['`ondevice-llm-redteam`', 'Runs small models locally (llama.cpp) and tests their guardrails with no cloud'],
          ['`llm-restriction-bypass`', 'Methodologies for testing LLM restrictions within an authorised scope (for red teams)'],
          ['`skill-inspector`', '**Skill security scanner**: checks any skill before installing it (static analysis + semantic review) and returns `APPROVE/CAUTION/REJECT`'],
          ['`finding-triage`', 'Triages Hacktron scan findings (true/false positive), then fixes or accepts the risk'],
          ['`patch-diff-analyzer`', 'Diffs compiled program versions to find security fixes'],
          ['`hacktron-supply-chain`', 'Checks supply chains (npm/PyPI) against a malware database — free, no key'],
          ['`owasp-top-10` · `api-security` · `security-auditor` · `vulnerability-scanning` · `container-security` · `cryptography-patterns` · `secret-management` · `supply-chain-defense` · `zero-trust-architecture` · `guardrails-alignment` · `incident-response`', 'The defence stack: prevention patterns, container, secret, and crypto audits, and incident response'],
        ],
      },
      {
        type: 'table',
        caption: 'Development skills',
        head: ['Skill', 'Purpose'],
        rows: [
          ['`android-build`', 'Builds APKs and tests Android projects on arm64 (aapt2 fixes, build diagnostics, install over ADB)'],
          ['`mobile-automation`', 'Controls devices (tap/swipe/screenshots/accessibility tree) through Mobile Next MCP'],
          ['`api-designer` · `api-testing` · `business-logic` · `identity-auth` · `web-app` · `misconfig` · `llm-security` · `pentest`', 'Designing and testing APIs, identity, and business logic (companions to the violin playbooks)'],
          ['`planning-reasoning` · `tool-use-patterns` · `memory-management` · `observability-tracing` · `workflow-templates`', 'Engineering the agents themselves: planning, tool orchestration, memory, tracing'],
          ['`professional-code-gen` · `design-patterns` · `tech-stacks` · `architecture-designer` · `system-design`', 'Standards for professional code generation and technology choices'],
          ['`payment-integration` · `realtime-communication` · `caching-strategies` · `background-jobs` · `search-implementation` · `file-processing` · `data-visualization` · `web-scraping-patterns` · `extensions-development` · `desktop-app-patterns` · `cross-platform` · `build-systems` · `build-configuration` · `cli-development` · `database-designer` · `state-management` · `form-validation`', 'Hands-on skills for every layer of an application'],
        ],
      },
      {
        type: 'table',
        caption: 'Content and SEO skills',
        head: ['Skill', 'Purpose'],
        rows: [
          ['`seo-audit` · `seo-coach` · `seo-project-setup` · `seo-report` · `keyword-research` · `keyword-clustering` · `competitor-analysis` · `competitive-landscape` · `link-prospecting` · `local-seo`', 'A complete SEO stack: audits, keywords, competitors, HTML reports'],
          ['`arabic-expert`', 'Improves and polishes Arabic content'],
          ['`deslop`', 'Strips machine-writing fingerprints so text reads as human'],
          ['`first-reader` · `thinking-out-loud` · `directing-stickman-videos` · `brag` · `pdfcn` · `leetcode-helper` · `project-graveyard` · `commit-archaeologist` · `scope-creep-detector` · `dependency-doctor`', 'Supporting skills: draft review, videos, PDF, algorithms, post-mortems of dead projects'],
        ],
      },
      { type: 'h3', id: 'add-skill', text: 'How to add a new skill' },
      { type: 'p', text: '**Method 1 — from a repository (easiest):**' },
      {
        type: 'code',
        lang: 'bash',
        code: `npx skills add <owner>/<repo>               # e.g. npx skills add vercel-labs/agent-skills
npx skills add <owner>/<repo> -a opencode   # for OpenCode specifically
npx skills find <keyword>                   # search for a skill`,
      },
      { type: 'p', text: '**Method 2 — by hand:** copy the folder to all three paths so every tool can reach it.' },
      {
        type: 'code',
        lang: 'bash',
        code: `SKILL=my-skill
cp -r ./$SKILL ~/.config/opencode/skill/$SKILL
cp -r ./$SKILL ~/.claude/skills/$SKILL
cp -r ./$SKILL ~/.codex/skills/$SKILL`,
      },
      { type: 'p', text: '**Method 3 — write your own:** create a folder with a `SKILL.md` that starts with:' },
      {
        type: 'code',
        lang: 'markdown',
        code: `---
name: my-skill
description: What it does and when to use it (one precise line — this decides loading)
---
# Detailed instructions...`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'A security rule',
        items: [
          'Before installing any external skill, scan it with `skill-inspector`.',
          'Skills are code that runs with your permissions.',
        ],
      },

      { type: 'h2', id: 'agents', text: 'Part four: agents' },
      { type: 'h3', id: 'skill-vs-agent', text: 'Skill versus agent' },
      {
        type: 'ul',
        items: [
          '**A skill** = knowledge that gets loaded: how to do something.',
          '**An agent** = an independent worker you delegate to: who carries out a whole task with its own tools.',
        ],
      },
      { type: 'h3', id: 'agents-inventory', text: 'What we actually have' },
      {
        type: 'table',
        head: ['Location', 'Count', 'Examples'],
        rows: [
          ['`~/.config/opencode/agent/`', '**~238 agents**', '`security` · `debugger` · `code-reviewer` · `penetration-tester` · `frontend` · `backend` · `architect` · `mobile` · `devops` · `llm-redteam` · `web-hunter` · `api-security` · `forensics-analyst` · `threat-modeler` … a library covering every specialty: security, development, cloud, data, mobile, CTF, OSINT'],
          ['`~/.claude/agents/`', '4 custom', '`codebase-memory` + `codebase-memory-scout` + `codebase-memory-auditor` (three layers for exploring code) and `opencrabs`'],
          ['`~/.codex/agents/`', '3 (toml format)', '`codebase-memory` · `codebase-memory-scout` · `codebase-memory-auditor`'],
          ['`~/.codex/AGENTS.md`', '—', 'General instructions for agents in Codex projects'],
        ],
      },
      { type: 'h3', id: 'add-agent', text: 'How to add an agent' },
      {
        type: 'ul',
        items: [
          '**In OpenCode:** create `~/.config/opencode/agent/my-agent.md` (discovered automatically), then call it from the chat.',
          '**In Codex:** create `~/.codex/agents/my-agent.toml`, following the existing pattern.',
          '**In Claude Code:** create `~/.claude/agents/my-agent.md`.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'A tip from experience',
        items: [
          'Do not create a new agent for something an existing skill already does.',
          'Agents are for independent multi-step tasks; skills are for specialist knowledge.',
        ],
      },

      { type: 'h2', id: 'mcp', text: 'Part five: MCP servers' },
      { type: 'h3', id: 'what-is-mcp', text: 'What is MCP?' },
      {
        type: 'p',
        text: 'A protocol that gives an agent **external tools** (a browser, files, databases, search…) through local servers or HTTP endpoints. Every server = a separate process = memory used — which leads to the `mcp-idle` idea in [part six](#plugins).',
      },
      { type: 'h3', id: 'mcp-inventory', text: 'The MCP servers used here' },
      {
        type: 'table',
        caption: 'Actual inventory — servers shared by Codex, OpenCode, and Claude Code',
        head: ['Server', 'Purpose'],
        rows: [
          ['`cloudcli-browser`', 'Browser control through CloudCLI (the connection point — [part two](#connect))'],
          ['`codebase-memory-mcp`', 'The code knowledge graph (`/root/.local/bin/codebase-memory-mcp`) — also wired as hooks in Claude and Codex'],
          ['`bytez`', 'Model catalogue and docs (HTTP: `https://docs.bytez.com/mcp`)'],
          ['`playwright`', 'Browser automation and E2E testing'],
          ['`filesystem`', 'Reading and writing local files'],
          ['`sqlite`', 'Querying local SQLite databases'],
          ['`memory`', 'Persistent key-value memory across sessions'],
          ['`fetch`', 'HTTP requests to APIs'],
          ['`sequential-thinking`', 'Step-by-step reasoning for complex problems'],
          ['`excel`', 'Working with Excel spreadsheets'],
          ['`context7`', 'Library and framework docs (used first for any API question)'],
          ['`hacktron`', 'Security reviews (an AI security engineer over HTTPS)'],
          ['`mobile-mcp` / `mobile-next`', 'Android and iOS device automation'],
          ['`mcpandroidbuild` + `android-builder`', 'Building and testing Android (Gradle) projects on arm64'],
          ['`scrapling` / `scrapegraph`', 'Web scraping and data extraction'],
          ['`puppeteer`', 'An alternative browser engine'],
          ['`brave-search`', 'Alternative web search (needs `BRAVE_API_KEY`)'],
          ['`stash`', 'A knowledge base shared across sessions'],
          ['`openknowledge`', 'An open knowledge base'],
        ],
      },
      {
        type: 'table',
        caption: 'Where they are defined',
        head: ['Tool', 'Definition file'],
        rows: [
          ['Codex', '`~/.codex/config.toml` under `[mcp_servers.*]`'],
          ['OpenCode', '`~/.config/opencode/opencode.jsonc` under the `"mcp"` block'],
          ['Claude Code', '`~/.claude.json` under `mcpServers`'],
        ],
      },
      { type: 'h3', id: 'add-mcp', text: 'How to add an MCP server' },
      { type: 'p', text: '**In Codex (`~/.codex/config.toml`) — a local server:**' },
      {
        type: 'code',
        lang: 'toml',
        code: `[mcp_servers.my-server]
command = "/usr/bin/node"
args = ["/path/to/server.js"]
env_vars = []`,
      },
      { type: 'p', text: '**In Codex — an HTTP server:**' },
      {
        type: 'code',
        lang: 'toml',
        code: `[mcp_servers.my-server]
type = "http"
url = "https://example.com/mcp"`,
      },
      { type: 'p', text: '**In OpenCode (`opencode.jsonc`) — a local server:**' },
      {
        type: 'code',
        lang: 'jsonc',
        code: `"mcp": {
  "my-server": {
    "type": "local",
    "command": ["/usr/bin/node", "/path/to/server.js"],
    "enabled": true
  }
}`,
      },
      { type: 'p', text: '**In Claude Code:** with `claude mcp add <name> -- <command...>`, or by editing `~/.claude.json`.' },
      {
        type: 'callout',
        tone: 'warn',
        title: 'A memory warning',
        items: [
          'Every local server is a node process costing 50–115 MB.',
          'On Android that kills the session (LMKD) — the fix: `mcp-idle` in [part six](#plugins).',
        ],
      },

      { type: 'h2', id: 'plugins', text: 'Part six: extensions, plugins, and commands' },
      { type: 'h3', id: 'claude-plugins', text: 'Claude Code plugins (marketplaces)' },
      { type: 'p', text: 'Installed in `~/.claude/plugins/marketplaces` and enabled in `settings.json`:' },
      {
        type: 'table',
        head: ['Plugin', 'Source', 'Purpose'],
        rows: [
          ['`ponytail`', '`DietrichGebert/ponytail`', 'Productivity add-ons for Claude sessions'],
          ['`caveman`', '`JuliusBrussee/caveman`', 'A terse, direct working style'],
          ['`ops-marketplace`', '`Lifecycle-Innovations-Limited/claude-ops`', 'Operations and running things'],
          ['`taste-skill`', '`Leonxlnx/taste-skill`', 'Taste and design skills'],
          ['`impeccable`', '`pbakaus/impeccable`', 'Output quality and precision'],
          ['`lmnr`', '`lmnr-ai/lmnr-claude-code-plugin`', 'Monitoring and tracing (Laminar)'],
          ['`claude-plugins-official`', 'The official marketplace', 'Anthropic’s official plugins'],
        ],
      },
      { type: 'p', text: 'Managed from `settings.json` through `enabledPlugins` and `extraKnownMarketplaces`.' },
      { type: 'h3', id: 'opencode-plugins', text: 'Global OpenCode plugins' },
      { type: 'p', text: 'In `~/.config/opencode/plugin/`, running automatically for every agent and model:' },
      {
        type: 'table',
        head: ['Plugin', 'Purpose'],
        rows: [
          ['`mcp-idle.ts`', '**The most important**: keeps local MCP servers off by default (saves ~300 MB and avoids Android killing the session). Wake one with `mcp-idle on <name>`, then restart opencode'],
          ['`memory-rotate.ts`', 'Weekly rotation of the `opencode.db` database (keeps only the last working day) so memory does not balloon'],
        ],
      },
      {
        type: 'p',
        text: 'Commands: `mcp-idle status/doctor/on/off` and `memory-rotate status/dry-run` — with slash commands `/mcp-status`, `/mcp-on`, `/mcp-off`, `/mcp-idle`, and `/memory-rotate`.',
      },
      { type: 'h3', id: 'opencode-commands', text: 'Ready-made OpenCode commands (21)' },
      { type: 'p', text: 'In `~/.config/opencode/command/` — the most useful:' },
      {
        type: 'table',
        head: ['Command', 'Purpose'],
        rows: [
          ['`/mcp-status` `/mcp-on` `/mcp-off`', 'Manage MCP servers'],
          ['`/skillspector`', 'Security-scan a skill before installing it'],
          ['`/cli-anything` (+ `list/refine/test/validate`)', 'Turn any GUI program into a CLI for agents'],
          ['`/stickman-video`', 'Turn text into a stickman video (with the methodical `HARNESS.md`)'],
          ['`/brag`', 'Turn the project into a shareable launch video'],
          ['`/cyber-search` `/cyber-update`', 'Search and update the cyber-intelligence base'],
          ['`/recommend`', 'Technical recommendations'],
        ],
      },

      { type: 'h2', id: 'ops', text: 'Part seven: operational tips from the field' },
      { type: 'h3', id: 'proot-socket', text: 'Cross-session messaging in PRoot' },
      { type: 'p', text: '**Symptom:** starting `claude` prints:' },
      {
        type: 'code',
        lang: 'text',
        code: `Cross-session messaging is off: its socket directory could not be set up:
this process runs in a user namespace without a uid mapping...`,
      },
      {
        type: 'p',
        text: '**Cause:** PRoot has no uid mapping — the process shows up as the overflow uid, so Claude refuses to bind `/tmp/cc-socks` because it cannot verify ownership.',
      },
      { type: 'p', text: '**The fix used here (works first time):**' },
      {
        type: 'code',
        lang: 'bash',
        code: `mkdir -m 700 -p ~/.claude-socks
# then always start claude with this hidden flag:
claude --messaging-socket-path ~/.claude-socks/claude.sock`,
      },
      {
        type: 'p',
        text: 'Two notes from experience: the flag takes **a file path** (not a folder), and the parent folder must be `700`. To make it permanent we added this to `~/.bashrc` and `~/.zshrc`:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `alias claude='claude --messaging-socket-path "$HOME/.claude-socks/claude.sock"'`,
      },
      { type: 'h3', id: 'openrouter-402', text: 'Claude Code getting routed to OpenRouter' },
      {
        type: 'ul',
        items: [
          '**Symptom:** `402 ... openrouter.ai ... adjust the key\'s total limit`, despite a Pro subscription.',
          '**Cause:** a model was picked in gateway form (`anthropic/z-ai/glm-5.3`) instead of the native Anthropic model — so the request went to OpenRouter with an empty key.',
          '**Fix:** remove the gateway entry from `modelSettings` in `~/.claude/settings.json`, keep `"model": "opus"`, then pick Opus or Sonnet with `/model` inside the session.',
        ],
      },
      { type: 'h3', id: 'keys', text: 'Handling keys safely' },
      {
        type: 'ul',
        items: [
          'Keys live in files with `600` permissions (such as `~/.config/openrouter/env.sh`) and are loaded from `~/.bashrc`/`~/.zshrc` — never written as text into shared config files.',
          'Codex’s `auth.json` stays free of secrets; the key comes from the environment (`OPENAI_API_KEY`, `BYTEZ_API_KEY`…).',
          'Before any `commit`: review `git status` and `git diff`, and never push secrets.',
        ],
      },
      { type: 'h3', id: 'maintenance', text: 'Maintenance habits' },
      {
        type: 'ul',
        items: [
          '**Backups:** copy a config file before any big edit (`cp config.toml config.toml.bak-$(date +%F)`).',
          '**Memory on Android:** keep idle MCP servers asleep (`mcp-idle off-all` after a task), and do not run `opencode web` next to the TUI — it doubles the footprint by ~300 MB.',
          '**Error memory:** before any risky operation, query `~/.local/share/opencode/errors.db`, and save every new fix to it — that is how the setup builds up experience instead of losing it.',
        ],
      },

      { type: 'h2', id: 'checklist', text: 'Final checklist' },
      {
        type: 'checklist',
        items: [
          '`cloudcli status` works and shows the database and projects',
          'The CloudCLI server is on `3001` and `browser-use-mcp.js` is running (`ps`)',
          '`~/.codex/config.toml` has `model_provider` + the `cloudcli-browser` block with the right token',
          '`~/.config/opencode/opencode.jsonc` has the provider + a `cloudcli-browser` entry under `"mcp"`',
          'Claude Code on Pro auth (`/status`) with `opus` selected via `/model`',
          'No `ANTHROPIC_BASE_URL` in your shell files',
          'The `claude` alias with `messaging-socket-path` in the shell you use',
          'Skills copied to all three paths (or installed with `npx skills`)',
          'Every external skill scanned with `skill-inspector`',
          '`.bak` copies made before editing config files',
        ],
      },
      {
        type: 'quote',
        text: 'Documented from a real, working setup — update the numbers (versions and paths) whenever you change something. A good guide is alive and grows with the setup.',
      },
    ],
  'edms-archive-pro': [
      {
        type: 'p',
        text: '**Archive Pro (EDMS Pro)** is an electronic document management system built as a central server on a dedicated machine. Users never touch the files directly — they reach a server that gives them a browser interface over HTTPS.',
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Direct download',
        items: [
          '**Version:** 1.0.0 — Windows x64 build.',
          'A single NSIS installer. There is no portable USB edition and no ZIP file.',
          'Read the [code-signing notes](#unsigned) before running it.',
        ],
      },
      edmsDownload,
      {
        type: 'table',
        caption: 'Product card',
        head: ['Item', 'Value'],
        rows: [
          ['Product name', 'EDMS Pro / Archive Pro'],
          ['Version', '1.0.0'],
          ['App ID', '`sa.edms.archive.pro`'],
          ['Executable name', '`edms-archive-pro`'],
          ['Database', 'SQLite (a single file on the server disk)'],
          ['Installer', 'Windows x64 (NSIS)'],
        ],
      },

      { type: 'h2', id: 'architecture', text: 'Runtime architecture' },
      {
        type: 'p',
        text: 'The most important architectural decision: **the server is fully independent of the user interface**. The system runs on a dedicated machine with a local Electron panel to manage and start the server, while users connect from their own devices through the browser.',
      },
      {
        type: 'ul',
        items: [
          '**SQLite database** — one file on the server disk, with no separate database server to install or manage.',
          'The server binds to `0.0.0.0` and the port is configurable through `EDMS_PORT`.',
          'Files and the database file are stored on the server disk only.',
          '**Clients never reach the database or the storage folder directly** — everything goes through the permissions layer.',
          'Secret server settings live in `userData/pro.env`, outside the installer.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Why SQLite?',
        items: [
          '**No separate database server:** the installer alone is enough — no second engine to install or manage.',
          'The whole database is one file, which makes backups and moving to another machine simpler.',
          'SQLite allows one writer at a time, which suits a single central server that every request passes through.',
        ],
      },
      { type: 'h2', id: 'search', text: 'Search and indexing' },
      {
        type: 'p',
        text: 'Full-text search through **SQLite FTS5**. The index covers the title, description, **OCR** text, keywords, and document number.',
      },
      {
        type: 'code',
        lang: 'sql',
        code: `-- FTS5 tools for indexing and querying
fts5       -- virtual full-text index table
MATCH      -- keyword search query
"phrase"   -- exact phrase match inside double quotes
word*      -- prefix search
bm25()     -- rank results by relevance`,
      },
      {
        type: 'p',
        text: 'FTS5 is built into SQLite itself: the index lives inside the same database file, so there is no separate search service to run or keep in sync.',
      },
      { type: 'h2', id: 'documents', text: 'Documents and versions' },
      {
        type: 'p',
        text: 'Every upload runs inside **a single transaction** — the file is either committed in full or not at all. The database never holds a half-finished state.',
      },
      {
        type: 'ul',
        items: [
          'Type, size, and **file signature** (magic bytes) checks — the extension is never trusted.',
          'Malware scan before a file is accepted.',
          'Background OCR processing with retry.',
          'Soft delete with a recycle bin.',
          'Bulk download and export, with permission checks.',
        ],
      },
      { type: 'h3', id: 'versions', text: 'An immutable version history' },
      {
        type: 'p',
        text: 'Every document has a version history that cannot be overwritten. Each version has a unique number, and history can never be deleted.',
      },
      {
        type: 'checklist',
        items: [
          'A unique version number within each document',
          'Upload and download previous versions',
          'Restore an old version without erasing history',
          'Show the uploader, date, size, and notes',
          'Show the size difference between versions',
        ],
      },
      { type: 'h2', id: 'workflow', text: 'Approvals and workflows' },
      {
        type: 'p',
        text: 'Multi-step workflow templates, with each step assigned to a user or a role, and configurable deadlines.',
      },
      {
        type: 'ul',
        items: [
          'Approval requests: approve or reject with a comment.',
          'In-app notifications with a full audit trail.',
          'Send back to the previous step on rejection.',
          '**A sequential event log** for every workflow — ordered in time.',
        ],
      },
      { type: 'h2', id: 'security', text: 'Security and identity' },
      {
        type: 'p',
        text: 'The authentication and authorization layers in the system:',
      },
      {
        type: 'table',
        head: ['Layer', 'Implementation'],
        rows: [
          ['Sessions', 'Stored in the database and revocable instantly'],
          ['Cookies', 'Signed and protected'],
          ['Rate limiting', 'Persistent, for login attempts'],
          ['MFA', 'TOTP with a QR code for app setup'],
          ['Account recovery', 'Single-use HMAC codes that can be regenerated'],
          ['SSO', 'OIDC Authorization Code + PKCE'],
          ['Token validation', '`state`, `nonce`, and RS256 signatures via JWKS'],
          ['Authorization', 'RBAC with isolation by role, department, and classification level'],
          ['Request protection', 'Host, Origin, CSP, and CSRF on mutating routes'],
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Why keep sessions in the database?',
        items: [
          'A stored session can be **revoked instantly** from the other side.',
          'An in-memory session (the default) can only be ended by waiting for it to expire.',
          'That difference is decisive when offboarding an employee or revoking a lost device.',
        ],
      },
      { type: 'h2', id: 'signature', text: 'Cryptographic signatures' },
      {
        type: 'p',
        text: 'Any file can be signed and later verified as unchanged using **SHA-256 with Ed25519**. The system shows the algorithm, provider, date, and status.',
      },
      {
        type: 'ul',
        items: [
          'Ed25519 signing — just two keys, no complicated machinery.',
          'Verifies file integrity and prevents changes after signing.',
          'Supports an **external PKI provider** when keys and certificates are supplied — your organisation’s authority, not the system itself.',
        ],
      },
      { type: 'h2', id: 'dlp', text: 'DLP and data-leak prevention' },
      {
        type: 'p',
        text: 'Configurable policies that run in **audit** mode (log without blocking) or **block** mode. They apply to uploads, downloads, and bulk exports.',
      },
      {
        type: 'code',
        lang: 'text',
        code: `Formats text can be extracted from:
  PDF    DOCX    XLSX    PPTX

Logged on a violation:
  policy · user · document · operation · matched excerpt

Protection against catastrophic regular expressions (ReDoS)`,
      },
      { type: 'h2', id: 'retention', text: 'Retention and legal hold' },
      {
        type: 'p',
        text: 'Retention policies can be global or scoped to a department and document type. On a tie, **the most specific and then the longest** wins — so documents are never deleted under a weaker global policy.',
      },
      {
        type: 'ul',
        items: [
          'Blocks destruction before the retention period ends.',
          '**Legal Hold** with the reason, case reference, creator, and dates.',
          'Release a hold without deleting its history.',
          'Protected documents are safely skipped when the bin is emptied.',
        ],
      },
      { type: 'h2', id: 'backup', text: 'Backup and restore' },
      {
        type: 'p',
        text: 'A backup is a consistent snapshot of the SQLite database file, taken while the server is running. Before a restore, a **rollback copy** is created, and on failure an automatic rollback runs.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Manual copy from the command line — replace edms.db with the database path on the server
sqlite3 edms.db ".backup 'backup.db'"
sqlite3 backup.db "PRAGMA integrity_check;"`,
      },
      {
        type: 'ul',
        items: [
          'Includes storage files, scripts, and non-secret settings.',
          '**A manifest signed with HMAC, with a SHA-256 fingerprint for every file.**',
          'Optional encryption of the backup file.',
          'Success and failure logs for every restore.',
        ],
      },
      { type: 'h2', id: 'ops', text: 'Operations and monitoring' },
      {
        type: 'ul',
        items: [
          'Liveness and Readiness endpoints.',
          'Checks for the database, storage, free space, and deployment settings.',
          '**Prometheus metrics.**',
          'A configurable SIEM webhook.',
          'An audit log for security and administrative operations.',
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Integrations need a third party',
        items: [
          'A real connection cannot be assumed to work without the provider’s endpoints, keys, and certificates.',
          'Do not copy the database file by hand while the server is running — you may get an inconsistent copy. Use the system’s backup tool.',
          'Every external integration needs configuring before it works — do not assume it is ready.',
        ],
      },
      { type: 'h2', id: 'results', text: 'Verification results' },
      {
        type: 'stats',
        items: [
          { value: '345', label: 'passing tests' },
          { value: '30', label: 'test files' },
          { value: '0', label: 'production vulnerabilities' },
          { value: '0', label: 'ESLint errors' },
        ],
      },
      {
        type: 'ul',
        items: [
          '**TypeScript:** passes with no errors.',
          '**ESLint:** passes — zero errors and zero warnings.',
          '**Tests:** 345/345 passing across 30/30 files.',
          '**Production build (Webpack):** succeeds.',
          '**Production dependency vulnerabilities:** zero.',
        ],
      },
      { type: 'h2', id: 'unsigned', text: 'Before you install' },
      {
        type: 'callout',
        tone: 'warn',
        title: 'The installer is not code-signed',
        items: [
          'The installer is **unsigned** — Windows SmartScreen will show a warning when you run it.',
          'That is expected for an early release, but it means Windows does not verify the publisher.',
          'Download only from the source listed here, and check the file size before running it.',
          'Goal for upcoming releases: a code signature from a recognised certificate authority.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Verification limits, stated plainly',
        items: [
          'The installer is NSIS, x64 only: no portable edition and no ZIP file.',
          'Test a restore on sample data before relying on it in production.',
        ],
      },
      {
        type: 'quote',
        text: 'An archiving system is judged by what it keeps from being lost, not only by what it stores.',
      },
      { type: 'h2', id: 'get', text: 'Download' },
      {
        type: 'p',
        text: '**Archive Pro — version 1.0.0 for Windows x64**',
      },
      edmsDownload,
      {
        type: 'p',
        text: 'After installing: run `edms-archive-pro`, set the port you want through `EDMS_PORT` in `userData/pro.env`, then start the server.',
      },
      {
        type: 'checklist',
        items: [
          'Verify the download source',
          'Change the default passwords before production',
          'Back up the database before any update',
          'Test backup and restore on sample data',
          'Test DLP policies on sample files',
          'Turn on TOTP before adding real users',
          'Review the audit log after the first week',
        ],
      },
    ],
  'google-antigravity-on-ubuntu': [
      {
        type: 'p',
        text: 'Antigravity is a development environment from Google that brings agents, MCP servers, and automation tools into one interface. Setting it up on Ubuntu takes five stages, and each one has a prerequisite.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'What you will have at the end',
        items: [
          'The Antigravity engine, installed from Google’s official repository.',
          'A backend server that manages agents, running in the background inside `tmux`.',
          'A web UI on `localhost:8585` with Google sign-in.',
          'The Python SDK inside an isolated virtual environment (`venv`).',
          'A standalone IDE in the style of VS Code.',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '5', label: 'install stages' },
          { value: '8585', label: 'default port' },
          { value: 'venv', label: 'isolated Python env' },
          { value: '1', label: 'Google account to sign in' },
        ],
      },

      { type: 'h2', id: 'prereq', text: 'Step zero — base packages' },
      {
        type: 'p',
        text: 'Before anything else, install the tools every later stage relies on. The most important is `tmux` — without it the server dies the moment you close the terminal.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `sudo apt update
sudo apt install -y curl git python3 python3-pip tmux nodejs npm`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Why `tmux` specifically?',
        items: [
          '`tmux` keeps the process alive after the terminal closes or the network drops.',
          'You can reattach to the same session later by name — without restarting the server.',
          'Without it, you would have to rerun the start command every time.',
        ],
      },

      { type: 'h2', id: 'engine', text: 'Step 1 — install the Antigravity engine' },
      {
        type: 'p',
        text: 'The engine is installed from an official APT repository. Four steps: create the keyrings folder, download the signing key, register the repository, then install.',
      },
      {
        type: 'p',
        text: 'First, the keyrings folder and the signing key:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg \\
  | sudo gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg`,
      },
      {
        type: 'p',
        text: '`--dearmor` converts the key from ASCII armor into the binary format APT expects in `keyrings`.',
      },
      {
        type: 'p',
        text: 'Second, register the repository and install:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] \\
https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ \\
antigravity-debian main" | sudo tee /etc/apt/sources.list.d/antigravity.list > /dev/null

sudo apt update
sudo apt install -y antigravity`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'If signature verification fails',
        items: [
          'A `NO_PUBKEY` error means the key was not saved correctly — repeat the key download step.',
          'Make sure `antigravity.list` really exists: `cat /etc/apt/sources.list.d/antigravity.list`',
          'For this install the key must be in `/etc/apt/keyrings/`, not `/usr/share/keyrings/`.',
        ],
      },

      { type: 'h2', id: 'sdk', text: 'Step 2 — the Python SDK in an isolated environment' },
      {
        type: 'p',
        text: 'The `google-antigravity` package is what lets you run your own tools, MCP servers, and advanced automation scenarios.',
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Create the environment in a project folder, not your home',
        items: [
          'The next command assumes you are inside a project folder.',
          'Run it in `~` and you get a `.venv` in your home directory — which makes no sense.',
          'Run `mkdir ~/projects/antigravity && cd $_` first.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `sudo apt update
sudo apt install python3-venv python3-pip

python3 -m venv .venv
source .venv/bin/activate

pip install google-antigravity`,
      },
      {
        type: 'p',
        text: 'After `source`, the prompt changes to start with `(.venv)`. That confirms the environment is active.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Check the install worked
python -c "import antigravity; print('SDK ready')"

# Leave the environment and go back to normal
deactivate`,
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Why `venv` rather than a global install?',
        items: [
          'Full isolation from system packages — upgrading `pip` will not break Ubuntu’s tools.',
          'Remove the environment by deleting one folder.',
          'Different versions per project, with no conflicts.',
        ],
      },

      { type: 'h2', id: 'web-ui', text: 'Step 3 — start the web UI' },
      {
        type: 'p',
        text: 'The engine ships with a backend server (the Agent Harness) that manages agents and projects over local ports. We run it inside `tmux` so it survives the terminal closing.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `tmux new -s antigravity-server`,
      },
      {
        type: 'p',
        text: 'You are now inside a new session. Start the service from there:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `agy server start --port 8585 --host 0.0.0.0`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Mind the `--host 0.0.0.0` flag',
        items: [
          'It binds the server to **every network interface** — any device on the same network can reach it.',
          'If you work alone, use `--host 127.0.0.1` instead to keep it on your machine.',
          'The port has no authentication before sign-in — never expose it to the public internet.',
        ],
      },
      {
        type: 'p',
        text: 'Now leave the session **without stopping the server**: press `Ctrl + B`, then `D` (detach).',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Reattach to the session when needed
tmux attach -t antigravity-server

# List sessions without entering one
tmux ls

# Stop the server for good
tmux kill-session -t antigravity-server`,
      },
      { type: 'h3', id: 'login', text: 'Sign-in and activation' },
      {
        type: 'p',
        text: 'Open this address in the browser:',
      },
      {
        type: 'code',
        lang: 'text',
        code: `http://localhost:8585`,
      },
      {
        type: 'p',
        text: 'You will be asked to click **Continue with Google** and sign in with your personal Gmail account. This step is **required** to enable the Gemini models (such as Flash and Pro) that drive the agents.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Why sign in to Google?',
        items: [
          'The models behind the agents run on Google’s servers, not entirely locally.',
          'The account determines your quota and available permissions.',
          'If you copy or move the session, sign in with the same account so the tools recognise you.',
        ],
      },

      { type: 'h2', id: 'ide', text: 'Step 4 — the full IDE' },
      {
        type: 'p',
        text: 'If you want a VS Code-like interface with a Manager panel for handling tasks and agents visually, install it with the official build script:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `curl -fsSL https://antigravity.google/cli/install.sh | bash`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Before you run `curl | bash`',
        items: [
          'This runs a script **without review**, with your full permissions.',
          'The safe way: download the script and read it first.',
          '`curl -fsSL https://antigravity.google/cli/install.sh -o install.sh`, then `less install.sh` to review it, then `bash install.sh`.',
          'From a trusted official source the shortcut is acceptable — but checking costs nothing.',
        ],
      },
      { type: 'h3', id: 'first-run', text: 'First run — sign-in steps' },
      {
        type: 'ol',
        items: [
          'Run `agy` in the terminal.',
          'It shows two options — type `1`, then `Enter`.',
          'Copy the link shown on screen.',
          'Open it in the browser, click **Continue with Google**, and sign in.',
          'Copy the authorization code shown on the page.',
          'Go back to the terminal, paste the code, then press `Enter`.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `agy`,
      },
      {
        type: 'p',
        text: 'Once linked, the interface starts with a single command:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `agyweb`,
      },
      {
        type: 'p',
        text: 'When the window opens in the browser: click the **three dots** → **Install** → **Create shortcut**, to install it as a standalone app.',
      },
      { type: 'h3', id: 'stop-web', text: 'Stopping the web UI' },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Close it when you are done',
        items: [
          'The interface uses machine resources even when idle.',
          'One command shuts it down completely:',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `agyweb-stop`,
      },

      { type: 'h2', id: 'daily', text: 'Everyday commands' },
      {
        type: 'table',
        caption: 'Quick reference — keep it handy',
        head: ['Command', 'What it does'],
        rows: [
          ['`agy`', 'Start the GUI and sign in the first time'],
          ['`agyweb`', 'Open the web UI'],
          ['`agyweb-stop`', 'Close the web UI'],
          ['`agy server start`', 'Start the backend server (inside tmux)'],
          ['`tmux attach -t antigravity-server`', 'Reattach to the server session'],
          ['`source .venv/bin/activate`', 'Activate the Python environment'],
          ['`deactivate`', 'Leave the Python environment'],
        ],
      },

      { type: 'h2', id: 'troubleshoot', text: 'Common problems' },
      {
        type: 'ul',
        items: [
          '**Port 8585 is taken** — change the number in `--port`, then open the new port in the browser.',
          '**The server dies when the terminal closes** — you forgot `Ctrl+B` then `D`. Restart it inside `tmux`.',
          '**`python -m venv` fails** — usually `python3-venv` is not installed. Install it and recreate the environment.',
          '**Sign-in never completes** — make sure the browser is on `localhost`, not the machine’s IP address.',
          '**The UI will not open** — check the session is alive: `tmux ls` should list `antigravity-server`.',
        ],
      },
      {
        type: 'checklist',
        items: [
          'All base packages installed and `tmux` works',
          'The signing key is in `/etc/apt/keyrings/`',
          '`antigravity.list` is registered and `apt update` shows no errors',
          'The `antigravity` package installed successfully',
          'The virtual environment is in the project folder, not your home',
          'The server runs inside a `tmux` session, detached',
          'Google sign-in was done through `localhost`',
          'The shortcut was created from the three-dots menu',
        ],
      },
      {
        type: 'quote',
        text: 'Close the web UI when you are done. A good tool left running eats your machine without you noticing.',
      },
    ],
  'opencode-tooling-guide': [
      {
        type: 'p',
        text: 'We built a complete site from scratch: an interface, a TikTok integration, a links page, and a blog with seven articles. Behind all of it sits a tool system — agents, skills, and MCP servers — that most beginners never hear about.',
      },
      {
        type: 'p',
        text: 'This article documents what was **actually** used, not what is available. For each tool: how it works, where it was called, how to install it, and then the **trap** no official doc mentions.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Why this matters to you',
        items: [
          'Good tools do not replace thinking, but they surface bugs no automated check catches.',
          'Most tools are officially documented without a real example — that is the gap this fills.',
          'A list of tools is not enough; what matters is **when to call each one** and when not to.',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '8', label: 'documented agents' },
          { value: '8', label: 'MCP servers' },
          { value: '4', label: 'skills' },
          { value: '3', label: 'critical bugs found' },
        ],
      },
      { type: 'h2', id: 'agents', text: 'Agents: minds with a clean context' },
      {
        type: 'p',
        text: 'An agent is a separate brain with a clean context. OpenCode hands it a specific task, it reads only what it needs, and the main context stays free. The difference between agents is not intelligence but **specialisation and way of thinking**.',
      },
      {
        type: 'table',
        caption: 'The core agents and where each one was used',
        head: ['Agent', 'When to call it', 'Real result from this project'],
        rows: [
          ['`code-reviewer`', 'Before any commit, with a targeted review', 'Found 3 critical bugs automated checks missed'],
          ['`debugger`', 'A non-obvious error or a failing build', '30 tsc errors → one line once the cause was isolated'],
          ['`frontend`', 'A new UI component', 'SonarGrid on canvas, Aurora in pure CSS'],
          ['`ui-designer`', 'Colours, spacing, and theme', 'A semantic token system instead of scattered values'],
          ['`speed-coder`', 'An edit under 20 lines', 'Swapping a CSS property, dropping an import, updating a domain'],
          ['`researcher`', 'A technical decision that needs sources', 'Pulling the real TikTok account data'],
          ['`docs-expert`', 'A question about a library API’s behaviour', 'Framer Motion and Tailwind v4 docs via Context7'],
        ],
      },
      { type: 'h3', id: 'reviewer-lesson', text: 'The power of a review is in the request, not the agent' },
      {
        type: 'p',
        text: 'An open-ended review produced a lot of filler. When I asked with **an explicit checklist**, three actionable bugs came out. The difference was not the agent — it was how the request was phrased.',
      },
      {
        type: 'code',
        lang: 'text',
        code: `❌ "Review the project"

✅ "Review: broken links, horizontal overflow in RTL,
           dead classes, worst case"`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'How to pick an agent',
        items: [
          'Start with `speed-coder` if the file is known and the scope is narrow.',
          'Move to a heavier agent only when the task is **conceptual** rather than **editorial**.',
          'Never use a fast agent on an architectural decision — speed just ships the wrong answer sooner.',
        ],
      },
      { type: 'h2', id: 'mcp-idle', text: 'The biggest lesson: keep MCP servers off by default' },
      {
        type: 'p',
        text: 'Every local MCP server is **a separate Node process** costing 50 to 115 MB. Six of them means roughly 600 MB and six permanent processes.',
      },
      {
        type: 'p',
        text: 'On Android the problem is not a conflict with another app. **LMKD** does not care who is at fault: as memory climbs, opencode becomes the largest killable process, so it gets killed. In our project the browser nearly got killed on every inspection attempt.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `mcp-idle status          # what is off, what is on + live RSS
mcp-idle doctor          # diagnostics + process check
mcp-idle on <name>       # wake a server (opencode restart required)
mcp-idle off <name>
mcp-idle on-all | off-all`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'The trap that never shows',
        items: [
          '`mcp-idle on X` looks successful with no effect — because opencode resolves MCP connections **at startup only**.',
          'The fix: run the command, then **quit and restart** opencode.',
          'Remote servers (context7, hacktron) always work — HTTPS with no local process.',
          'Run `mcp-idle off X` when the task is done, or the footprint piles up.',
        ],
      },
      { type: 'h2', id: 'skills', text: 'Skills: instructions loaded on demand' },
      {
        type: 'p',
        text: 'A skill is not an agent: it is text that guides, not a separate mind that executes. It loads only when it overlaps with the task, so it costs no unnecessary context.',
      },
      {
        type: 'table',
        head: ['Skill', 'Role', 'Practical note'],
        rows: [
          ['`@agent-reach`', 'Read pages and repos from 16 channels', 'Twitter, Reddit, and IG need cookies — do not assume they work'],
          ['`@error-memory`', 'A persistent store of errors and their fixes', 'Search it before any risky operation'],
          ['`@vercel/agent-skills`', 'TypeScript and React rules', 'A reference backed by Vercel'],
          ['`skillspector`', 'Security scan before installing any skill', 'Start with `noLlm=true`: faster, cheaper, no key needed'],
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'A security rule',
        items: [
          'A skill is text executed with your permissions — a malicious skill is a backdoor.',
          'Review any skill before installing it, and never install from an unknown source.',
          '**These tools are read-only**: no posting, commenting, or liking.',
        ],
      },
      { type: 'h2', id: 'errors-found', text: 'Three real bugs the review caught' },
      {
        type: 'p',
        text: 'These are the most practical examples in this project. All three passed `tsc` and `eslint` without a single warning.',
      },
      {
        type: 'ol',
        items: [
          '**Sharing reported failure after it succeeded.** `navigator.share` resolves to `undefined`, not a `boolean`, so `return navigator.share(...).catch(() => false)` showed “Could not share” after the user had actually shared.',
          '**Every interactive affordance on the site was dead.** The classes were written as CSS rules in `@layer utilities`, and Tailwind generates no variants for them. Result: `hover:border-strong` and `bg-elevated/80` were missing from the built CSS.',
          '**Invisible dots.** `s.icon.replace("text-","bg-")` built a class name at runtime, and Tailwind’s scanner only sees literal text.',
        ],
      },
      {
        type: 'code',
        lang: 'css',
        code: `❌ /* no variants, no opacity modifiers */
@layer utilities {
  .bg-elevated { background-color: var(--bg-elevated); }
}

✅ /* produces hover:bg-elevated and bg-elevated/80 */
@theme inline {
  --color-elevated: var(--bg-elevated);
}`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'The rule for @theme versus @utility',
        items: [
          '**`@theme inline`** supports both: variants **and** `/NN` opacity.',
          '**`@utility`** supports variants only — no opacity modifiers.',
          'Choose `@theme` when the name maps to a single colour property, and `@utility` when the name is ambiguous.',
        ],
      },
      { type: 'h2', id: 'npm-trap', text: 'The trap that never throws an error' },
      {
        type: 'p',
        text: 'This lesson alone is worth the read. When installing dependencies, npm reported **success** — while `vite`, `typescript`, and `@types/react` were missing entirely.',
      },
      {
        type: 'p',
        text: 'The environment exported `NODE_ENV=production`, and npm treats `devDependencies` as optional in production, so it skipped them silently. **No warning and no error — just a missing tool later.**',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Local fix
NODE_ENV=development npm install --include=dev

# For Netlify deploys — otherwise the build fails without vite
[build.environment]
  NODE_ENV = "production"
  NPM_FLAGS = "--include=dev"`,
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Do not trust "install succeeded" — check for yourself
ls node_modules/.bin/vite node_modules/typescript \\
  >/dev/null && echo "✅" || echo "❌ devDependencies skipped"`,
      },
      { type: 'h2', id: 'security', text: 'Security and privacy in the build' },
      {
        type: 'p',
        text: 'The rule kept throughout the build: **tokens never enter the project**.',
      },
      {
        type: 'table',
        head: ['Rule', 'How it was applied'],
        rows: [
          ['Token outside the repo', 'Stored in `~/.netlify/config.json` with 600 permissions'],
          ['Used through the environment', '`NETLIFY_AUTH_TOKEN` never passes through a command line'],
          ['Heavy tool outside the project', '`netlify-cli` (150 MB) removed from devDependencies'],
          ['`.gitignore`', 'Protects `dist/`, `.netlify/`, and `.env*`'],
          ['CSP headers', '`script-src \'self\'`, `object-src \'none\'`, and HSTS'],
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Check before any commit
grep -rn "nfp_\\|ntfm_\\|ghp_\\|nvapi-" . \\
  --exclude-dir=node_modules --exclude-dir=dist
find . -name ".env*" -not -path "*/node_modules/*"
git check-ignore dist .netlify .env && echo "✅ protected"`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'An allowlist for links',
        items: [
          'Run any `href` from an external source through an allowlist before rendering it.',
          'Without it, `javascript:` becomes an execution sink the moment posts come from a CMS.',
          'The list closes the door before it opens — not after the first breach.',
        ],
      },
      { type: 'h2', id: 'lessons', text: 'Lessons from the real deploy' },
      { type: 'h3', id: 'lesson-401', text: '401 on everything after deploying' },
      {
        type: 'p',
        text: 'The deploy succeeded, but every route returned **401** with a `Login Redirect` body. The cause: the account had `site_sso_login: true`, meaning “sign-in required to view sites”.',
      },
      {
        type: 'p',
        text: 'The API refused to change it at the account level (Free plan). It was accepted at the site level:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `curl -X PATCH \\
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"sso_login": false}' \\
  https://api.netlify.com/api/v1/sites/<site-id>`,
      },
      {
        type: 'p',
        text: 'Result, immediately: **200** on every route. To stop it recurring, turn the setting off at the account level too.',
      },
      { type: 'h3', id: 'lesson-domain', text: 'A globally reserved subdomain' },
      {
        type: 'p',
        text: '`ghost778.netlify.app already exists` — `netlify.app` names are reserved globally, with no priority for your account. `ghost-778` was used first, then the site was later renamed to `zidex`. Every rename means updating `canonical`, `og:url`, `sitemap.xml` and `robots.txt` — four places, and missing one leaves your metadata pointing at a dead domain.',
      },
      {
        type: 'checklist',
        items: [
          '`<link rel="canonical">` and `og:url` in `index.html`',
          'The `Sitemap:` line in `robots.txt`',
          'Every `<loc>` in `sitemap.xml`',
          'Any absolute URL hand-written in the code',
        ],
      },
      { type: 'h2', id: 'checklist', text: 'Final checklist' },
      {
        type: 'checklist',
        items: [
          '`tsc` zero errors',
          '`eslint` zero errors',
          'No secrets in the project or the built bundle',
          '`.gitignore` protects `dist`, `.netlify`, and `.env`',
          'CSP header present on the live site',
          'The home page returns 200, not 401',
          'SPA routes work on a deep link',
        ],
      },
      { type: 'h2', id: 'adapters', text: 'What fits you' },
      {
        type: 'p',
        text: 'Start small. Do not copy the whole system — most of it works with no extra setup.',
      },
      {
        type: 'ol',
        items: [
          '**Essential:** one agent for review, and one for quick edits.',
          '**Useful:** the error-memory skill, and Context7 for library docs.',
          '**As needed:** extra MCP servers — add them only when there is a real need.',
          '**Do not add without a reason:** a tool you do not know when you will use is reserved memory for nothing.',
        ],
      },
      {
        type: 'quote',
        text: 'A good tool does not just make you faster — it shows you the bug you were about to ship.',
      },
    ],
  'docker-on-android-termux': [
      {
        type: 'p',
        text: 'You cannot run the Docker engine directly inside Termux. The reason is not Termux itself: Docker needs **Linux kernel** features such as cgroups and namespaces, which are missing — or restricted — in the stock Android kernel.',
      },
      {
        type: 'p',
        text: 'The cleanest and most stable no-root solution is **a very light Alpine Linux virtual machine** running under the QEMU emulator. Because the guest has its own kernel, Docker runs inside it exactly as it would on any ordinary server.',
      },
      { type: 'h2', id: 'prereq', text: 'Before you start: what you need' },
      {
        type: 'ul',
        items: [
          '**Storage:** a virtual disk of up to 4 GB, which only takes up space as it is actually used.',
          '**Memory:** the system needs at least 1 GB to run comfortably.',
          '**CPU:** two virtual cores (`smp cpus=2`) are enough for light containers.',
          '**First-time setup:** 20–30 minutes of downloading and installing; after that it boots in seconds.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Why QEMU and not Termux Proot',
        items: [
          '**Termux Proot** is faster and lighter, but it has no cgroups and no real privileges — so some Docker images do not work with it.',
          '**QEMU** gives you a complete system with a proper kernel, devtmpfs, and cgroups — an environment that matches production.',
          'The trade-off is clear: stability and fidelity in exchange for longer boot times and a bigger footprint.',
        ],
      },

      { type: 'h2', id: 'step-1', text: 'Step 1 — install the base packages in Termux' },
      {
        type: 'p',
        text: 'Open Termux and update the repositories. Then add x11-repo, which is required because some QEMU packages are not in the main repository and fail to install without it.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `pkg update && pkg upgrade -y
pkg install x11-repo -y
pkg install qemu-utils qemu-system-x86-64-headless wget -y`,
      },

      { type: 'h2', id: 'step-2', text: 'Step 2 — create a work folder and download Alpine' },
      {
        type: 'p',
        text: 'Create a dedicated folder, then download the Alpine build made for virtual environments (alpine-virt) — the smallest edition that still has what containers need. Once downloaded, create a 4 GB virtual disk.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `mkdir alpine && cd alpine
wget http://dl-cdn.alpinelinux.org/alpine/v3.12/releases/x86_64/alpine-virt-3.12.3-x86_64.iso
qemu-img create -f qcow2 alpine.img 4G`,
      },
      {
        type: 'p',
        text: 'The disk file is qcow2, so it does not actually occupy 4 GB — it only grows as it is used.',
      },

      { type: 'h2', id: 'step-3', text: 'Step 3 — boot the virtual machine for the first time' },
      {
        type: 'p',
        text: 'Start the virtual machine with the command below. Note that it also forwards port 2222 on the host, so you can later log in over SSH instead of typing inside the emulator.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `qemu-system-x86_64 -machine q35 -m 1024 -smp cpus=2 -cpu qemu64 \\
 -netdev user,id=n1,hostfwd=tcp::2222-:22 -device virtio-net,netdev=n1 \\
 -cdrom alpine-virt-3.12.3-x86_64.iso -nographic alpine.img`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'First login',
        items: [
          'When `localhost login:` appears, type `root` and press Enter.',
          'The default image has no password, so you are logged straight in.',
          '`-nographic` means the emulator runs inside the terminal with no graphical window — the best fit for Termux.',
        ],
      },
      {
        type: 'p',
        text: 'The flags: `-machine q35` picks the emulated machine type, `-m 1024` allocates 1 GB of memory, `-smp cpus=2` gives two cores, and `hostfwd` forwards a host port to a port inside the guest.',
      },

      { type: 'h2', id: 'step-4', text: 'Step 4 — enable networking and repositories' },
      {
        type: 'p',
        text: 'The system is running from an ISO that holds only the base packages, so first you need to bring the internet up.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `setup-interfaces -a
service networking start`,
      },
      {
        type: 'p',
        text: 'If `setup-interfaces -a` asks you anything, press Enter at each prompt to accept the defaults. Then replace the built-in repository list with Alpine’s servers, because the Docker package lives in the Community repository.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `cat <<EOF > /etc/apk/repositories
http://dl-cdn.alpinelinux.org/alpine/v3.12/main
http://dl-cdn.alpinelinux.org/alpine/v3.12/community
EOF`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'The most common mistake here',
        items: [
          'Forgetting the `community` repository makes `apk add docker` fail with “package not found”, even though the package exists.',
          'The 3.12 version in the URLs above must match the ISO you downloaded. Change one, change the other.',
          'Do not edit or delete the file — replace its contents entirely, as in the command above.',
        ],
      },

      { type: 'h2', id: 'step-5', text: 'Step 5 — install and start Docker' },
      {
        type: 'p',
        text: 'Update the package index, install Docker, then start it and add it to the services that run automatically at boot.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `apk update
apk add docker
service docker start
rc-update add docker boot`,
      },
      {
        type: 'p',
        text: '`rc-update add docker boot` is what makes Docker start automatically every time the machine boots, so you never have to repeat `service docker start`.',
      },

      { type: 'h2', id: 'step-6', text: 'Step 6 — test the engine' },
      {
        type: 'p',
        text: 'Run the official test container. If “Hello from Docker!” appears, the engine is working properly.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: 'docker run hello-world',
      },
      {
        type: 'stats',
        items: [
          { value: '4 GB', label: 'virtual disk size' },
          { value: '1 GB', label: 'minimum memory' },
          { value: '2222', label: 'SSH port on the host' },
        ],
      },

      { type: 'h2', id: 'ports', text: 'Managing ports: publishing a web app' },
      {
        type: 'p',
        text: 'There is an isolation layer between Docker containers and the Android phone, so any port you want to open on the phone has to be forwarded twice: once when starting QEMU, and once when starting the container.',
      },
      {
        type: 'ol',
        items: [
          'Shut the virtual machine down safely with `poweroff` from inside Alpine.',
          'Restart QEMU with an extra `hostfwd` for the port you need — here 8080 on the host maps to 80 inside the guest.',
          'Run the container on internal port 80.',
          'Open `http://localhost:8080` in the browser.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `qemu-system-x86_64 -machine q35 -m 1024 -smp cpus=2 -cpu qemu64 \\
 -netdev user,id=n1,hostfwd=tcp::2222-:22,hostfwd=tcp::8080-:80 -device virtio-net,netdev=n1 \\
 -nographic alpine.img`,
      },
      {
        type: 'p',
        text: 'Then start an Nginx container and check the result from the phone’s browser:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: 'docker run -d -p 80:80 nginx',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Choosing port numbers',
        items: [
          'The first number (8080) is what you type into the phone’s browser.',
          'The second number (80) is what you name inside `docker run -p`.',
          'Running several apps at once? Pick a different port for each: 8080, 8081, 8082…',
        ],
      },

      { type: 'h2', id: 'shutdown', text: 'Shutting down safely' },
      {
        type: 'p',
        text: 'Do not close the Termux app directly or kill the process from the task manager — an abrupt stop corrupts the virtual disk and loses your containers.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: 'poweroff',
      },
      {
        type: 'p',
        text: 'Run it inside Alpine and wait until you are back at the Termux prompt. Everything you built stays on the disk.',
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Do not do this',
        items: [
          'Do not close Termux from Android’s app switcher — you risk losing the containers or the file system.',
          'Do not `kill` the QEMU process — a qcow2 disk does not survive interrupted writes.',
          'Do not delete the ISO after the first boot without thinking — you may need it to reinstall.',
        ],
      },

      { type: 'h2', id: 'ssh', text: 'Using SSH instead of typing commands by hand' },
      {
        type: 'p',
        text: 'Because port 2222 is forwarded to the host, you can log in from Termux itself without dealing with the emulator’s text console:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Inside Termux
pkg install openssh -y
ssh -p 2222 root@localhost

# Or from another device on the same network
ssh -p 2222 root@<machine-address>`,
      },
      {
        type: 'checklist',
        items: [
          'The QEMU command runs from inside the alpine folder',
          'At `localhost login:` type root, then Enter',
          'The contents of /etc/apk/repositories were fully replaced',
          'The community repository is in the list',
          '`docker run hello-world` prints the welcome message',
          'Before closing: `poweroff`, not closing the app',
        ],
      },
      {
        type: 'quote',
        text: 'This will not beat Docker Desktop on performance, but it makes containers possible on a device that was never meant to run them.',
      },
      {
        type: 'p',
        text: 'Start with one simple container, add a single port per app, and you will have a complete Docker development environment on your phone — no root, and no kernel changes.',
      },
    ],
  'first-30-seconds': [
      {
        type: 'p',
        text: 'Every video you post goes through a single moment before the viewer decides to leave: **the first fraction of a second**. The numbers we collected from hundreds of accounts agree on one rule: a video that does not prove itself in that moment does not deserve the rest of the time you gave it.',
      },
      { type: 'p', text: 'This article explains how to build a hook that works, and how to tell your hook is failing before you even post.' },
      { type: 'h2', id: 'the-3-questions', text: 'The three questions your opening shot answers' },
      {
        type: 'p',
        text: 'At the start, the viewer does not ask “do I like this?” — only three questions, and your first shot answers them:',
      },
      {
        type: 'ol',
        items: [
          '**What is this?** — one shot that sums up the topic visually. A cut-in shot is enough; no introductory sentence.',
          '**Why should I care?** — a clear benefit, a surprise, or the promise of a specific result.',
          '**Why now?** — a reason watching now beats watching tomorrow: a trend, an event, or a personal mirror.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'The 3-word test',
        items: [
          'Describe the video in just three words.',
          'If it takes a full sentence, the first shot is unclear.',
          'Rework the shot until it sums itself up in three words.',
        ],
      },
      { type: 'h2', id: 'hook-types', text: 'Five kinds of hook, each with its place' },
      {
        type: 'p',
        text: 'There is no absolute “best” hook. What works in a tutorial can fail completely in a comedy clip. These five cover most cases:',
      },
      {
        type: 'ul',
        items: [
          '**Result first** — start at the end. The strongest hook of all, because it opens an instant curiosity gap.',
          '**The impossible question** — “How did I get these returns in 30 days?”, then half a second of silence.',
          '**The common mistake** — “This mistake cost me 6 months”, showing the mistake on screen before the fix.',
          '**A visual countdown** — three items appear one after another, no talking. Works great without sound.',
          '**The confession** — “My first video was a complete disaster.” An honest admission pulls faster than a show of strength.',
        ],
      },
      { type: 'h2', id: 'audio', text: 'Sound before picture' },
      {
        type: 'p',
        text: 'Modern platforms turn the sound up automatically as people scroll, so make your audio felt before the eye takes in the shot. Three practical rules:',
      },
      {
        type: 'ul',
        items: [
          'Start the voice or sound effect on **the very first frame**, not half a second later.',
          'Raise the volume a few notches for the first 5 seconds only, then bring it back to normal.',
          'Avoid an opening silence — two silent seconds is the fastest way to get skipped.',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `Suggested timeline (30 seconds)

0.0s – 0.3s   instant visual + audio hook
0.3s – 1.0s   the promised result, in one sentence
1.0s – 3.0s   your fastest shots — visual proof
3.0s – 22.0s  the core content + a cut every 2–3 seconds
22.0s – 28.0s the peak or the reveal
28.0s – 30.0s one call to action, clear and measurable`,
      },
      { type: 'h2', id: 'measure', text: 'How to tell the hook worked' },
      {
        type: 'stats',
        items: [
          { value: '≥ 70%', label: '3-second completion' },
          { value: '≥ 40%', label: '15-second completion' },
          { value: '≥ 12%', label: 'caption click-through' },
        ],
      },
      {
        type: 'p',
        text: 'These are not magic numbers, just baselines. What matters is comparing each video with your previous one, not with the general average. A video with 60% completion can be excellent if the one before it had 20%.',
      },
      {
        type: 'quote',
        text: 'A hook is not a trick. It is the first right thing in the video.',
        by: 'A Zidex working principle',
      },
      { type: 'h2', id: 'checklist', text: 'Pre-publish checklist' },
      {
        type: 'checklist',
        items: [
          'The first shot explains the topic in three words',
          'Audio starts on the first frame, not after it',
          'No silence longer than 0.5 seconds at the start',
          'The first quick cut happens before the two-second mark',
          'Only one call to action, and it measures something specific',
          'On-screen text matches what is being said',
        ],
      },
      {
        type: 'p',
        text: 'Run this list on your next video, then compare its 3-second completion rate. That is all you need to start.',
      },
    ],
  'tiktok-algorithm-2026': [
      {
        type: 'p',
        text: 'The biggest misunderstanding among new creators: that the TikTok algorithm judges you by your follower count. That has not been true for years. The system distributes based on engagement quality in each test batch, and followers are just a by-product.',
      },
      { type: 'h2', id: 'four-stages', text: 'The four distribution stages' },
      {
        type: 'p',
        text: 'Every video goes through four stages, each with a different bar. Failing any stage stops the video immediately:',
      },
      {
        type: 'ol',
        items: [
          '**Stage 1 — the first batch (20–50 views).** The system shows it to random viewers in your niche. It does not get past a minimum watch threshold otherwise.',
          '**Stage 2 — the second batch (50–500).** The same video is repeated to a wider slice of the audience. This is where “made only for fans” content shows its problem.',
          '**Stage 3 — expansion (500–50,000).** The system starts semantic matching: it tests the video on people interested in the topic, not in the creator.',
          '**Stage 4 — wide reach (50,000+).** It is shown to much broader audiences. Here rewatch speed and extra watch time matter more than taps.',
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Where most videos die',
        items: [
          'First death: low completion in stage one — the hook is weak.',
          'Second death: weak emotional response — views with no comments or saves.',
          'Third death: a topic too narrow — nobody outside your followers is looking for it.',
        ],
      },
      { type: 'h2', id: 'signals-ranked', text: 'Signals ranked by impact' },
      {
        type: 'p',
        text: 'Not all signals are equal. The practical order, from strongest to weakest:',
      },
      {
        type: 'ul',
        items: [
          '**Watch time** — the master metric. Every extra second beyond the natural length counts double.',
          '**Replays** — a very strong signal of intent, sometimes more important than a like.',
          '**Shares** — each share is a free recommendation to three people outside your audience.',
          '**Saves** — turn content from entertainment into a reference, and feed semantic search.',
          '**Comments and questions** — open a conversation, and lift distribution again.',
          '**Likes** — a relatively weak signal; many people tap without paying attention.',
        ],
      },
      { type: 'h2', id: 'cadence', text: 'Timing and posting cadence' },
      {
        type: 'p',
        text: 'Consistency does not mean posting daily; it means a schedule your audience can predict. One excellent video every three days beats five average ones a day:',
      },
      {
        type: 'checklist',
        items: [
          'Pick two posting days and stick to them',
          'Post inside your audience’s peak window (often 8–11 pm local time)',
          'Repost your best video in a fresh style after 3 months',
          'Never delete a video even if it flopped — your data comes from it',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `When to change course — warning signs

•  low completion ← the hook is unclear; rework the first 3 seconds
•  high views + almost no follows ← the topic does not serve the channel
•  high saves + low shares ← reference content; link it to a next step
•  everything low ← the audio or the picture, not the algorithm`,
      },
      {
        type: 'quote',
        text: 'The algorithm does not measure video quality. It measures what viewers do when nobody asks them to.',
      },
      { type: 'h2', id: 'what-to-do', text: 'What to do tomorrow' },
      {
        type: 'p',
        text: 'Take your last ten videos, calculate the 3-second completion rate for each, and sort them in descending order. The one at the bottom is not necessarily a “bad idea” video — often it is the most recent one, which tells you your system has not settled yet.',
      },
      {
        type: 'p',
        text: 'Fix only the worst one this week. One improved video beats ten random attempts.',
      },
    ],
  'dark-mode-that-works': [
      {
        type: 'p',
        text: 'A bad dark mode is not just “different” from light mode — it is worse. When a developer puts pure white text on a pure black background, the letters look engraved and the eye struggles to focus. The fix is not another colour; it is a system.',
      },
      { type: 'h2', id: 'the-problem', text: 'Why pure black is the enemy of reading' },
      {
        type: 'p',
        text: 'Three real, physical reasons:',
      },
      {
        type: 'ul',
        items: [
          '**Excessive contrast** — white on black reaches a contrast ratio close to 21:1, far more than the eye needs. The result is strain on focus.',
          '**Halation** — bright screens produce a glow around white text, so the letters blur into their surroundings.',
          '**Lost detail** — absolute black swallows fine detail like gradients and thin borders.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'The practical rule',
        items: [
          'Never use #000000 as a background. Use a very dark grey such as #05060A.',
          'Never use #FFFFFF for body text. Use a slightly blue-tinted white such as #F4F5F8.',
          'Target contrast for body text: 12:1 to 15:1, not 21:1.',
        ],
      },
      { type: 'h2', id: 'tokens', text: 'A token system: one layer changes, nothing else is touched' },
      {
        type: 'p',
        text: 'What breaks both modes most is repeated values. The fix is to define **meanings** instead of colours:',
      },
      {
        type: 'code',
        lang: 'css',
        code: `:root {
  --bg: var(--color-ink-50);
  --fg: var(--color-ink-950);
  --fg-muted: var(--color-ink-500);
  --line: color-mix(in oklab, var(--color-ink-950) 10%, transparent);
  --accent: var(--color-ghost-600);
}

.dark {
  --bg: var(--color-ink-950);          /* not pure black */
  --fg: #f4f5f8;                        /* not pure white */
  --fg-muted: #a2a8b8;
  --line: color-mix(in oklab, #ffffff 11%, transparent);
  --accent: var(--color-ghost-400);     /* lighter in dark mode */
}

/* Consumers never know which mode is on */
.my-card {
  background: var(--bg-elevated);
  color: var(--fg);
  border: 1px solid var(--line);
}`,
      },
      {
        type: 'p',
        text: 'Note two key patterns: **the accent gets lighter** in dark mode because it has to stand out, and **the line colour relies on alpha**, so it fits both backgrounds automatically.',
      },
      { type: 'h2', id: 'anti-flicker', text: 'Preventing the flash on load' },
      {
        type: 'p',
        text: 'A white flash on page load is the best-known dark-mode bug. It happens because React mounts after the first frame is painted. The fix: a synchronous script in the `head`, before any CSS:',
      },
      {
        type: 'code',
        lang: 'html',
        code: `<script>
  (function () {
    var stored = localStorage.getItem('ghost-theme');
    var system = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    var theme = stored || system;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  })()
</script>`,
      },
      {
        type: 'p',
        text: 'The script runs before the first pixel is painted, so the result is zero flash — however slow the network.',
      },
      { type: 'h2', id: 'images', text: 'Images and icons do not follow the mode on their own' },
      {
        type: 'ul',
        items: [
          'Add `filter: invert(1) hue-rotate(180deg)` to colour images in dark mode, or use `picture` with `source media`.',
          'Use ink-style SVG icons (`currentColor`) so they follow the text automatically.',
          'Avoid a raster logo: make it an SVG so it works in both modes.',
        ],
      },
      { type: 'h2', id: 'respect-preference', text: 'Respecting the system preference' },
      {
        type: 'p',
        text: 'Never force a mode. Follow the user’s system until they change it manually, then stop following it — because the user changed their mind deliberately:',
      },
      {
        type: 'checklist',
        items: [
          'Default comes from `prefers-color-scheme`',
          'A manual choice is saved in localStorage',
          'After a manual choice, stop listening to system changes',
          'The synchronous script prevents the flash',
          '`<meta name="theme-color">` switches with the mode',
        ],
      },
    ],
  'link-hub-that-converts': [
      {
        type: 'p',
        text: 'The most common mistake on link pages: ten similar links in one list. The result is that the visitor taps none of them. A successful page orders the options by how likely they are to be tapped, and makes the choice easy.',
      },
      { type: 'h2', id: 'hierarchy', text: 'Hierarchy before styling' },
      {
        type: 'p',
        text: 'Before any question about colours, answer this: what do you want the visitor to do? Usually one of three things, and they will not do more than one:',
      },
      {
        type: 'ol',
        items: [
          '**Follow you** — so the first link must be your account, and the biggest visually.',
          '**Consume content** — a blog or a series; this is where the articles go.',
          '**Get in touch** — a business collaboration or a visitor’s question, with a lighter visual weight.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'The 7–2–1 rule',
        items: [
          '7 links to content or tools that serve the audience.',
          '2 links to pages about you (about, blog).',
          'Just one external link — do not crowd it.',
        ],
      },
      { type: 'h2', id: 'card-design', text: 'A card needs more than a link' },
      {
        type: 'p',
        text: 'Every card holds four things: an icon, a title, a one-line description, and an optional badge. The description is the most important — it tells the visitor exactly what they get before they tap.',
      },
      {
        type: 'ul',
        items: [
          'Title: a clear action or resource, not a vague word like “click here”.',
          'Description: one sentence describing the outcome, not internal detail.',
          'Badge: use it for what is genuinely new — “New” or “Most read”.',
          'Icon: tie it to a fixed colour, not a random one every week.',
        ],
      },
      { type: 'h2', id: 'friction', text: 'Friction kills conversion' },
      {
        type: 'stats',
        items: [
          { value: '< 1s', label: 'target load time' },
          { value: '1', label: 'tap (no one-off new window)' },
          { value: '4', label: 'links or fewer above the fold' },
        ],
      },
      {
        type: 'p',
        text: 'Open external links in the same tab. A new window breaks the user’s context and reduces return visits. The only exceptions: copying a link, or any action that could lose the user’s data.',
      },
      { type: 'h2', id: 'measure', text: 'What to measure' },
      {
        type: 'ul',
        items: [
          'Click rate on the first link — the most important number on the whole page.',
          'Which links are always ignored? Remove or reword them.',
          'Return rate from the blog back to the links page.',
          'Time between first and last visit (reflects the quality of the backbone).',
        ],
      },
      {
        type: 'quote',
        text: 'Every extra link nobody taps is noise. Noise adds no value — it lowers the value of what matters.',
        by: 'The links-page principle',
      },
      { type: 'h2', id: 'checklist', text: 'Checklist' },
      {
        type: 'checklist',
        items: [
          'The first link is the most prominent visually, not the most recently updated',
          'Every card has a one-sentence description',
          'No dead links — check them all regularly',
          'External links open in the same tab',
          'The page works just as well on a phone',
          'Link styling is clear on hover and focus',
        ],
      },
    ],
  'mobile-first-performance': [
      {
        type: 'p',
        text: 'The average user visits your page on a two-year-old phone, on a slow network, in a hurry. Every technical decision should be judged against that scenario, not on a fast desktop screen.',
      },
      { type: 'h2', id: 'metrics', text: 'The four metrics that matter' },
      {
        type: 'ol',
        items: [
          '**LCP** — the largest visible element. Target under 2.5 seconds on mobile networks.',
          '**INP** — interaction responsiveness. It replaces FID. Target under 200 ms.',
          '**CLS** — layout stability. Under 0.1. Every layout jump costs you taps.',
          '**TTFB** — time to first byte. Under 800 ms on static hosting.',
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Where the budget really goes',
        items: [
          'JavaScript hydration — not the size but the execution time.',
          'Web fonts: a font in four weights means four requests. Start with one font in two weights.',
          'Images: the wrong size downloads three times what a phone needs.',
          'Animations: `transform` and `opacity` only — anything else triggers layout on every frame.',
        ],
      },
      { type: 'h2', id: 'cls', text: 'CLS: the mistake beginners make most' },
      {
        type: 'p',
        text: 'A sudden layout jump comes from an element with no reserved dimensions. The rule: anything that appears later needs `width` and `height`, or an `aspect-ratio`:',
      },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- Wrong: an image with no dimensions, the browser reserves nothing -->
<img src="cover.jpg" alt="Cover" />

<!-- Right: explicit dimensions prevent the jump -->
<img
  src="cover.jpg"
  alt="Cover"
  width="1200"
  height="630"
  loading="lazy"
  decoding="async"
/>

<!-- Clean alternative: a container with a fixed aspect ratio -->
<div class="aspect-video overflow-hidden">
  <img src="cover.jpg" alt="Cover" class="h-full w-full object-cover" />
</div>`,
      },
      { type: 'h2', id: 'font', text: 'Fonts: the biggest silent source of slowness' },
      {
        type: 'p',
        text: 'Loading a full Arabic font in four weights means 4 requests and 400 KB. Three practical fixes:',
      },
      {
        type: 'ul',
        items: [
          'Use `font-display: swap` to avoid invisible text.',
          'Load one weight in the hero, and add the rest only when needed.',
          '`preconnect` to the font server cuts TTFB for the font itself.',
        ],
      },
      { type: 'h2', id: 'measure-real', text: 'Measure on an average device' },
      {
        type: 'p',
        text: 'A Lighthouse run on your own machine lies to you. For honest numbers:',
      },
      {
        type: 'checklist',
        items: [
          'Throttle the network to “Slow 4G” before measuring.',
          'Throttle the CPU by 4×.',
          'Measure in a private window (no extensions).',
          'Repeat the measurement 3 times and take the average.',
          'Test on a real mid-range Android phone if you can.',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `A practical performance budget

< 200KB   initial JavaScript           ✅
< 100KB   initial CSS                  ✅
< 1.4s    LCP on Slow 4G               ✅
< 200ms   INP at 4× CPU throttle       ✅`,
      },
    ],
  'consistent-visual-identity': [
      {
        type: 'p',
        text: 'A first impression is not formed by content but by look. A new visitor sees a single post, so it is hard for them to remember you tomorrow. Identity is what makes them remember.',
      },
      { type: 'h2', id: 'four-elements', text: 'Four elements are enough' },
      {
        type: 'ol',
        items: [
          '**Exactly two colours** — a primary colour to stand out, and a secondary one for contrast. No third. Any more turns the identity into chaos.',
          '**A fixed shape** — sharp, rounded, or hybrid corners. Pick one and keep it on every button and card.',
          '**One typeface** — one font in two weights. Arabic needs a font that handles diacritics properly — never settle for a poor fallback.',
          '**One avatar** — a single icon used everywhere: the profile picture, the avatar, and the watermark on videos.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'The three-second test',
        items: [
          'Line up your last five posts in a row.',
          'Within 3 seconds, do they look like they come from the same person?',
          'If not, the problem is the look, not the content.',
        ],
      },
      { type: 'h2', id: 'contrast', text: 'Contrast is professionalism' },
      {
        type: 'p',
        text: 'Beautiful colours that cannot be read do not deserve to exist. The practical rule: any text smaller than 18px needs a contrast of at least 4.5:1, and large headings are fine at 3:1.',
      },
      {
        type: 'code',
        lang: 'text',
        code: `Measuring contrast by hand

1. Take the text colour and the background colour as hex
2. Compute the relative luminance (L) of each
3. Ratio = (L₁ + 0.05) / (L₂ + 0.05)
4. Result ≥ 4.5 for body text, ≥ 3 for headings

Tip: use color-mix in CSS to tone colours down
instead of hunting for a shade by hand.`,
      },
      { type: 'h2', id: 'motion', text: 'Motion is part of the identity' },
      {
        type: 'p',
        text: 'One distinctive motion does more than ten ordinary transitions. Pick one “rhythm” — one duration, one curve — and apply it across the whole site:',
      },
      {
        type: 'ul',
        items: [
          'Duration: 0.2–0.3 s for interactions, 0.5–0.8 s for entrances.',
          'Curve: a smooth `cubic-bezier(0.16, 1, 0.3, 1)`, or a `spring` for bounces.',
          'Properties: `transform` and `opacity` only — anything else triggers layout on every frame.',
          'Always respect `prefers-reduced-motion`: whoever asks for less motion really needs it.',
        ],
      },
      {
        type: 'quote',
        text: 'Consistency does not mean beauty. Consistency means a visitor knows you after a single post.',
      },
      { type: 'h2', id: 'checklist', text: 'Identity checklist' },
      {
        type: 'checklist',
        items: [
          'Two colours only, no third',
          'One corner radius everywhere',
          'One font in two weights, with proper diacritics support',
          'One recurring icon',
          'Contrast ratio ≥ 4.5 for small text',
          'One transition duration, and motion that respects reduced-motion preferences',
          'The same page on phone and desktop',
        ],
      },
    ],
}
