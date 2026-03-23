/**
 * Computes SHA-256 of the installer EXE and updates app/download/release.json.
 * Run after placing "SQL Performance Intelligence.exe" in public/downloads/.
 *
 * Usage:
 *   node scripts/compute-sha256.js
 *   node scripts/compute-sha256.js --version 2.4.3 --released 2026-03-15
 *   npm run download:hash
 *   npm run download:hash -- --version 2.4.3 --released 2026-03-15
 *
 * Version and released come from:
 *   - CLI args (--version, --released) if provided
 *   - else existing app/download/release.json
 *   - else defaults below
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && args[i + 1]) { out.version = args[i + 1]; i++ }
    else if (args[i] === '--released' && args[i + 1]) { out.released = args[i + 1]; i++ }
  }
  return out
}

const projectRoot = path.resolve(__dirname, '..')
const exePath = path.join(projectRoot, 'public', 'downloads', 'SQL Performance Intelligence.exe')
const releaseJsonPath = path.join(projectRoot, 'app', 'download', 'release.json')

const cli = parseArgs()
const defaults = { version: '2.4.2', released: '2026-03-08', sha256: '' }

if (!fs.existsSync(exePath)) {
  console.error('Installer not found:', exePath)
  console.error('Place "SQL Performance Intelligence.exe" in public/downloads/ then run this script.')
  process.exit(1)
}

const buffer = fs.readFileSync(exePath)
const hash = crypto.createHash('sha256').update(buffer).digest('hex')

let release = { ...defaults }
if (fs.existsSync(releaseJsonPath)) {
  try {
    release = { ...release, ...JSON.parse(fs.readFileSync(releaseJsonPath, 'utf8')) }
  } catch (_) {}
}
release.sha256 = hash
if (cli.version) release.version = cli.version
if (cli.released) release.released = cli.released

fs.writeFileSync(releaseJsonPath, JSON.stringify(release, null, 2) + '\n', 'utf8')
console.log('Version:', release.version, '| Released:', release.released)
console.log('SHA-256:', hash)
console.log('Updated:', releaseJsonPath)
