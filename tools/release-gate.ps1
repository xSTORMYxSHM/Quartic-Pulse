param(
  [switch]$Quick,
  [string]$DesktopExecutablePath = ''
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$electronPath = Join-Path $projectRoot 'node_modules\electron\dist\electron.exe'
$desktopElectronPath = if ($DesktopExecutablePath) {
  (Resolve-Path -LiteralPath $DesktopExecutablePath).Path
} else {
  $electronPath
}
$resultPath = Join-Path ([System.IO.Path]::GetTempPath()) 'quartic-pulse-smoke-result.json'
$nodeCandidates = @(
  (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1),
  (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
  (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
  (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$nodePath = $nodeCandidates | Select-Object -First 1

if (-not (Test-Path -LiteralPath $electronPath)) {
  throw "Electron runtime was not found at $electronPath"
}
if (-not $nodePath) {
  throw 'A Node.js runtime is required for release checks. Install Node.js or run this project through the Codex workspace runtime.'
}

$bundledFfmpeg = Join-Path $projectRoot 'assets\bin\ffmpeg.exe'
if (-not (Test-Path -LiteralPath $bundledFfmpeg)) {
  Write-Host '[PREPARE] Bundled FFmpeg is missing; preparing the pinned release binary.'
  & (Join-Path $PSScriptRoot 'prepare-ffmpeg.ps1')
}

function Invoke-NodeCheck {
  param([string[]]$Arguments, [string]$Label)
  Write-Host "[CHECK] $Label"
  $process = Start-Process -FilePath $nodePath -ArgumentList $Arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "$Label failed with exit code $($process.ExitCode)." }
}

function Invoke-DesktopSmoke {
  param([string[]]$Arguments, [string]$Label)
  Write-Host "[SMOKE] $Label"
  Remove-Item -LiteralPath $resultPath -Force -ErrorAction SilentlyContinue
  $previous = $env:ELECTRON_RUN_AS_NODE
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  try {
    $desktopArguments = if ($DesktopExecutablePath) { @('--smoke-test') + $Arguments } else { @('.', '--smoke-test') + $Arguments }
    $desktopWorkingDirectory = if ($DesktopExecutablePath) { Split-Path -Parent $desktopElectronPath } else { $projectRoot }
    $process = Start-Process -FilePath $desktopElectronPath -ArgumentList $desktopArguments -WorkingDirectory $desktopWorkingDirectory -WindowStyle Hidden -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "$Label failed with exit code $($process.ExitCode)." }
    if (-not (Test-Path -LiteralPath $resultPath)) { throw "$Label did not produce a smoke result." }
    $result = Get-Content -LiteralPath $resultPath -Raw | ConvertFrom-Json
    if (-not $result.ready -or -not $result.webgl2 -or -not $result.controllerModulesReady) {
      throw "$Label returned an incomplete readiness result."
    }
  } finally {
    $env:ELECTRON_RUN_AS_NODE = $previous
  }
}

Invoke-NodeCheck -Arguments @('tools/release-validation.js') -Label 'Release metadata, assets, CSP, licenses, and FFmpeg'
Invoke-NodeCheck -Arguments @('tools/controller-smoke.js') -Label 'Controller and engine unit smoke'
Invoke-NodeCheck -Arguments @('--test', 'tools/report-relay/tests/report-core.test.js') -Label 'Report relay tests'

Invoke-DesktopSmoke -Arguments @('--smoke-tab=music', '--smoke-style=0', '--smoke-synthetic-audio', '--smoke-adaptive-beat') -Label 'Basic music and fractal workflow'
if (-not $Quick) {
  Invoke-DesktopSmoke -Arguments @('--smoke-tab=analysis', '--smoke-style=0', '--smoke-song-map', '--smoke-interface-advanced') -Label 'Song analysis and advanced interface'
  Invoke-DesktopSmoke -Arguments @('--smoke-tab=folding', '--smoke-style=0', '--smoke-dimensional', '--smoke-folding', '--smoke-fold-low', '--smoke-open-advanced') -Label 'Dimensional and folding controls'
  Invoke-DesktopSmoke -Arguments @('--smoke-tab=composer', '--smoke-style=0', '--smoke-composer-workspace', '--smoke-performance-mode') -Label 'Show Composer and performance mode'
  Invoke-DesktopSmoke -Arguments @('--smoke-tab=stream', '--smoke-style=5', '--smoke-obs-output') -Label 'OBS and 3D stream workflow'
  Invoke-DesktopSmoke -Arguments @('--smoke-tab=export', '--smoke-style=0', '--smoke-interface-advanced', '--smoke-av1', '--smoke-auto-gpu', '--smoke-encoder-scan', '--smoke-export-benchmark', '--smoke-export-advisor') -Label 'Offline export pipeline'
  Invoke-DesktopSmoke -Arguments @('--smoke-tab=system', '--smoke-style=1', '--smoke-output-audio', '--smoke-panel-max', '--smoke-open-advanced') -Label 'Audio routing, layout, and performance settings'
  Invoke-DesktopSmoke -Arguments @('--smoke-tab=reports', '--smoke-style=0') -Label 'Report Center'
  Invoke-DesktopSmoke -Arguments @('--smoke-tab=about', '--smoke-style=0') -Label 'About and release identity'
}

Write-Host 'QUARTIC_PULSE_RELEASE_GATE_OK'
