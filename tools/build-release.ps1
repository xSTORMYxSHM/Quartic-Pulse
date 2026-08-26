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
  $builderExitCode = 1
  for ($builderAttempt = 1; $builderAttempt -le 2; $builderAttempt++) {
    & $nodePath @builderArguments
    $builderExitCode = $LASTEXITCODE
    if ($builderExitCode -eq 0) { break }
    if ($builderAttempt -lt 2) {
      Write-Warning "electron-builder failed with exit code $builderExitCode; retrying once after transient file locks clear."
      Start-Sleep -Seconds 2
    }
  }
  if ($builderExitCode -ne 0) { throw "electron-builder failed with exit code $builderExitCode after two attempts." }

  $packagedExecutable = Join-Path $projectRoot 'release\win-unpacked\Quartic Pulse.exe'
  if (Test-Path -LiteralPath $packagedExecutable) {
    & $releaseGate -Quick -DesktopExecutablePath $packagedExecutable
  }
  if (-not $DirectoryOnly) {
    $packageMetadata = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'package.json') | ConvertFrom-Json
    $appMetadataText = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'src\shared\app-metadata.js')
    $channelMatch = [regex]::Match($appMetadataText, "releaseChannel:\s*'([^']+)'")
    if (-not $channelMatch.Success) { throw 'Release channel was not found in shared application metadata.' }
    $releaseChannel = $channelMatch.Groups[1].Value
    $releaseDirectory = Join-Path $projectRoot 'release'
    $installerName = "Quartic Pulse Setup $($packageMetadata.version).exe"
    $portableName = "Quartic Pulse $($packageMetadata.version).exe"
    $installerPath = Join-Path $releaseDirectory $installerName
    $portablePath = Join-Path $releaseDirectory $portableName
    $installer = Get-Item -LiteralPath $installerPath
    $portable = Get-Item -LiteralPath $portablePath
    $installerHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $installerPath).Hash
    $portableHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $portablePath).Hash
    $checksumPath = Join-Path $releaseDirectory "SHA256SUMS-v$($packageMetadata.version).txt"
    @(
      "$installerHash  $installerName"
      "$portableHash  $portableName"
    ) | Set-Content -LiteralPath $checksumPath -Encoding utf8
    $manifest = [ordered]@{
      application = 'Quartic Pulse'
      version = $packageMetadata.version
      channel = $releaseChannel
      builtOn = (Get-Date).ToString('yyyy-MM-dd')
      platform = 'Windows 11 x64'
      authenticode = 'not-signed'
      artifacts = @(
        [ordered]@{ file = $installerName; type = 'customizable-nsis-installer'; bytes = $installer.Length; sha256 = $installerHash }
        [ordered]@{ file = $portableName; type = 'portable-executable'; bytes = $portable.Length; sha256 = $portableHash }
      )
    }
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $releaseDirectory "RELEASE_MANIFEST-v$($packageMetadata.version).json") -Encoding utf8
  }
} finally {
  Pop-Location
}

Write-Host 'QUARTIC_PULSE_BUILD_OK'
