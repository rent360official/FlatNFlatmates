const fs = require("fs");
const path = require("path");
const https = require("https");
const zlib = require("zlib");

const ffmpegUrl = "https://github.com/eugeneware/ffmpeg-static/releases/download/b5.2.0/ffmpeg-linux-x64.gz";

function downloadAndDecompress(url, destPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`Downloading Linux FFmpeg from ${url}...`);

    function get(currentUrl) {
      https.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
          return;
        }

        const gunzip = zlib.createGunzip();
        const fileStream = fs.createWriteStream(destPath);

        res.pipe(gunzip).pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          const stat = fs.statSync(destPath);
          console.log(`Successfully downloaded & extracted Linux FFmpeg to ${destPath} (${Math.round(stat.size / (1024 * 1024))} MB)`);
          resolve();
        });

        gunzip.on("error", reject);
        fileStream.on("error", reject);
      }).on("error", reject);
    }

    get(url);
  });
}

async function main() {
  const targetPaths = [
    path.join(__dirname, ".aws-sam", "build", "ProcessVideoFunction", "node_modules", "ffmpeg-static", "ffmpeg"),
    path.join(__dirname, "processVideo", "node_modules", "ffmpeg-static", "ffmpeg"),
  ];

  for (const targetPath of targetPaths) {
    const dir = path.dirname(targetPath);
    if (fs.existsSync(dir)) {
      await downloadAndDecompress(ffmpegUrl, targetPath);
    }
  }
}

main().catch((err) => {
  console.error("FFmpeg download error:", err);
  process.exit(1);
});
