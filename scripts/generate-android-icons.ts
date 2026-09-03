import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_SVG = path.join(__dirname, "..", "public", "drivio.svg");
const OUTPUT_DIR = path.join(__dirname, "..", "android", "app", "src", "main", "res");

const ANDROID_SIZES = [
  { density: "mipmap-mdpi", size: 48 },
  { density: "mipmap-hdpi", size: 72 },
  { density: "mipmap-xhdpi", size: 96 },
  { density: "mipmap-xxhdpi", size: 144 },
  { density: "mipmap-xxxhdpi", size: 192 },
];

const PLAY_STORE_SIZE = 512;

async function generateIcons() {
  console.log("Génération des icônes Android...\n");

  const svgBuffer = fs.readFileSync(INPUT_SVG);

  // Generate mipmap icons
  for (const { density, size } of ANDROID_SIZES) {
    const dir = path.join(OUTPUT_DIR, density);
    fs.mkdirSync(dir, { recursive: true });

    const outputPath = path.join(dir, "ic_launcher.png");
    await sharp(svgBuffer)
      .resize(size, size, { fit: "contain", background: { r: 26, g: 26, b: 46, alpha: 1 } })
      .png()
      .toFile(outputPath);

    console.log(`  ${density}: ${size}x${size} → ${outputPath}`);
  }

  // Generate round icons
  for (const { density, size } of ANDROID_SIZES) {
    const dir = path.join(OUTPUT_DIR, density);
    const outputPath = path.join(dir, "ic_launcher_round.png");

    // Create a circular mask
    const sizeBuffer = await sharp(svgBuffer)
      .resize(size, size, { fit: "contain", background: { r: 26, g: 26, b: 46, alpha: 1 } })
      .png()
      .toBuffer();

    // Create circular mask
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
    );

    await sharp(sizeBuffer)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toFile(outputPath);

    console.log(`  ${density} (round): ${size}x${size} → ${outputPath}`);
  }

  // Generate Play Store icon
  const playStoreDir = path.join(OUTPUT_DIR, "mipmap-xxxhdpi");
  const playStorePath = path.join(playStoreDir, "ic_launcher-playstore.png");
  await sharp(svgBuffer)
    .resize(PLAY_STORE_SIZE, PLAY_STORE_SIZE, { fit: "contain", background: { r: 26, g: 26, b: 46, alpha: 1 } })
    .png()
    .toFile(playStorePath);

  console.log(`\n  Play Store: ${PLAY_STORE_SIZE}x${PLAY_STORE_SIZE} → ${playStorePath}`);
  console.log("\nTerminé !");
}

generateIcons().catch(console.error);
