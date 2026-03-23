import fs from 'node:fs'
import path from 'node:path'

const packagePath = path.join(__dirname, '..', '..', 'package.json')

export function getVersionInfo() {
  try {
    const raw = fs.readFileSync(packagePath, 'utf8')
    const pkg = JSON.parse(raw) as { version?: string; name?: string }
    return {
      version: pkg.version || '0.0.0',
      name: pkg.name || 'backend',
      productName: 'SQL Performance Intelligence™',
      website: 'https://sqlperformance.ai',
    }
  } catch {
    return {
      version: '0.0.0',
      name: 'backend',
      productName: 'SQL Performance Intelligence™',
      website: 'https://sqlperformance.ai',
    }
  }
}
