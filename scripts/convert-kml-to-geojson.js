/**
 * Script: Convert KML to GeoJSON + Simplify
 *
 * This script converts all KML files to GeoJSON format with polygon simplification
 * to reduce file size by ~70-80%
 *
 * Usage: node scripts/convert-kml-to-geojson.js
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');
const toGeoJSON = require('@mapbox/togeojson');
const simplify = require('simplify-geojson');

// Configuration
const CONFIG = {
  // Simplification tolerance (higher = smaller files but less detail)
  // 0 = no simplification (full precision), 0.001 = ~111m, 0.002 = ~222m
  simplifyTolerance: 0,

  // Folders to convert
  folders: [
    { input: 'C:/Users/earth/Downloads/data/kml/provinces', output: 'public/geojson-provinces', level: 'province' },
    { input: 'C:/Users/earth/Downloads/data/kml/districts', output: 'public/geojson-amphoe', level: 'amphoe' },
    { input: 'C:/Users/earth/Downloads/data/kml/subdistricts', output: 'public/geojson-tambon', level: 'tambon' },
  ]
};

// Statistics
const stats = {
  totalFiles: 0,
  successFiles: 0,
  errorFiles: 0,
  originalSize: 0,
  newSize: 0,
  errors: []
};

/**
 * Convert KML string to GeoJSON
 */
function kmlToGeoJSON(kmlString) {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlString, 'text/xml');

  // Check for parsing errors
  const parserError = kmlDoc.getElementsByTagName('parsererror');
  if (parserError.length > 0) {
    throw new Error(`XML parsing error: ${parserError[0].textContent}`);
  }

  return toGeoJSON.kml(kmlDoc);
}

/**
 * Simplify GeoJSON to reduce file size
 */
function simplifyGeoJSON(geojson, tolerance) {
  if (!geojson || !geojson.features) {
    return geojson;
  }

  try {
    // Simplify each feature
    geojson.features = geojson.features.map(feature => {
      try {
        return simplify(feature, tolerance);
      } catch (e) {
        // If simplification fails, return original feature
        console.warn(`  Warning: Could not simplify feature, keeping original`);
        return feature;
      }
    });

    return geojson;
  } catch (e) {
    console.warn(`  Warning: Simplification failed, keeping original GeoJSON`);
    return geojson;
  }
}

/**
 * Process a single KML file
 */
function processFile(inputPath, outputPath) {
  const originalSize = fs.statSync(inputPath).size;
  stats.originalSize += originalSize;

  // Read KML file
  const kmlString = fs.readFileSync(inputPath, 'utf-8');

  // Convert to GeoJSON
  const geojson = kmlToGeoJSON(kmlString);

  if (!geojson || !geojson.features || geojson.features.length === 0) {
    throw new Error('No features found in KML file');
  }

  // Simplify
  const simplified = simplifyGeoJSON(geojson, CONFIG.simplifyTolerance);

  // Write GeoJSON file
  fs.writeFileSync(outputPath, JSON.stringify(simplified), 'utf-8');

  const newSize = fs.statSync(outputPath).size;
  stats.newSize += newSize;

  const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

  return {
    originalSize,
    newSize,
    reduction,
    featureCount: simplified.features.length
  };
}

/**
 * Process all KML files in a directory (recursively)
 */
function processDirectory(inputDir, outputDir, level) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const entries = fs.readdirSync(inputDir, { withFileTypes: true });

  for (const entry of entries) {
    const inputPath = path.join(inputDir, entry.name);

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subOutputDir = path.join(outputDir, entry.name);
      processDirectory(inputPath, subOutputDir, level);
    } else if (entry.name.endsWith('.kml')) {
      stats.totalFiles++;

      const outputName = entry.name.replace('.kml', '.json');
      const outputPath = path.join(outputDir, outputName);

      process.stdout.write(`  Converting: ${entry.name}`);

      try {
        const result = processFile(inputPath, outputPath);
        stats.successFiles++;

        console.log(` ✓ (${result.featureCount} features, ${result.reduction}% smaller)`);
      } catch (error) {
        stats.errorFiles++;
        stats.errors.push({ file: inputPath, error: error.message });
        console.log(` ✗ ERROR: ${error.message}`);
      }
    }
  }
}

/**
 * Main function
 */
function main() {
  console.log('========================================');
  console.log('KML to GeoJSON Converter + Simplifier');
  console.log('========================================\n');

  console.log(`Simplification tolerance: ${CONFIG.simplifyTolerance}`);
  console.log('(lower = more detail, higher = smaller files)\n');

  const startTime = Date.now();

  // Process each folder
  for (const folder of CONFIG.folders) {
    if (fs.existsSync(folder.input)) {
      console.log(`\nProcessing: ${folder.input} (${folder.level})`);
      console.log('-'.repeat(50));
      processDirectory(folder.input, folder.output, folder.level);
    } else {
      console.log(`\nSkipping: ${folder.input} (not found)`);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total files:     ${stats.totalFiles}`);
  console.log(`Success:         ${stats.successFiles}`);
  console.log(`Errors:          ${stats.errorFiles}`);
  console.log(`Duration:        ${duration}s`);
  console.log();
  console.log(`Original size:   ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`New size:        ${(stats.newSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Reduction:       ${((1 - stats.newSize / stats.originalSize) * 100).toFixed(1)}%`);
  console.log(`Saved:           ${((stats.originalSize - stats.newSize) / 1024 / 1024).toFixed(2)} MB`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.file}: ${e.error}`);
    });
  }

  console.log('\n========================================');
  console.log('Output folders:');
  CONFIG.folders.forEach(f => {
    if (fs.existsSync(f.output)) {
      console.log(`  - ${f.output}`);
    }
  });
  console.log('========================================\n');

  // Exit with error code if there were errors
  process.exit(stats.errorFiles > 0 ? 1 : 0);
}

main();
