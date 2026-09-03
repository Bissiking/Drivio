import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_SVG = path.join(__dirname, "..", "public", "drivio.svg");
const OUTPUT_DIR = path.join(__dirname, "..", "android", "app", "src", "main", "res");

// Android splash screen sizes
const SPLASH_SIZES = [
  { density: "drawable-mdpi", width: 320, height: 480 },
  { density: "drawable-hdpi", width: 480, height: 720 },
  { density: "drawable-xhdpi", width: 640, height: 960 },
  { density: "drawable-xxhdpi", width: 960, height: 1440 },
  { density: "drawable-xxxhdpi", width: 1280, height: 1920 },
];

// Foreground icon size (centered in splash)
const ICON_SIZE = 192;

async function generateSplash() {
  console.log("Génération des splash screens Android...\n");

  const svgBuffer = fs.readFileSync(INPUT_SVG);

  for (const { density, width, height } of SPLASH_SIZES) {
    const dir = path.join(OUTPUT_DIR, density);
    fs.mkdirSync(dir, { recursive: true });

    const outputPath = path.join(dir, "splash.png");

    // Create splash background (dark graphite)
    const background = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 26, g: 26, b: 46, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    // Resize icon
    const iconBuffer = await sharp(svgBuffer)
      .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Composite icon centered on background
    const iconOffsetX = Math.floor((width - ICON_SIZE) / 2);
    const iconOffsetY = Math.floor((height - ICON_SIZE) / 2);

    await sharp(background)
      .composite([
        {
          input: iconBuffer,
          left: iconOffsetX,
          top: iconOffsetY,
        },
      ])
      .png()
      .toFile(outputPath);

    console.log(`  ${density}: ${width}x${height} → ${outputPath}`);
  }

  console.log("\nTerminé !");
}

generateSplash().catch(console.error);
