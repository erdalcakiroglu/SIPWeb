[CmdletBinding()]
param(
  [string]$ProjectRoot,
  [string]$OutputRoot,
  [string]$ReleaseName = ("spstudio-" + (Get-Date -Format "yyyyMMdd-HHmmss")),
  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$NoZip,
  [string]$DeployPath,
  [switch]$RestartService,
  [string]$ServiceName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDirectory = Split-Path -Parent $PSCommandPath
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = Join-Path $scriptDirectory ".."
}
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $scriptDirectory "..\\dist-packages"
}

function Assert-CommandExists {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found in PATH."
  }
}

function Invoke-ExternalCommand {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory
  )

  Write-Host ">> $FilePath $($Arguments -join ' ')" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
  }
  finally {
    Pop-Location
  }
}

function Copy-DirectoryWithRobocopy {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination,
    [switch]$Mirror
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    throw "Source path not found: $Source"
  }

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null

  $args = @($Source, $Destination)
  if ($Mirror) {
    $args += "/MIR"
  }
  else {
    $args += "/E"
  }
  $args += @("/R:2", "/W:2", "/NFL", "/NDL", "/NJH", "/NJS", "/NP")

  & robocopy @args | Out-Null
  $code = $LASTEXITCODE
  if ($code -ge 8) {
    throw "Robocopy failed with exit code $code while copying '$Source' to '$Destination'."
  }
}

function Resolve-UserPath {
  param(
    [Parameter(Mandatory = $true)][string]$InputPath,
    [Parameter(Mandatory = $true)][string]$BasePath
  )

  if ([System.IO.Path]::IsPathRooted($InputPath)) {
    return [System.IO.Path]::GetFullPath($InputPath)
  }

  return [System.IO.Path]::GetFullPath((Join-Path $BasePath $InputPath))
}

Assert-CommandExists -Name "npm"
Assert-CommandExists -Name "robocopy"

$resolvedProjectRoot = (Resolve-Path -Path $ProjectRoot).Path
$resolvedOutputRoot = Resolve-UserPath -InputPath $OutputRoot -BasePath $resolvedProjectRoot

if ($RestartService -and [string]::IsNullOrWhiteSpace($ServiceName)) {
  throw "When -RestartService is used, -ServiceName is required."
}

Write-Host "ProjectRoot : $resolvedProjectRoot" -ForegroundColor Yellow
Write-Host "OutputRoot  : $resolvedOutputRoot" -ForegroundColor Yellow
Write-Host "ReleaseName : $ReleaseName" -ForegroundColor Yellow

if (-not $SkipInstall) {
  Invoke-ExternalCommand -FilePath "npm" -Arguments @("ci") -WorkingDirectory $resolvedProjectRoot
}
else {
  Write-Host "Skipping npm ci (SkipInstall=true)." -ForegroundColor DarkYellow
}

if (-not $SkipBuild) {
  Invoke-ExternalCommand -FilePath "npm" -Arguments @("run", "build") -WorkingDirectory $resolvedProjectRoot
}
else {
  Write-Host "Skipping npm run build (SkipBuild=true)." -ForegroundColor DarkYellow
}

$standaloneSource = Join-Path $resolvedProjectRoot ".next\\standalone"
$staticSource = Join-Path $resolvedProjectRoot ".next\\static"
$publicSource = Join-Path $resolvedProjectRoot "public"

if (-not (Test-Path -LiteralPath $standaloneSource)) {
  throw "Standalone output not found: $standaloneSource. Run a successful build first."
}
if (-not (Test-Path -LiteralPath $staticSource)) {
  throw "Static output not found: $staticSource. Run a successful build first."
}
if (-not (Test-Path -LiteralPath $publicSource)) {
  throw "Public folder not found: $publicSource."
}

New-Item -ItemType Directory -Force -Path $resolvedOutputRoot | Out-Null

$stagingPath = Join-Path $resolvedOutputRoot $ReleaseName
$zipPath = Join-Path $resolvedOutputRoot ($ReleaseName + ".zip")

if (Test-Path -LiteralPath $stagingPath) {
  Remove-Item -LiteralPath $stagingPath -Recurse -Force
}
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Write-Host "Staging release..." -ForegroundColor Green
Copy-DirectoryWithRobocopy -Source $standaloneSource -Destination $stagingPath
Copy-DirectoryWithRobocopy -Source $publicSource -Destination (Join-Path $stagingPath "public")
Copy-DirectoryWithRobocopy -Source $staticSource -Destination (Join-Path $stagingPath ".next\\static")

$serverJsPath = Join-Path $stagingPath "server.js"
if (-not (Test-Path -LiteralPath $serverJsPath)) {
  throw "Release package is invalid. server.js not found at: $serverJsPath"
}

if (-not $NoZip) {
  Write-Host "Creating zip package..." -ForegroundColor Green
  Compress-Archive -Path (Join-Path $stagingPath "*") -DestinationPath $zipPath -CompressionLevel Optimal
}
else {
  Write-Host "Skipping zip creation (NoZip=true)." -ForegroundColor DarkYellow
}

if (-not [string]::IsNullOrWhiteSpace($DeployPath)) {
  $resolvedDeployPath = Resolve-UserPath -InputPath $DeployPath -BasePath $resolvedProjectRoot
  Write-Host "Deploying to: $resolvedDeployPath" -ForegroundColor Green
  Copy-DirectoryWithRobocopy -Source $stagingPath -Destination $resolvedDeployPath -Mirror
}

if ($RestartService) {
  Write-Host "Restarting service: $ServiceName" -ForegroundColor Green
  Restart-Service -Name $ServiceName -Force
}

Write-Host ""
Write-Host "Release completed." -ForegroundColor Green
Write-Host "Staging Folder: $stagingPath"
if (-not $NoZip) {
  Write-Host "Zip File      : $zipPath"
}
if (-not [string]::IsNullOrWhiteSpace($DeployPath)) {
  Write-Host "Deploy Target : $resolvedDeployPath"
}
