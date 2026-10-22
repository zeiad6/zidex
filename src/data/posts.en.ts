import type { Post } from './posts'

/* ------------------------------------------------------------------ *
 * English edition of the blog. Keyed by slug; only the text fields live
 * here — date, cover, category and heading ids come from posts.ts, so
 * anchors like #get resolve in both languages.
 * ------------------------------------------------------------------ */

export type PostText = Pick<Post, 'title' | 'excerpt' | 'tags' | 'headings'>

export const postsEn: Record<string, PostText> = {
  'zeidex-convert-android': {
    title: 'Zeidex Convert for Android: 100% Offline File Converter, Live Photo Extractor & Media Booster',
    excerpt:
      'A standalone Android app that runs 100% offline: extract Motion Photos and Apple Live Photos to MP4, upscale and boost video/image quality, compress media files, and auto-save neatly to phone storage.',
    tags: ['Android', 'File Converter', 'Motion Photo', 'Live Photo', 'MP4', 'Offline', 'Quality Booster'],
    headings: [{"id":"features","text":"Key features and capabilities","level":2},{"id":"live-photos","text":"Extract Live Photo & Motion Photo videos","level":2},{"id":"screens","text":"App interface and screenshots","level":2},{"id":"enhancer","text":"Video & Image Quality Booster","level":2},{"id":"storage","text":"Organized automatic phone storage","level":2},{"id":"security","text":"100% local privacy and cryptographic signatures","level":2},{"id":"get","text":"Direct download links","level":2}],
  },
  'cloudcli-setup-guide': {
    title: 'The complete guide: installing CloudCLI and wiring OpenCode, Codex, and Claude Code to it',
    excerpt:
      'CloudCLI as the hub for three coding agents: installing it, connecting Claude Code, Codex, and OpenCode, then skills, agents, MCP servers, and plugins — documented from a real setup running on arm64 inside PRoot.',
    tags: ['CloudCLI', 'Claude Code', 'Codex', 'OpenCode', 'MCP'],
    headings: [{"id":"roadmap","text":"The roadmap: what we built","level":2},{"id":"install","text":"Part one: installing CloudCLI","level":2},{"id":"what-is-cloudcli","text":"What is CloudCLI?","level":3},{"id":"install-steps","text":"Installation steps","level":3},{"id":"run","text":"Running it","level":3},{"id":"connect","text":"Part two: connecting the three agents","level":2},{"id":"connect-claude","text":"Connection one: Claude Code — driven directly by CloudCLI","level":3},{"id":"connect-codex","text":"Connection two: Codex — consumes browser-use from CloudCLI over MCP","level":3},{"id":"connect-opencode","text":"Connection three: OpenCode — OpenRouter for models + browser-use from CloudCLI","level":3},{"id":"compare","text":"Quick comparison","level":3},{"id":"skills","text":"Part three: skills","level":2},{"id":"what-is-skill","text":"What is a skill?","level":3},{"id":"key-skills","text":"The key skills used here","level":3},{"id":"add-skill","text":"How to add a new skill","level":3},{"id":"agents","text":"Part four: agents","level":2},{"id":"skill-vs-agent","text":"Skill versus agent","level":3},{"id":"agents-inventory","text":"What we actually have","level":3},{"id":"add-agent","text":"How to add an agent","level":3},{"id":"mcp","text":"Part five: MCP servers","level":2},{"id":"what-is-mcp","text":"What is MCP?","level":3},{"id":"mcp-inventory","text":"The MCP servers used here","level":3},{"id":"add-mcp","text":"How to add an MCP server","level":3},{"id":"plugins","text":"Part six: extensions, plugins, and commands","level":2},{"id":"claude-plugins","text":"Claude Code plugins (marketplaces)","level":3},{"id":"opencode-plugins","text":"Global OpenCode plugins","level":3},{"id":"opencode-commands","text":"Ready-made OpenCode commands (21)","level":3},{"id":"ops","text":"Part seven: operational tips from the field","level":2},{"id":"proot-socket","text":"Cross-session messaging in PRoot","level":3},{"id":"openrouter-402","text":"Claude Code getting routed to OpenRouter","level":3},{"id":"keys","text":"Handling keys safely","level":3},{"id":"maintenance","text":"Maintenance habits","level":3},{"id":"checklist","text":"Final checklist","level":2}],

  },

  'edms-archive-pro': {
    title: 'Archive Pro EDMS: an electronic document management system',
    excerpt:
      'An electronic archiving system that runs as a central server: full-text search, immutable versions, workflows and approvals, Ed25519 signatures, DLP, and legal hold — with a free download.',
    tags: ['EDMS', 'Archiving', 'SQLite', 'Security', 'OCR'],
    headings: [{"id":"architecture","text":"Runtime architecture","level":2},{"id":"search","text":"Search and indexing","level":2},{"id":"documents","text":"Documents and versions","level":2},{"id":"versions","text":"An immutable version history","level":3},{"id":"workflow","text":"Approvals and workflows","level":2},{"id":"security","text":"Security and identity","level":2},{"id":"signature","text":"Cryptographic signatures","level":2},{"id":"dlp","text":"DLP and data-leak prevention","level":2},{"id":"retention","text":"Retention and legal hold","level":2},{"id":"backup","text":"Backup and restore","level":2},{"id":"ops","text":"Operations and monitoring","level":2},{"id":"results","text":"Verification results","level":2},{"id":"unsigned","text":"Before you install","level":2},{"id":"get","text":"Download","level":2}],

  },

  'google-antigravity-on-ubuntu': {
    title: 'Installing Google Antigravity on Ubuntu: from zero to a working setup',
    excerpt:
      'Five steps to turn Ubuntu into a complete development environment for Google Antigravity — with the backend server, the web UI, the Python SDK, and the everyday commands.',
    tags: ['Antigravity', 'Ubuntu', 'tmux', 'Python', 'MCP'],
    headings: [{"id":"prereq","text":"Step zero — base packages","level":2},{"id":"engine","text":"Step 1 — install the Antigravity engine","level":2},{"id":"sdk","text":"Step 2 — the Python SDK in an isolated environment","level":2},{"id":"web-ui","text":"Step 3 — start the web UI","level":2},{"id":"login","text":"Sign-in and activation","level":3},{"id":"ide","text":"Step 4 — the full IDE","level":2},{"id":"first-run","text":"First run — sign-in steps","level":3},{"id":"stop-web","text":"Stopping the web UI","level":3},{"id":"daily","text":"Everyday commands","level":2},{"id":"troubleshoot","text":"Common problems","level":2}],

  },
  'opencode-tooling-guide': {
    title: 'Tools for building a site from scratch: what I actually used with OpenCode',
    excerpt:
      'Eight agents, four skills, and eight MCP servers — how each one works, when I called it, and the mistakes that cost me time. With a table that works as a reference.',
    tags: ['OpenCode', 'MCP', 'Agents', 'Skills', 'Tools'],
    headings: [{"id":"agents","text":"Agents: minds with a clean context","level":2},{"id":"reviewer-lesson","text":"The power of a review is in the request, not the agent","level":3},{"id":"mcp-idle","text":"The biggest lesson: keep MCP servers off by default","level":2},{"id":"skills","text":"Skills: instructions loaded on demand","level":2},{"id":"errors-found","text":"Three real bugs the review caught","level":2},{"id":"npm-trap","text":"The trap that never throws an error","level":2},{"id":"security","text":"Security and privacy in the build","level":2},{"id":"lessons","text":"Lessons from the real deploy","level":2},{"id":"lesson-401","text":"401 on everything after deploying","level":3},{"id":"lesson-domain","text":"A globally reserved subdomain","level":3},{"id":"checklist","text":"Final checklist","level":2},{"id":"adapters","text":"What fits you","level":2}],

  },
  'edms-archive-android': {
    title: 'Archive Pro on Android — the same system on your phone',
    excerpt:
      'The native Android client for Archive Pro: runs fully on-device with a local database and file store, or pairs with the desktop build over a certificate-pinned HTTPS gateway. Database, backup and passwords move both ways with no conversion.',
    tags: ['Android', 'Kotlin', 'Archive Pro', 'EDMS'],
    headings: [{"id":"two-modes","text":"Two ways to run it","level":2},{"id":"compatibility","text":"Compatibility with the desktop","level":2},{"id":"trust","text":"Trust model","level":2},{"id":"tests","text":"Test results","level":2},{"id":"limits","text":"What you should know","level":2}],
  },
  'ai-fake-detector-android': {
    title: 'VerityScope v0.4.0 — AI Deepfake Detector for Android',
    excerpt:
      'An Android app that detects deepfakes in images, video, text and audio using 5 on-device AI models + digital forensic algorithms (ELA, FFT, noise, spectral) — v0.4.0 adds image forensics engine, 8 audio signals, and 13 text signals.',
    tags: ['Android', 'Kotlin', 'ONNX', 'Deepfake', 'AI', 'Forensics'],
    headings: [{"id":"how-it-works","text":"How it works","level":2},{"id":"models","text":"Available models","level":2},{"id":"metadata","text":"Source-metadata forensics","level":2},{"id":"screens","text":"The interface","level":2},{"id":"limits","text":"Limits you should know","level":2}],
  },
  'docker-on-android-termux': {
    title: 'Running Docker on Android with Termux — a practical guide',
    excerpt:
      'A tested guide to running a full Docker engine on an Android phone without root, through a lightweight Alpine virtual machine inside Termux. Every command comes with a copy button.',
    tags: ['Docker', 'Termux', 'Android', 'QEMU', 'Alpine'],
    headings: [{"id":"prereq","text":"Before you start: what you need","level":2},{"id":"step-1","text":"Step 1 — install the base packages in Termux","level":2},{"id":"step-2","text":"Step 2 — create a work folder and download Alpine","level":2},{"id":"step-3","text":"Step 3 — boot the virtual machine for the first time","level":2},{"id":"step-4","text":"Step 4 — enable networking and repositories","level":2},{"id":"step-5","text":"Step 5 — install and start Docker","level":2},{"id":"step-6","text":"Step 6 — test the engine","level":2},{"id":"ports","text":"Managing ports: publishing a web app","level":2},{"id":"shutdown","text":"Shutting down safely","level":2},{"id":"ssh","text":"Using SSH instead of typing commands by hand","level":2}],

  },
  'first-30-seconds': {
    title: 'The first 30 seconds: how viewers decide to stay or swipe',
    excerpt:
      'A short video is not decided in the first 30 seconds — it is decided in the first two frames. A practical guide to building a hook that stops the scroll without shouting.',
    tags: ['Hook', 'Retention', 'Editing'],
    headings: [{"id":"the-3-questions","text":"The three questions your opening shot answers","level":2},{"id":"hook-types","text":"Five kinds of hook, each with its place","level":2},{"id":"audio","text":"Sound before picture","level":2},{"id":"measure","text":"How to tell the hook worked","level":2},{"id":"checklist","text":"Pre-publish checklist","level":2}],

  },

  'tiktok-algorithm-2026': {
    title: 'How TikTok distributes videos in 2026',
    excerpt:
      'The system no longer shows your videos to followers first. A simple explanation of the four distribution stages, and why a video can blow up with zero followers.',
    tags: ['Algorithm', 'Distribution', 'Growth'],
    headings: [{"id":"four-stages","text":"The four distribution stages","level":2},{"id":"signals-ranked","text":"Signals ranked by impact","level":2},{"id":"cadence","text":"Timing and posting cadence","level":2},{"id":"what-to-do","text":"What to do tomorrow","level":2}],

  },
  'dark-mode-that-works': {
    title: 'A dark mode that does not hurt your eyes',
    excerpt:
      'Most dark modes fail by using pure black and pure white. Here are the right numbers, the contrast rules, and the role of tokens — and why they are the fix.',
    tags: ['Design', 'Colour', 'tokens'],
    headings: [{"id":"the-problem","text":"Why pure black is the enemy of reading","level":2},{"id":"tokens","text":"A token system: one layer changes, nothing else is touched","level":2},{"id":"anti-flicker","text":"Preventing the flash on load","level":2},{"id":"images","text":"Images and icons do not follow the mode on their own","level":2},{"id":"respect-preference","text":"Respecting the system preference","level":2}],

  },

  'link-hub-that-converts': {
    title: 'A links page that turns visitors into followers',
    excerpt:
      'A links page is not a list of links. It is a storefront. Link order, load speed, and click measurement — three decisions separate a page that works from one that is just a table.',
    tags: ['Links', 'Conversion', 'UX'],
    headings: [{"id":"hierarchy","text":"Hierarchy before styling","level":2},{"id":"card-design","text":"A card needs more than a link","level":2},{"id":"friction","text":"Friction kills conversion","level":2},{"id":"measure","text":"What to measure","level":2},{"id":"checklist","text":"Checklist","level":2}],

  },

  'mobile-first-performance': {
    title: 'Mobile page performance: what actually gets measured',
    excerpt:
      'LCP alone is not enough. The real performance metrics that lift conversion on a slow network, and how to measure them on an average device — not a fast laptop.',
    tags: ['Performance', 'Mobile', 'CWV'],
    headings: [{"id":"metrics","text":"The four metrics that matter","level":2},{"id":"cls","text":"CLS: the mistake beginners make most","level":2},{"id":"font","text":"Fonts: the biggest silent source of slowness","level":2},{"id":"measure-real","text":"Measure on an average device","level":2}],

  },

  'consistent-visual-identity': {
    title: 'A visual identity you build once and use for years',
    excerpt:
      'Most accounts die visually not because the content is bad, but because they change their colours every month. A four-part system is enough to build a stable identity.',
    tags: ['Identity', 'Colour', 'Consistency'],
    headings: [{"id":"four-elements","text":"Four elements are enough","level":2},{"id":"contrast","text":"Contrast is professionalism","level":2},{"id":"motion","text":"Motion is part of the identity","level":2},{"id":"checklist","text":"Identity checklist","level":2}],

  },
}
