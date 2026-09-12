# Automated SAM build & Linux binary packaging script for Windows
# Runs SAM build, then downloads and packages native Linux-x64 Sharp & static FFmpeg binaries.

Write-Host "1. Cleaning previous build artifacts..." -ForegroundColor Cyan
if (Test-Path ".aws-sam") {
    Remove-Item -Recurse -Force ".aws-sam"
}

Write-Host "2. Running SAM build..." -ForegroundColor Cyan
sam build
if ($LASTEXITCODE -ne 0) {
    Write-Host "sam build failed. Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "3. Injecting native Linux-x64 Sharp, Libvips, and FFmpeg binaries..." -ForegroundColor Cyan
node prepare-linux-binaries.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to prepare Linux binaries. Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "`nAll Linux binaries successfully installed and verified!" -ForegroundColor Green
Write-Host "You can now run: sam deploy" -ForegroundColor Green
