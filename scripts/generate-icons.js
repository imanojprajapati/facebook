const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Default icon as SVG if icon.svg is not found
const defaultIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1877F2"/>
  <path d="M355.904 257.376L367.168 178.304H291.52V128.96C291.52 107.52 302.144 86.72 335.616 86.72H370.176V19.1998C370.176 19.1998 339.392 13.4398 309.888 13.4398C248.32 13.4398 207.872 50.8158 207.872 120.32V178.304H138.24V257.376H207.872V459.84C222.912 462.336 238.592 463.68 254.656 463.68C270.72 463.68 286.4 462.336 301.44 459.84V257.376H355.904Z" fill="white"/>
</svg>
`;

async function generateIcons() {  const outputDir = path.join(__dirname, '..', 'public', 'icons');
  const defaultIconPath = path.join(__dirname, 'default-icon.svg');

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Create default SVG if needed
    await fs.writeFile(defaultIconPath, defaultIconSvg);

    // Generate icons for each size
    for (const size of sizes) {
      await sharp(defaultIconPath)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      
      console.log(`Generated ${size}x${size} icon`);
    }

    // Clean up default SVG
    await fs.unlink(defaultIconPath);

    console.log('Icon generation complete!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
