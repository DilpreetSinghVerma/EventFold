const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'attached_assets', 'demo_album');

async function compress() {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const inputPath = path.join(dir, file);
    const outputPath = path.join(dir, file.replace('.png', '.webp'));
    
    console.log(`Compressing ${file}...`);
    await sharp(inputPath)
      .resize({ width: 2400, withoutEnlargement: true }) // Max width for 2-page spread
      .webp({ quality: 80, effort: 6 })
      .toFile(outputPath);
      
    console.log(`Saved ${outputPath}`);
  }
}

compress().catch(console.error);
