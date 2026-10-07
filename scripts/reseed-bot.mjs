// Removed from history: this one-off reseed script carried live credentials (a
// Cloudflare token, the platform bot token, and BOTS_KEY). The safe replacement is
// scripts/generate-payload.mjs + deploy-primary.sh — secrets come from the gitignored
// .dev.vars and Cloudflare secrets, never from a committed file.
