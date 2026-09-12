const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const { execSync } = require('child_process');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

function extractTarGz(tarGzPath, targetDir) {
  const tempExtract = path.join(path.dirname(tarGzPath), '_temp_' + path.basename(tarGzPath, '.tgz'));
  fs.mkdirSync(tempExtract, { recursive: true });
  execSync(`tar -xzf "${tarGzPath}" -C "${tempExtract}"`);
  
  // npm tarballs have a "package" folder inside
  const srcPackage = path.join(tempExtract, 'package');
  if (fs.existsSync(srcPackage)) {
    fs.mkdirSync(targetDir, { recursive: true });
    // Copy all contents from package to targetDir
    copyRecursiveSync(srcPackage, targetDir);
  }
  fs.rmSync(tempExtract, { recursive: true, force: true });
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  console.log('=== Preparing Linux x64 binaries for AWS Lambda ===\n');

  const baseDir = __dirname;
  const imageBuildDir = path.join(baseDir, '.aws-sam', 'build', 'ProcessImageFunction');
  const videoBuildDir = path.join(baseDir, '.aws-sam', 'build', 'ProcessVideoFunction');

  if (!fs.existsSync(imageBuildDir) || !fs.existsSync(videoBuildDir)) {
    console.error('Error: SAM build directories not found! Run "sam build" first.');
    process.exit(1);
  }

  const tempDownloadDir = path.join(baseDir, '.temp_binaries');
  fs.mkdirSync(tempDownloadDir, { recursive: true });

  // 1. Process Image Function: Sharp & Libvips Linux x64
  console.log('1. Patching ProcessImageFunction with Linux Sharp & Libvips...');
  const sharpTgz = path.join(tempDownloadDir, 'sharp-linux-x64-0.33.5.tgz');
  const libvipsTgz = path.join(tempDownloadDir, 'sharp-libvips-linux-x64-1.0.4.tgz');

  if (!fs.existsSync(sharpTgz)) {
    console.log('   Downloading @img/sharp-linux-x64@0.33.5...');
    await download('https://registry.npmjs.org/@img/sharp-linux-x64/-/sharp-linux-x64-0.33.5.tgz', sharpTgz);
  }
  if (!fs.existsSync(libvipsTgz)) {
    console.log('   Downloading @img/sharp-libvips-linux-x64@1.0.4...');
    await download('https://registry.npmjs.org/@img/sharp-libvips-linux-x64/-/sharp-libvips-linux-x64-1.0.4.tgz', libvipsTgz);
  }

  const imgModulesDir = path.join(imageBuildDir, 'node_modules', '@img');
  fs.mkdirSync(imgModulesDir, { recursive: true });

  // Remove any win32 sharp module if present
  const win32Sharp = path.join(imgModulesDir, 'sharp-win32-x64');
  if (fs.existsSync(win32Sharp)) {
    fs.rmSync(win32Sharp, { recursive: true, force: true });
  }

  const targetSharpLinux = path.join(imgModulesDir, 'sharp-linux-x64');
  const targetLibvipsLinux = path.join(imgModulesDir, 'sharp-libvips-linux-x64');

  extractTarGz(sharpTgz, targetSharpLinux);
  extractTarGz(libvipsTgz, targetLibvipsLinux);
  console.log('   Installed sharp-linux-x64 and sharp-libvips-linux-x64 successfully.');

  // 2. Process Video Function: Static FFmpeg Linux x64
  console.log('\n2. Patching ProcessVideoFunction with Linux FFmpeg static binary...');
  const ffmpegGz = path.join(tempDownloadDir, 'ffmpeg-linux-x64.gz');
  if (!fs.existsSync(ffmpegGz)) {
    console.log('   Downloading ffmpeg-linux-x64.gz (~29MB)...');
    await download('https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64.gz', ffmpegGz);
  }

  console.log('   Decompressing ffmpeg binary (~79MB)...');
  const gzBuffer = fs.readFileSync(ffmpegGz);
  const ffmpegBinary = zlib.gunzipSync(gzBuffer);

  const videoFfmpegRoot = path.join(videoBuildDir, 'ffmpeg');
  const videoFfmpegStatic = path.join(videoBuildDir, 'node_modules', 'ffmpeg-static', 'ffmpeg');

  fs.mkdirSync(path.dirname(videoFfmpegStatic), { recursive: true });
  fs.writeFileSync(videoFfmpegRoot, ffmpegBinary, { mode: 0o755 });
  fs.writeFileSync(videoFfmpegStatic, ffmpegBinary, { mode: 0o755 });

  // Remove Windows ffmpeg.exe if present
  const win32FfmpegExe = path.join(videoBuildDir, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
  if (fs.existsSync(win32FfmpegExe)) {
    fs.rmSync(win32FfmpegExe, { force: true });
  }
  console.log('   Installed Linux FFmpeg binary into ProcessVideoFunction.');

  // 3. Verification
  console.log('\n3. Verifying all Linux binaries in build artifacts...');

  const sharpNodePath = path.join(targetSharpLinux, 'lib', 'sharp-linux-x64.node');
  const libvipsSoPath = path.join(targetLibvipsLinux, 'lib', 'libvips-cpp.so.42');

  if (!fs.existsSync(sharpNodePath)) {
    throw new Error(`Verification failed: ${sharpNodePath} does not exist!`);
  }
  if (!fs.existsSync(libvipsSoPath)) {
    throw new Error(`Verification failed: ${libvipsSoPath} does not exist!`);
  }
  if (!fs.existsSync(videoFfmpegRoot) || fs.statSync(videoFfmpegRoot).size < 50000000) {
    throw new Error(`Verification failed: ${videoFfmpegRoot} is missing or corrupt!`);
  }

  console.log(`   [Sharp] Verified: ${sharpNodePath}`);
  console.log(`   [Libvips] Verified: ${libvipsSoPath}`);
  console.log(`   [FFmpeg] Verified: ${videoFfmpegRoot} (${Math.round(fs.statSync(videoFfmpegRoot).size / (1024 * 1024))} MB)`);

  console.log('\nBuild packaging ready for sam deploy!\n');
}

main().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
