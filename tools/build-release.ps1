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
$finalizeRelease = Join-Path $PSScriptRoot 'finalize-release.ps1'
$nodeCandidates = @(
  (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1),
  (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
  (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
  (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$nodePath = $nodeCandidates | Select-Object -First 1

if (-not (Test-Path -LiteralPath $electronPath)) { throw "Electron runtime not found: $electronPath" }
if (-not (Test-Path -LiteralPath $builderPath)) { throw "electron-builder not found: $builderPath" }
if (-not (Test-Path -LiteralPath $finalizeRelease)) { throw "Release finalizer not found: $finalizeRelease" }
if (-not $nodePath) { throw 'Node.js was not found. Install Node.js or build through the Codex workspace runtime.' }
if (Get-Process -Name 'Quartic Pulse' -ErrorAction SilentlyContinue) {
  throw 'Close every running Quartic Pulse window before building a release.'
}

if (-not $DirectoryOnly) {
  $tenantId = 'f4276e67-236b-451e-b6a9-58f15b25ad64'
  $subscriptionId = '1aa73664-b888-4080-92d0-00975865a185'
  $documentsDirectory = [Environment]::GetFolderPath('MyDocuments')
  $powerShellModuleRoot = Join-Path $documentsDirectory 'PowerShell\Modules'
  if ((Test-Path -LiteralPath $powerShellModuleRoot) -and (($env:PSModulePath -split ';') -notcontains $powerShellModuleRoot)) {
    $env:PSModulePath = "$powerShellModuleRoot;$env:PSModulePath"
  }
  Import-Module Az.Accounts -ErrorAction Stop
  $context = Get-AzContext
  if (-not $context -or $context.Subscription.Id -ne $subscriptionId -or $context.Tenant.Id -ne $tenantId) {
    $null = Connect-AzAccount -Tenant $tenantId -Subscription $subscriptionId
  }
  $null = Get-AzAccessToken -ResourceUrl 'https://codesigning.azure.net' -ErrorAction Stop

  Remove-Item Env:AZURE_CLIENT_ID, Env:AZURE_CLIENT_SECRET -ErrorAction SilentlyContinue
  $env:WINDOWS_SIGNING_PUBLISHER = 'CN=Garner Whitted, O=Garner Whitted, L=Seattle, S=wa, C=US'
  $env:AZURE_TRUSTED_SIGNING_ENDPOINT = 'https://wus2.codesigning.azure.net/'
  $env:AZURE_TRUSTED_SIGNING_ACCOUNT = 'Tempest'
  $env:AZURE_TRUSTED_SIGNING_PROFILE = 'TempestSoftwarePublic'

  $dotnetPath = Join-Path $env:ProgramFiles 'dotnet\dotnet.exe'
  if (-not (Test-Path -LiteralPath $dotnetPath)) { throw 'The .NET SDK was not found.' }
  $dotnetDirectory = Split-Path -Parent $dotnetPath
  if (($env:Path -split ';') -notcontains $dotnetDirectory) { $env:Path = "$dotnetDirectory;$env:Path" }
}

Push-Location $projectRoot
try {
  & $prepareFfmpeg
  if (-not $SkipGate) { & $releaseGate }

  $builderArguments = if ($DirectoryOnly) {
    @('node_modules/electron-builder/cli.js', '--dir')
  } else {
    @(
      'node_modules/electron-builder/cli.js',
      '--win', 'nsis', 'portable',
      '--config', 'tools/electron-builder.signed.cjs',
      '--config.forceCodeSigning=true'
    )
  }
  $builderExitCode = 1
  for ($builderAttempt = 1; $builderAttempt -le 3; $builderAttempt++) {
    & $nodePath @builderArguments
    $builderExitCode = $LASTEXITCODE
    if ($builderExitCode -eq 0) { break }
    if ($builderAttempt -lt 3) {
      Write-Warning "electron-builder failed with exit code $builderExitCode; retrying after transient signing or file-lock failures clear."
      Start-Sleep -Seconds (2 * $builderAttempt)
    }
  }
  if ($builderExitCode -ne 0) { throw "electron-builder failed with exit code $builderExitCode after three attempts." }

  $packagedExecutable = Join-Path $projectRoot 'release\win-unpacked\Quartic Pulse.exe'
  if (Test-Path -LiteralPath $packagedExecutable) {
    & $releaseGate -Quick -DesktopExecutablePath $packagedExecutable
  }
  if (-not $DirectoryOnly) {
    & $finalizeRelease -ProjectRoot $projectRoot
  }
} finally {
  Pop-Location
}

Write-Host 'QUARTIC_PULSE_BUILD_OK'
