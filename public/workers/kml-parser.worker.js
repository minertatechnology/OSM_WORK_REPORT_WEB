// Web Worker สำหรับ parse KML files
// ทำงานแยกจาก main thread เพื่อไม่ให้ UI แฮง

importScripts('https://unpkg.com/@mapbox/togeojson@0.16.2/togeojson.js');

self.addEventListener('message', async (e) => {
  const { type, kmlText, id } = e.data;

  try {
    if (type === 'PARSE_KML') {
      // Parse XML
      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlText, 'text/xml');

      // แปลงเป็น GeoJSON
      const geoJson = toGeoJSON.kml(kmlDoc);

      // ส่งผลลัพธ์กลับไป main thread
      self.postMessage({
        type: 'PARSE_SUCCESS',
        id,
        geoJson,
      });
    }
  } catch (error) {
    // ส่ง error กลับไป
    self.postMessage({
      type: 'PARSE_ERROR',
      id,
      error: error.message,
    });
  }
});
