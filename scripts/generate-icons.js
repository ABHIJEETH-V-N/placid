import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG definition for standard icon
const svgStandard = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a7ff2" />
      <stop offset="50%" stop-color="#7b7ed8" />
      <stop offset="100%" stop-color="#a475c7" />
    </linearGradient>
    <linearGradient id="glow" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.3" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#grad)" />
  <!-- Inner calm horizon and glowing pebble / breathing circle -->
  <circle cx="256" cy="220" r="76" fill="url(#glow)" />
  <circle cx="256" cy="220" r="48" fill="#ffffff" />
  <!-- Gentle hill silhouette -->
  <path d="M 60 410 Q 180 340 280 370 Q 380 400 452 380 L 452 452 L 60 452 Z" fill="#252446" opacity="0.4" />
  <path d="M 60 430 Q 200 370 330 380 Q 400 385 452 400 L 452 452 L 60 452 Z" fill="#181533" opacity="0.65" />
</svg>
`;

// SVG definition for maskable icon (full-bleed with large safe margins)
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="gradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a7ff2" />
      <stop offset="50%" stop-color="#7b7ed8" />
      <stop offset="100%" stop-color="#a475c7" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#gradM)" />
  <!-- Safe zone center circle (within 80% diameter) -->
  <circle cx="256" cy="235" r="64" fill="#ffffff" opacity="0.95" />
  <circle cx="256" cy="235" r="42" fill="#ffffff" />
  <!-- Subtle silhouette within safe boundary -->
  <path d="M 0 380 Q 150 330 260 350 Q 370 370 512 340 L 512 512 L 0 512 Z" fill="#181533" opacity="0.6" />
</svg>
`;

async function generate() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgStandard.trim());

  await sharp(Buffer.from(svgStandard))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  await sharp(Buffer.from(svgStandard))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512-maskable.png'));

  await sharp(Buffer.from(svgStandard))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(svgStandard))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('Successfully generated all PWA icons.');
}

generate().catch(console.error);
