const fs = require('fs');
const path = require('path');

/**
 * Script to convert all page components to use lazy loading
 * Usage: node scripts/convert-pages-to-lazy.js
 */

const pagesToConvert = [
  {
    file: 'pages/ncds-screening/index.js',
    component: 'NcdsScreeningComp',
    lazyComponent: 'LazyNcdsScreeningComp'
  },
  {
    file: 'pages/pregnant-report/index.js',
    component: 'PregnantReportComp',
    lazyComponent: 'LazyPregnantReportComp'
  },
  {
    file: 'pages/news/index.js',
    component: 'NewsComp',
    lazyComponent: 'LazyNewsComp'
  },
  {
    file: 'pages/three-doc/index.js',
    component: 'ThreeDocComp',
    lazyComponent: 'LazyThreeDocComp'
  },
  {
    file: 'pages/access-control/index.js',
    component: 'AccessControlComp',
    lazyComponent: 'LazyAccessControlComp'
  },
  {
    file: 'pages/access-control/edit/index.js',
    component: 'ManageAccess',
    lazyComponent: 'LazyAccessControlEditComp'
  },
  {
    file: 'pages/user-list/index.js',
    component: 'UserListComp',
    lazyComponent: 'LazyUserListComp'
  },
  {
    file: 'pages/osm-health/index.js',
    component: 'OsmHealthComp',
    lazyComponent: 'LazyOsmHealthComp'
  },
  {
    file: 'pages/osm-points/index.js',
    component: 'OsmPointsComp',
    lazyComponent: 'LazyOsmPointsComp'
  },
  {
    file: 'pages/osm-points/redeem/index.js',
    component: 'RedeemComp',
    lazyComponent: 'LazyRedeemComp'
  },
  {
    file: 'pages/osm-points/shipping/index.js',
    component: 'ShippingComp',
    lazyComponent: 'LazyShippingComp'
  },
  {
    file: 'pages/atk-report/index.js',
    component: 'AtkReportComp',
    lazyComponent: 'LazyAtkReportComp'
  },
  {
    file: 'pages/report-osm1/data/index.js',
    component: 'Reportosm1DataComp',
    lazyComponent: 'LazyReportOsm1DataComp'
  },
  {
    file: 'pages/report-osm1/gis/index.js',
    component: 'GisComp',
    lazyComponent: 'LazyGisOsm1Comp'
  },
  {
    file: 'pages/report-mosquito/data/index.js',
    component: 'ReportMosquitoCompDataComp',
    lazyComponent: 'LazyReportMosquitoDataComp'
  },
  {
    file: 'pages/report-mosquito/gis/index.js',
    component: 'GisMosquitoComp',
    lazyComponent: 'LazyGisMosquitoComp'
  }
];

function convertPageToLazy(pageInfo) {
  const filePath = path.join(__dirname, '..', pageInfo.file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${pageInfo.file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already converted
  if (content.includes('LazyComponents')) {
    console.log(`⏭️  Already converted: ${pageInfo.file}`);
    return;
  }

  // Replace import
  const importRegex = new RegExp(`import ${pageInfo.component} from .*${pageInfo.component}.*`);
  content = content.replace(
    importRegex,
    `import { useEffect, Suspense } from "react";\nimport { useLoading } from "@context/LoadingProvider";\nimport { ${pageInfo.lazyComponent} } from "@/components/shared/LazyComponents";\nimport { ComponentLoadingSpinner } from "@/components/shared/LoadingSpinner";`
  );

  // Remove old react import if exists
  content = content.replace(/import\s+{\s*useEffect\s*}\s+from\s+["']react["'];?\n/g, '');

  // Replace component usage
  const usageRegex = new RegExp(`return <${pageInfo.component}([^>]*)/>`, 'g');
  content = content.replace(
    usageRegex,
    `return (\n    <Suspense fallback={<ComponentLoadingSpinner />}>\n      <${pageInfo.lazyComponent}$1/>\n    </Suspense>\n  )`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Converted: ${pageInfo.file}`);
}

console.log('🚀 Starting conversion to lazy loading...\n');

pagesToConvert.forEach(pageInfo => {
  convertPageToLazy(pageInfo);
});

console.log('\n✨ Conversion complete!');
console.log('\n📝 Next steps:');
console.log('1. Run: bun run dev');
console.log('2. Test all pages to ensure lazy loading works');
console.log('3. Check browser DevTools Network tab to verify code splitting');
