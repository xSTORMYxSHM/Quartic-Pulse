param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$packageMetadata = Get-Content -Raw -LiteralPath (Join-Path $ProjectRoot 'package.json') | ConvertFrom-Json
$releaseDirectory = Join-Path $ProjectRoot 'release'
$reader = Join-Path $PSScriptRoot 'read-authenticode-signature.ps1'
$signaturePowerShell = @(
  (Get-Command pwsh.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1),
  (Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $signaturePowerShell) { throw 'PowerShell is required for Authenticode verification.' }
if (-not (Test-Path -LiteralPath $reader)) { throw "Authenticode reader not found: $reader" }

$installerName = "Quartic.Pulse.Setup.$($packageMetadata.version).exe"
$portableName = "Quartic.Pulse.Portable.$($packageMetadata.version).exe"
$blockmapName = "$installerName.blockmap"
$updateMetadataName = 'latest.yml'
$packagedExecutable = Join-Path $releaseDirectory 'win-unpacked\Quartic Pulse.exe'
$appUpdatePath = Join-Path $releaseDirectory 'win-unpacked\resources\app-update.yml'
$installerPath = Join-Path $releaseDirectory $installerName
$portablePath = Join-Path $releaseDirectory $portableName
$blockmapPath = Join-Path $releaseDirectory $blockmapName
$updateMetadataPath = Join-Path $releaseDirectory $updateMetadataName
$installer = Get-Item -LiteralPath $installerPath
$portable = Get-Item -LiteralPath $portablePath
$blockmap = Get-Item -LiteralPath $blockmapPath
$updateMetadata = Get-Item -LiteralPath $updateMetadataPath

$signaturePaths = @($packagedExecutable, $installerPath, $portablePath)
$signatures = foreach ($signaturePath in $signaturePaths) {
  $signatureJson = $null
  for ($signatureAttempt = 1; $signatureAttempt -le 2; $signatureAttempt++) {
    $signatureJson = & $signaturePowerShell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $reader -Target $signaturePath
    if ($LASTEXITCODE -eq 0) { break }
    if ($signatureAttempt -lt 2) {
      Write-Warning "Authenticode inspection failed for '$signaturePath'; retrying once."
      Start-Sleep -Seconds 2
    }
  }
  if ($LASTEXITCODE -ne 0) { throw "Authenticode verification process failed for '$signaturePath' after two attempts." }
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

$latestText = Get-Content -Raw -LiteralPath $updateMetadataPath
$appUpdateText = Get-Content -Raw -LiteralPath $appUpdatePath
$expectedVersion = [regex]::Escape([string]$packageMetadata.version)
$expectedInstaller = [regex]::Escape($installerName)
$expectedPublisher = [regex]::Escape($signerSubjects[0])
if ($latestText -notmatch "(?m)^version:\s*$expectedVersion\s*$" -or $latestText -notmatch "(?m)^\s*-?\s*(?:url|path):\s*$expectedInstaller\s*$") {
  throw 'latest.yml does not reference the current version and exact installer filename.'
}
if ($appUpdateText -notmatch '(?m)^publisherName:\s*$' -or $appUpdateText -notmatch $expectedPublisher) {
  throw 'Packaged updater configuration does not contain the verified Authenticode publisher identity.'
}

@(
  "SHA256SUMS-v$($packageMetadata.version).txt"
  "RELEASE_MANIFEST-v$($packageMetadata.version).json"
) | ForEach-Object {
  Remove-Item -LiteralPath (Join-Path $releaseDirectory $_) -Force -ErrorAction SilentlyContinue
}
$installerHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $installerPath).Hash
$portableHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $portablePath).Hash
$blockmapHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $blockmapPath).Hash
$updateMetadataHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $updateMetadataPath).Hash
$checksumPath = Join-Path $releaseDirectory "SHA256SUMS-v$($packageMetadata.version).txt"
@(
  "$installerHash  $installerName"
  "$portableHash  $portableName"
  "$blockmapHash  $blockmapName"
  "$updateMetadataHash  $updateMetadataName"
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
    [ordered]@{ file = $blockmapName; type = 'update-blockmap'; bytes = $blockmap.Length; sha256 = $blockmapHash }
    [ordered]@{ file = $updateMetadataName; type = 'update-metadata'; bytes = $updateMetadata.Length; sha256 = $updateMetadataHash }
  )
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $releaseDirectory "RELEASE_MANIFEST-v$($packageMetadata.version).json") -Encoding utf8
Write-Host 'QUARTIC_PULSE_RELEASE_ARTIFACTS_VERIFIED'
