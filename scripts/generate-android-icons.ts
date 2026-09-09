import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_SVG = path.join(__dirname, "..", "public", "drivio.svg");
const OUTPUT_DIR = path.join(__dirname, "..", "android", "app", "src", "main", "res");
const BACKGROUND = { r: 19, g: 23, b: 21, alpha: 1 };

const ANDROID_SIZES = [
  { density: "mipmap-mdpi", size: 48 },
  { density: "mipmap-hdpi", size: 72 },
  { density: "mipmap-xhdpi", size: 96 },
  { density: "mipmap-xxhdpi", size: 144 },
  { density: "mipmap-xxxhdpi", size: 192 },
];

const PLAY_STORE_SIZE = 512;

async function renderIcon(
  svgBuffer: Buffer,
  canvasSize: number,
  logoRatio: number,
  background: { r: number; g: number; b: number; alpha: number },
) {
  const logoSize = Math.round(canvasSize * logoRatio);
  const logo = await sharp(svgBuffer)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const offset = Math.floor((canvasSize - logoSize) / 2);

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background,
    },
  }).composite([{ input: logo, left: offset, top: offset }]);
}

function writeAdaptiveIconResources() {
  const foregroundDir = path.join(OUTPUT_DIR, "drawable-v24");
  const adaptiveDir = path.join(OUTPUT_DIR, "mipmap-anydpi-v26");
  const valuesDir = path.join(OUTPUT_DIR, "values");
  fs.mkdirSync(foregroundDir, { recursive: true });
  fs.mkdirSync(adaptiveDir, { recursive: true });
  fs.mkdirSync(valuesDir, { recursive: true });

  fs.writeFileSync(
    path.join(foregroundDir, "ic_launcher_foreground.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#B8EF8D"
        android:pathData="M47.88,28.63h26.25L62.75,48.75H43.5L47.88,28.63Z" />
    <path
        android:fillColor="#B8EF8D"
        android:pathData="M44.38,52.25h19.25L47,79.38H29.5L44.38,52.25Z" />
</vector>
`,
  );

  const adaptiveIcon = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(adaptiveDir, "ic_launcher.xml"), adaptiveIcon);
  fs.writeFileSync(path.join(adaptiveDir, "ic_launcher_round.xml"), adaptiveIcon);
  fs.writeFileSync(
    path.join(valuesDir, "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#131715</color>
</resources>
`,
  );
}

async function generateIcons() {
  console.log("Génération des icônes Android...\n");

  const svgBuffer = fs.readFileSync(INPUT_SVG);

  // Generate mipmap icons
  for (const { density, size } of ANDROID_SIZES) {
    const dir = path.join(OUTPUT_DIR, density);
    fs.mkdirSync(dir, { recursive: true });

    const outputPath = path.join(dir, "ic_launcher.png");
    await (await renderIcon(svgBuffer, size, 0.62, BACKGROUND)).png().toFile(outputPath);

    const foregroundSize = Math.round(size * 2.25);
    const foregroundPath = path.join(dir, "ic_launcher_foreground.png");
    await (
      await renderIcon(svgBuffer, foregroundSize, 0.5, {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      })
    )
      .png()
      .toFile(foregroundPath);

    console.log(`  ${density}: ${size}x${size} → ${outputPath}`);
  }

  // Generate round icons
  for (const { density, size } of ANDROID_SIZES) {
    const dir = path.join(OUTPUT_DIR, density);
    const outputPath = path.join(dir, "ic_launcher_round.png");

    // Create a circular mask
    const sizeBuffer = await (await renderIcon(svgBuffer, size, 0.62, BACKGROUND))
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
  const playStorePath = path.join(playStoreDir, "ic_launcher_playstore.png");
  await (await renderIcon(svgBuffer, PLAY_STORE_SIZE, 0.56, BACKGROUND))
    .png()
    .toFile(playStorePath);

  writeAdaptiveIconResources();

  console.log(`\n  Play Store: ${PLAY_STORE_SIZE}x${PLAY_STORE_SIZE} → ${playStorePath}`);
  console.log("\nTerminé !");
}

generateIcons().catch(console.error);
