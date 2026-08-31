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
$authenticodeReader = Join-Path $PSScriptRoot 'read-authenticode-signature.ps1'
$windowsPowerShellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$nodeCandidates = @(
  (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1),
  (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
  (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
  (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$nodePath = $nodeCandidates | Select-Object -First 1

if (-not (Test-Path -LiteralPath $electronPath)) { throw "Electron runtime not found: $electronPath" }
if (-not (Test-Path -LiteralPath $builderPath)) { throw "electron-builder not found: $builderPath" }
if (-not (Test-Path -LiteralPath $authenticodeReader)) { throw "Authenticode reader not found: $authenticodeReader" }
if (-not (Test-Path -LiteralPath $windowsPowerShellPath)) { throw 'Windows PowerShell is required for Authenticode verification.' }
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
    $releaseDirectory = Join-Path $projectRoot 'release'
    Get-ChildItem -LiteralPath $releaseDirectory -File | Where-Object {
      $_.Name -match '^(?:SHA256SUMS|RELEASE_MANIFEST)-v.+\.(?:txt|json)$'
    } | Remove-Item -Force
    $installerName = "Quartic Pulse Setup $($packageMetadata.version).exe"
    $portableName = "Quartic Pulse $($packageMetadata.version).exe"
    $installerPath = Join-Path $releaseDirectory $installerName
    $portablePath = Join-Path $releaseDirectory $portableName
    $installer = Get-Item -LiteralPath $installerPath
    $portable = Get-Item -LiteralPath $portablePath
    $signaturePaths = @($packagedExecutable, $installerPath, $portablePath)
    $signatures = foreach ($signaturePath in $signaturePaths) {
      $signatureJson = & $windowsPowerShellPath -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $authenticodeReader -Target $signaturePath
      if ($LASTEXITCODE -ne 0) { throw "Authenticode verification process failed for '$signaturePath'." }
      $signature = $signatureJson | ConvertFrom-Json
      if ($signature.status -ne 'Valid') {
        throw "Authenticode verification failed for '$signaturePath': $($signature.status) $($signature.statusMessage)"
      }
      if (-not $signature.signerSubject -or -not $signature.signerThumbprint) { throw "No signer certificate was found for '$signaturePath'." }
      if (-not $signature.timestampSubject) { throw "No timestamp certificate was found for '$signaturePath'." }
      $signature
    }
    $signerSubjects = @($signatures | ForEach-Object { $_.signerSubject } | Sort-Object -Unique)
    $signerThumbprints = @($signatures | ForEach-Object { $_.signerThumbprint } | Sort-Object -Unique)
    if ($signerSubjects.Count -ne 1 -or $signerThumbprints.Count -ne 1) {
      throw 'Quartic Pulse release artifacts were not signed by one consistent certificate.'
    }
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
      channel = $packageMetadata.releaseChannel
      builtOn = (Get-Date).ToString('yyyy-MM-dd')
      platform = 'Windows 11 x64'
      authenticode = [ordered]@{
        status = 'valid'
        publisher = $signerSubjects[0]
        thumbprint = $signerThumbprints[0]
        timestamped = $true
      }
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
