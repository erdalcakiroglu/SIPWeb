param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Quote-PowerShellLiteral {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  return "'" + $Value.Replace("'", "''") + "'"
}

function Start-AppWindow {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "$Name klasoru bulunamadi: $Path"
  }

  if (-not (Test-Path -LiteralPath (Join-Path $Path 'package.json'))) {
    throw "$Name icin package.json bulunamadi: $Path"
  }

  $quotedPath = Quote-PowerShellLiteral -Value $Path
  $command = "Set-Location -LiteralPath $quotedPath; npm.cmd run dev"

  if ($DryRun) {
    Write-Host "[$Name] $command"
    return
  }

  Start-Process -FilePath 'powershell.exe' -WorkingDirectory $Path -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    $command
  ) | Out-Null

  Write-Host "$Name baslatildi -> $Url"
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $root 'frontend'
$backendPath = Join-Path $root 'backend'

if (-not (Get-Command 'npm.cmd' -ErrorAction SilentlyContinue)) {
  throw 'npm.cmd bulunamadi. Node.js ve npm kurulu olmali.'
}

Start-AppWindow -Name 'Frontend' -Path $frontendPath -Url 'http://localhost:3000'
Start-AppWindow -Name 'Backend' -Path $backendPath -Url 'http://localhost:3001'

if (-not $DryRun) {
  Write-Host ''
  Write-Host 'Her iki uygulama ayri PowerShell pencerelerinde calisiyor.'
  Write-Host 'Frontend: http://localhost:3000'
  Write-Host 'Backend : http://localhost:3001'
}
