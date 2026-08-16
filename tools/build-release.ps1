param(
  [switch]$SkipGate,
  [switch]$DirectoryOnly
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$electronPath = Join-Path $projectRoot 'node_modules\electron\dist\electron.exe'
$builderPath = Join-Path $projectRoot 'node_modules\electron-builder\cli.js'
$releaseGate = Join-Path $PSScriptRoot 'release-gate.ps1'
$prepareFfmpeg = Join-Path $PSScriptRoot 'prepare-ffmpeg.ps1'
$nodeCandidates = @(
  (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1),
  (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
  (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
  (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$nodePath = $nodeCandidates | Select-Object -First 1

if (-not (Test-Path -LiteralPath $electronPath)) { throw "Electron runtime not found: $electronPath" }
if (-not (Test-Path -LiteralPath $builderPath)) { throw "electron-builder not found: $builderPath" }
if (-not $nodePath) { throw 'Node.js was not found. Install Node.js or build through the Codex workspace runtime.' }
if (Get-Process -Name 'Quartic Pulse' -ErrorAction SilentlyContinue) {
  throw 'Close every running Quartic Pulse window before building a release.'
}

Push-Location $projectRoot
try {
  & $prepareFfmpeg
  if (-not $SkipGate) { & $releaseGate }

  $builderArguments = if ($DirectoryOnly) {
    @('node_modules/electron-builder/cli.js', '--dir')
  } else {
    @('node_modules/electron-builder/cli.js', '--win', 'nsis', 'portable')
  }
  & $nodePath @builderArguments
  if ($LASTEXITCODE -ne 0) { throw "electron-builder failed with exit code $LASTEXITCODE." }

  $packagedExecutable = Join-Path $projectRoot 'release\win-unpacked\Quartic Pulse.exe'
  if (Test-Path -LiteralPath $packagedExecutable) {
    & $releaseGate -Quick -DesktopExecutablePath $packagedExecutable
  }
} finally {
  Pop-Location
}

Write-Host 'QUARTIC_PULSE_BUILD_OK'
