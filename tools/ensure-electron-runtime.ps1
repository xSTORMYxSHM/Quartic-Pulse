$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
$pnpmRuntimeNode = if ($pnpmCommand) {
  Join-Path (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $pnpmCommand.Source))) 'node\bin\node.exe'
}
$nodeCandidates = @(
  (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1),
  (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
  (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
  $pnpmRuntimeNode,
  (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$nodePath = $nodeCandidates | Select-Object -First 1

if (-not $nodePath) {
  throw 'Unable to locate the Node.js runtime required to prepare Electron.'
}

& $nodePath (Join-Path $projectRoot 'tools\ensure-electron-runtime.js')
if ($LASTEXITCODE -ne 0) {
  throw "Electron runtime preparation failed with exit code $LASTEXITCODE."
}
