const fs = require("fs");
const path = require("path");
const sharp = require("/Users/jordan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");

const svgDir = path.join(__dirname, "frames");
const pngDir = path.join(__dirname, "png-frames");
fs.mkdirSync(pngDir, { recursive: true });

async function main() {
  const frames = fs.readdirSync(svgDir).filter((f) => f.endsWith(".svg")).sort();
  for (let i = 0; i < frames.length; i += 16) {
    const batch = frames.slice(i, i + 16);
    await Promise.all(batch.map(async (file) => {
      await sharp(path.join(svgDir, file), { density: 144 })
        .resize(1280, 720)
        .png()
        .toFile(path.join(pngDir, file.replace(".svg", ".png")));
    }));
    if (i % 160 === 0) console.log(`Rendered ${Math.min(i + batch.length, frames.length)} / ${frames.length}`);
  }
  console.log(`Wrote PNG frames to ${pngDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
