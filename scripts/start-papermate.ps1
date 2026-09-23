$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$statusUrl = 'http://127.0.0.1:4180/api/status'

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js 22 was not found. Install it and try again.' -ForegroundColor Red
    exit 1
}

$hasEnvironmentKey = -not [string]::IsNullOrWhiteSpace($env:DEEPSEEK_API_KEY)
if (-not (Test-Path (Join-Path $projectRoot '.env.local')) -and -not $hasEnvironmentKey) {
    Write-Host 'DeepSeek must be configured before first use.' -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot 'configure-deepseek.ps1')
}

try {
    Invoke-RestMethod $statusUrl -TimeoutSec 1 | Out-Null
} catch {
    if (-not (Test-Path (Join-Path $projectRoot 'node_modules'))) {
        Write-Host 'Installing dependencies for the first run...'
        $install = Start-Process npm.cmd -ArgumentList 'install','--no-audit','--no-fund' -WorkingDirectory $projectRoot -Wait -PassThru
        if ($install.ExitCode -ne 0) { throw 'Dependency installation failed. Check the network and try again.' }
    }
    Start-Process node.exe -ArgumentList 'server.mjs' -WorkingDirectory $projectRoot -WindowStyle Hidden
    $ready = $false
    foreach ($attempt in 1..30) {
        Start-Sleep -Milliseconds 250
        try { Invoke-RestMethod $statusUrl -TimeoutSec 1 | Out-Null; $ready = $true; break } catch {}
    }
    if (-not $ready) { throw 'PaperMate timed out while starting. Check whether port 4180 is already in use.' }
}

Start-Process 'http://127.0.0.1:4180'
