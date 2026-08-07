$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$targetDirectory = Join-Path $projectRoot 'assets\bin'
$targetExecutable = Join-Path $targetDirectory 'ffmpeg.exe'
$ffmpegCommand = Get-Command ffmpeg.exe -ErrorAction SilentlyContinue

if (-not $ffmpegCommand) {
  throw 'FFmpeg was not found. Install a 64-bit Windows FFmpeg build, add its bin folder to PATH, then run npm run bundle:ffmpeg again.'
}

New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
Copy-Item -LiteralPath $ffmpegCommand.Source -Destination $targetExecutable -Force

$distributionRoot = Split-Path -Parent (Split-Path -Parent $ffmpegCommand.Source)
$licenseSource = Join-Path $distributionRoot 'LICENSE'
$readmeSource = Join-Path $distributionRoot 'README.txt'
if (Test-Path -LiteralPath $licenseSource) {
  Copy-Item -LiteralPath $licenseSource -Destination (Join-Path $targetDirectory 'FFmpeg-LICENSE.txt') -Force
}
if (Test-Path -LiteralPath $readmeSource) {
  Copy-Item -LiteralPath $readmeSource -Destination (Join-Path $targetDirectory 'FFmpeg-README.txt') -Force
}

$versionLine = & $targetExecutable -version 2>&1 | Select-Object -First 1
$sizeMb = [math]::Round((Get-Item -LiteralPath $targetExecutable).Length / 1MB, 1)
Write-Host "Bundled $versionLine ($sizeMb MB)"
