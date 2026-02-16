/**
 * Script: Combine Province GeoJSON files into one
 *
 * This combines all 77 province GeoJSON files into a single file
 * to reduce HTTP requests from 77 to 1 for faster map loading
 *
 * Usage: node scripts/combine-province-geojson.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_DIR = 'public/geojson-provinces';
const OUTPUT_FILE = 'public/geojson-thailand-provinces.json';

function combineProvinces() {
  console.log('========================================');
  console.log('Combining Province GeoJSON Files');
  console.log('========================================\n');

  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`Input directory not found: ${INPUT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} province files\n`);

  const allFeatures = [];
  let totalSize = 0;
  let errorCount = 0;

  files.forEach((file, index) => {
    const filePath = path.join(INPUT_DIR, file);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const geojson = JSON.parse(content);

      if (geojson && geojson.features) {
        // Add province name to each feature's properties
        const provinceName = file.replace('.json', '');
        geojson.features.forEach(feature => {
          if (!feature.properties) feature.properties = {};
          feature.properties.province_name = provinceName;
        });

        allFeatures.push(...geojson.features);
        totalSize += content.length;

        if ((index + 1) % 20 === 0) {
          console.log(`  Processed ${index + 1}/${files.length} files...`);
        }
      }
    } catch (error) {
      console.error(`  Error reading ${file}: ${error.message}`);
      errorCount++;
    }
  });

  console.log(`\nProcessed ${files.length} files (${errorCount} errors)`);
  console.log(`Total features: ${allFeatures.length}`);

  // Create combined GeoJSON
  const combinedGeoJSON = {
    type: "FeatureCollection",
    features: allFeatures
  };

  // Write output
  const outputContent = JSON.stringify(combinedGeoJSON);
  fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf-8');

  const outputSize = Buffer.byteLength(outputContent, 'utf-8');

  console.log('\n========================================');
  console.log('RESULT');
  console.log('========================================');
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`Output size: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total provinces: ${files.length}`);
  console.log(`Total features: ${allFeatures.length}`);
  console.log('========================================\n');
}

combineProvinces();
