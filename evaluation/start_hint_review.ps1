param([int]$Port = 8765, [switch]$Shared, [ValidateSet(0,1,2)][int]$Reviewer = 0)
$ErrorActionPreference = 'Stop'
$reviewPython = Join-Path $PSScriptRoot '..\.venv\Scripts\python.exe'
$reviewArgs = @()
if (-not (Test-Path -LiteralPath $reviewPython)) {
    $pythonLauncher = Get-Command py -ErrorAction SilentlyContinue
    $systemPython = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonLauncher) { $reviewPython = $pythonLauncher.Source; $reviewArgs += '-3' }
    elseif ($systemPython) { $reviewPython = $systemPython.Source }
    else { throw 'Install Python 3.10 or later, then run this launcher again. No additional packages are needed.' }
}
$reviewArgs += @((Join-Path $PSScriptRoot 'review_app.py'), '--port', $Port, '--open')
if ($Reviewer) { $reviewArgs += @('--run-dir', (Join-Path $PSScriptRoot "review_data\reviewer_$Reviewer")) }
elseif ($Shared) { $reviewArgs += @('--run-dir', (Join-Path $PSScriptRoot 'review_data')) }
& $reviewPython @reviewArgs
exit $LASTEXITCODE
