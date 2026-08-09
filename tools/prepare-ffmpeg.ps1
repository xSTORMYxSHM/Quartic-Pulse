$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$targetDirectory = Join-Path $projectRoot 'assets\bin'
$targetExecutable = Join-Path $targetDirectory 'ffmpeg.exe'
$ffmpegCommand = Get-Command ffmpeg.exe -ErrorAction SilentlyContinue
$ffmpegSource = $null

if (Test-Path -LiteralPath $targetExecutable) {
  $localVersionLine = & $targetExecutable -version 2>&1 | Select-Object -First 1
  if ($localVersionLine -match '^ffmpeg version\s+(\d+\.\d+(?:\.\d+)?)' -and [version]$Matches[1] -ge [version]'8.1.2') {
    $ffmpegSource = $targetExecutable
  }
}

if (-not $ffmpegSource -and $ffmpegCommand) {
  $ffmpegSource = $ffmpegCommand.Source
}

if (-not $ffmpegSource) {
  throw 'FFmpeg was not found. Install a 64-bit Windows FFmpeg build, add its bin folder to PATH, then run npm run bundle:ffmpeg again.'
}

$versionLine = & $ffmpegSource -version 2>&1 | Select-Object -First 1
if ($versionLine -notmatch '^ffmpeg version\s+(\d+\.\d+(?:\.\d+)?)') {
  throw "Unable to verify a stable FFmpeg release version from: $versionLine"
}

$ffmpegVersion = [version]$Matches[1]
if ($ffmpegVersion -lt [version]'8.1.2') {
  throw "FFmpeg $ffmpegVersion is below the security baseline of 8.1.2. Update FFmpeg before packaging Quartic Pulse."
}

$savedErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$buildConfiguration = ((& $ffmpegSource -buildconf 2>&1) | ForEach-Object { "$_" }) -join "`n"
$ErrorActionPreference = $savedErrorActionPreference
if ($buildConfiguration -match '--enable-nonfree') {
  throw 'This FFmpeg build enables nonfree components and cannot be redistributed with Quartic Pulse.'
}
if ($buildConfiguration -notmatch '--enable-gpl') {
  throw 'Quartic Pulse release packaging currently expects a GPL-enabled FFmpeg build and its matching GPL notices.'
}

New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
if ([IO.Path]::GetFullPath($ffmpegSource) -ne [IO.Path]::GetFullPath($targetExecutable)) {
  Copy-Item -LiteralPath $ffmpegSource -Destination $targetExecutable -Force
}

$usingBundledBinary = [IO.Path]::GetFullPath($ffmpegSource) -eq [IO.Path]::GetFullPath($targetExecutable)
if ($usingBundledBinary) {
  $licenseSource = Join-Path $targetDirectory 'FFmpeg-LICENSE.txt'
  $readmeSource = Join-Path $targetDirectory 'FFmpeg-README.txt'
} else {
  $distributionRoot = Split-Path -Parent (Split-Path -Parent $ffmpegSource)
  $licenseSource = Join-Path $distributionRoot 'LICENSE'
  $readmeSource = Join-Path $distributionRoot 'README.txt'
}
if (-not (Test-Path -LiteralPath $licenseSource)) {
  throw "The FFmpeg distribution license was not found at $licenseSource. Use a complete redistributable FFmpeg package."
}
if (-not (Test-Path -LiteralPath $readmeSource)) {
  throw "The FFmpeg distribution README was not found at $readmeSource. Use a complete redistributable FFmpeg package."
}

if (-not $usingBundledBinary) {
  Copy-Item -LiteralPath $licenseSource -Destination (Join-Path $targetDirectory 'FFmpeg-LICENSE.txt') -Force
  Copy-Item -LiteralPath $readmeSource -Destination (Join-Path $targetDirectory 'FFmpeg-README.txt') -Force
}

$sourceNotice = Join-Path $targetDirectory 'FFmpeg-SOURCE.txt'
if (-not (Test-Path -LiteralPath $sourceNotice)) {
  throw "The FFmpeg corresponding-source notice is missing at $sourceNotice."
}

$sizeMb = [math]::Round((Get-Item -LiteralPath $targetExecutable).Length / 1MB, 1)
Write-Host "Bundled $versionLine ($sizeMb MB)"
