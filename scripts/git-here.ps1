# Use Git in this terminal when "git is not recognized"
# Run once per terminal session:  . .\scripts\git-here.ps1

$gitCmd = "C:\Program Files\Git\cmd"
$gitBin = "C:\Program Files\Git\bin"

if (Test-Path $gitCmd) {
  if ($env:Path -notlike "*$gitCmd*") {
    $env:Path = "$gitCmd;$gitBin;" + $env:Path
    Write-Host "Git added to PATH for this session." -ForegroundColor Green
  }
  git --version
} else {
  Write-Host "Git not found. Install from https://git-scm.com/download/win" -ForegroundColor Red
}
