# Automated SAM build script for Windows with Auto-Fallback
# 1. Tries containerized build (if Docker is running and healthy)
# 2. Falls back to direct Linux-x64 Sharp & Libvips installation if Docker fails
# 3. Verifies libvips-cpp.so* exists before authorizing deployment

Write-Host "1. Cleaning previous build artifacts..." -ForegroundColor Cyan
if (Test-Path ".aws-sam") {
    Remove-Item -Recurse -Force ".aws-sam"
}

Write-Host "2. Running SAM build..." -ForegroundColor Cyan
$dockerRunning = $false
try {
    $dockerCheck = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if ($dockerRunning) {
    Write-Host "   Attempting containerized build..." -ForegroundColor Yellow
    sam build --use-container
}

if (-not $dockerRunning -or $LASTEXITCODE -ne 0) {
    Write-Host "   Running native SAM build + Linux-x64 binary packaging..." -ForegroundColor Yellow
    sam build

    if ($LASTEXITCODE -ne 0) {
        Write-Host "sam build failed. Aborting." -ForegroundColor Red
        exit 1
    }

    Write-Host "   Installing Linux-x64 Sharp & Libvips binaries into build artifact..." -ForegroundColor Cyan
    $artifactDir = ".aws-sam\build\ProcessImageFunction"
    Push-Location $artifactDir
    npm install --os=linux --cpu=x64 --libc=glibc --force @img/sharp-linux-x64@0.33.5 @img/sharp-libvips-linux-x64@1.0.4
    Pop-Location

    Write-Host "   Downloading Linux-x64 FFmpeg binary into ProcessVideoFunction artifact..." -ForegroundColor Cyan
    $videoArtifactDir = ".aws-sam\build\ProcessVideoFunction\node_modules\ffmpeg-static"
    if (Test-Path $videoArtifactDir) {
        Push-Location $videoArtifactDir
        $env:npm_config_platform = "linux"
        $env:npm_config_arch = "x64"
        node install.js
        if (Test-Path "ffmpeg.exe") {
            Remove-Item -Force "ffmpeg.exe*"
        }
        Pop-Location
    }
}

Write-Host "3. Verifying Linux native binaries are present in the build output..." -ForegroundColor Cyan
$vipsBinary = Get-ChildItem -Recurse ".aws-sam\build\ProcessImageFunction\node_modules\@img" -Filter "libvips-cpp.so*" -ErrorAction SilentlyContinue
if (-not $vipsBinary) {
    Write-Host "ERROR: libvips-cpp.so* not found under node_modules\@img in the build output." -ForegroundColor Red
    Write-Host "Do not deploy this build." -ForegroundColor Red
    exit 1
}
Write-Host "   [Image Lambda] Sharp/Libvips verified: $($vipsBinary.FullName)" -ForegroundColor Green

$ffmpegBinary = ".aws-sam\build\ProcessVideoFunction\node_modules\ffmpeg-static\ffmpeg"
if (-not (Test-Path $ffmpegBinary)) {
    Write-Host "ERROR: Linux FFmpeg binary not found at $ffmpegBinary." -ForegroundColor Red
    Write-Host "Do not deploy this build." -ForegroundColor Red
    exit 1
}
$ffmpegSize = (Get-Item $ffmpegBinary).Length / 1MB
Write-Host "   [Video Lambda] Linux FFmpeg binary verified: $ffmpegBinary ($([math]::Round($ffmpegSize, 1)) MB)" -ForegroundColor Green

Write-Host "Build complete and all Linux binaries verified! You can now run: sam deploy" -ForegroundColor Green
