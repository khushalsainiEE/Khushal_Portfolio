# Local preview server — run from Portfolio folder:
#   .\scripts\serve.ps1

param([int]$Port = 3000)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Free the port if something is stuck
Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "Portfolio preview:" -ForegroundColor Cyan
Write-Host "  http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

Start-Process "http://127.0.0.1:$Port"
python -m http.server $Port --bind 127.0.0.1
