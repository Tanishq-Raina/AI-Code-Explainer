$ErrorActionPreference = 'Stop'
$env:LLM_PROVIDER = 'ollama'
$env:LLM_BASE_URL = 'http://localhost:11434/v1'
$env:LLM_MODEL = 'qwen3-coder:30b'
$env:LLM_ENABLED = 'true'
$env:LLM_TIMEOUT = '600'
$env:LLM_TEMPERATURE = '0.3'
$env:LLM_MAX_TOKENS = '1200'
$tutorPython = Join-Path $PSScriptRoot '..\.venv\Scripts\python.exe'
& $tutorPython (Join-Path $PSScriptRoot 'app.py')
exit $LASTEXITCODE
