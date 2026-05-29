param(
  [Parameter(Mandatory = $true)]
  [string]$GitHubUser,

  [Parameter(Mandatory = $true)]
  [string]$RepoName
)

$ErrorActionPreference = "Stop"
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
  Write-Host ""
  Write-Host "Git is not installed or not on your PATH." -ForegroundColor Red
  Write-Host "Install from: https://git-scm.com/download/win" -ForegroundColor Yellow
  Write-Host "Restart Cursor, then run this script again." -ForegroundColor Yellow
  exit 1
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".git")) {
  & git init
}

& git add -A
$status = & git status --porcelain
if ($status) {
  & git commit -m "v0.4.0: portfolio site with dark mode, media config, and Three.js studio"
} else {
  Write-Host "Nothing new to commit." -ForegroundColor Gray
}

& git branch -M main

$remoteUrl = "https://github.com/$GitHubUser/$RepoName.git"
$existing = & git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  & git remote add origin $remoteUrl
  Write-Host "Added remote: $remoteUrl" -ForegroundColor Green
} else {
  Write-Host "Remote origin already set: $existing" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next: create an EMPTY repo at https://github.com/new named '$RepoName'" -ForegroundColor Cyan
Write-Host "Then run:  git push -u origin main" -ForegroundColor Cyan
Write-Host ""
