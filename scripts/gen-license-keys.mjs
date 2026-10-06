#!/usr/bin/env node
// Generate the Pro licensing keypair and provision the Worker secrets.
//
//   node scripts/gen-license-keys.mjs            # generate a keypair, print the public key
//   node scripts/gen-license-keys.mjs --env      # print the exact wrangler commands to run
//
// The Ed25519 PRIVATE key signs license files and must only ever exist as a Worker secret. It is
// written to .dev.vars (gitignored) and never printed in full. Losing it means every already-issued
// license stays valid (the app carries the public key) but no NEW license can be signed — so back
// the value up somewhere you would actually find it.
import { createPrivateKey, createPublicKey, generateKeyPairSync } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const DEV_VARS = '.dev.vars'

function generate() {
  const { privateKey } = generateKeyPairSync('ed25519')
  const pkcs8 = privateKey.export({ format: 'der', type: 'pkcs8' })
  const jwk = createPublicKey(privateKey).export({ format: 'jwk' })
  // Ed25519 public keys are exactly 32 raw bytes; the last 32 bytes of the SPKI DER are exactly
  // that, but the JWK `x` member is the unambiguous source.
  const pub = Buffer.from(jwk.x, 'base64url')
  if (pub.length !== 32) throw new Error(`expected a 32-byte Ed25519 public key, got ${pub.length}`)
  void createPublicKey
  return { priv: pkcs8.toString('base64url'), pub: pub.toString('base64url') }
}

function putInDevVars(name, value) {
  if (!existsSync(DEV_VARS)) {
    writeFileSync(DEV_VARS, `# ${name}=${value}\n`)
    return 'created'
  }
  const text = readFileSync(DEV_VARS, 'utf8')
  const line = `${name}=${value}`
  const re = new RegExp(`^${name}=.*$`, 'm')
  const next = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
  writeFileSync(DEV_VARS, next)
  return re.test(text) ? 'replaced' : 'appended'
}

const { priv, pub } = generate()
const kid = process.argv.includes('--kid')
  ? process.argv[process.argv.indexOf('--kid') + 1]
  : `pro-${new Date().toISOString().slice(0, 10)}`

console.log(`key id (LICENSE_KID): ${kid}`)
console.log(`public key (embed in the APK, LICENSE_PUBLIC_KEY):\n  ${pub}`)
console.log(`\nprivate key fingerprint: ${createPublicKey(createPrivateKey({ key: Buffer.from(priv, 'base64url'), format: 'der', type: 'pkcs8' })).export({ format: 'jwk' }).x.slice(0, 16)}…`)

for (const [k, v] of [['LICENSE_SIGNING_KEY', priv], ['LICENSE_PUBLIC_KEY', pub], ['LICENSE_KID', kid]]) {
  console.log(`  ${DEV_VARS}: ${putInDevVars(k, v)} ${k}`)
}

if (process.argv.includes('--env')) {
  console.log(`
Then publish the secrets (the private key is only ever a secret, never a [vars] entry):

  npx wrangler secret put LICENSE_SIGNING_KEY
  npx wrangler secret put LICENSE_PUBLIC_KEY
  npx wrangler secret put LICENSE_KID
  npx wrangler secret put LICENSE_ADMIN_TOKEN
`)
}

// Guard against the classic mistake: the signing key must never be a plain [vars] entry in
// wrangler.toml, which is committed. This is a one-line scan, and it is worth one.
const toml = readFileSync('wrangler.toml', 'utf8')
if (/^LICENSE_SIGNING_KEY\s*=/m.test(toml)) {
  console.error('\n✗ wrangler.toml contains LICENSE_SIGNING_KEY in the clear. Move it to `wrangler secret put`.')
  process.exit(1)
}
console.log('\n✓ the private key is not in wrangler.toml')
void readFileSync