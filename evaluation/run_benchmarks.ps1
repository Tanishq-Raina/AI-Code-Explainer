param([switch]$Run, [switch]$Preflight, [switch]$AllowExternalVideo,
      [string]$Output = '')
$ErrorActionPreference = 'Stop'
$benchmarkPython = Join-Path $PSScriptRoot '..\.venv\Scripts\python.exe'
$benchmarkArgs = @((Join-Path $PSScriptRoot 'run_benchmarks.py'))
if ($Run) { $benchmarkArgs += '--run' }
if ($Preflight) { $benchmarkArgs += '--preflight' }
if ($AllowExternalVideo) { $benchmarkArgs += '--allow-external-video' }
if ($Output) { $benchmarkArgs += @('--out', $Output) }
& $benchmarkPython @benchmarkArgs
exit $LASTEXITCODE
