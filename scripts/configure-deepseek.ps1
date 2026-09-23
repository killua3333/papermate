param([Security.SecureString]$ApiKey)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if ($null -eq $ApiKey) {
    $ApiKey = Read-Host 'Enter your DeepSeek API Key (input is hidden)' -AsSecureString
}
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ApiKey)
try {
    $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ([string]::IsNullOrWhiteSpace($plainKey)) { throw 'No API Key entered. Configuration was not saved.' }
    if ($plainKey -match '[\r\n]') { throw 'The API Key contains invalid line breaks.' }
    $lines = @(
        "DEEPSEEK_API_KEY=$plainKey"
        'DEEPSEEK_BASE_URL=https://api.deepseek.com'
        'DEEPSEEK_MODEL=deepseek-flash'
        'PORT=4180'
    )
    $utf8 = [Text.UTF8Encoding]::new($false)
    [IO.File]::WriteAllText((Join-Path $projectRoot '.env.local'), ($lines -join [Environment]::NewLine), $utf8)
    Write-Host 'DeepSeek is configured. Start PaperMate again.' -ForegroundColor Green
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
