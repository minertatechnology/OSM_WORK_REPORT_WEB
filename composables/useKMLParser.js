import { useRef, useCallback } from 'react';

/**
 * Hook สำหรับ parse KML โดยใช้ Web Worker
 * ไม่ block main thread ทำให้ UI ไม่แฮง
 */
export const useKMLParser = () => {
  const workerRef = useRef(null);
  const pendingCallbacks = useRef(new Map());
  const requestId = useRef(0);

  // สร้าง worker ตอนใช้ครั้งแรก
  const getWorker = useCallback(() => {
    if (!workerRef.current && typeof window !== 'undefined') {
      try {
        // ใช้ inline worker เพื่อหลีกเลี่ยงปัญหา CORS
        const workerCode = `
          self.addEventListener('message', async (e) => {
            const { type, kmlText, id } = e.data;

            try {
              if (type === 'PARSE_KML') {
                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(kmlText, 'text/xml');

                // แปลง KML เป็น GeoJSON แบบง่าย
                const placemarks = kmlDoc.getElementsByTagName('Placemark');
                const features = [];

                for (let i = 0; i < placemarks.length; i++) {
                  const placemark = placemarks[i];
                  const name = placemark.getElementsByTagName('name')[0]?.textContent;
                  const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent;

                  if (coordinates) {
                    const coords = coordinates.trim().split(/\\s+/).map(coord => {
                      const [lon, lat] = coord.split(',').map(Number);
                      return [lon, lat];
                    });

                    features.push({
                      type: 'Feature',
                      properties: { name },
                      geometry: {
                        type: coords.length > 1 ? 'Polygon' : 'Point',
                        coordinates: coords.length > 1 ? [coords] : coords[0]
                      }
                    });
                  }
                }

                const geoJson = {
                  type: 'FeatureCollection',
                  features
                };

                self.postMessage({
                  type: 'PARSE_SUCCESS',
                  id,
                  geoJson,
                });
              }
            } catch (error) {
              self.postMessage({
                type: 'PARSE_ERROR',
                id,
                error: error.message,
              });
            }
          });
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        workerRef.current = new Worker(workerUrl);

        // ฟัง message จาก worker
        workerRef.current.onmessage = (e) => {
          const { type, id, geoJson, error } = e.data;
          const callback = pendingCallbacks.current.get(id);

          if (callback) {
            if (type === 'PARSE_SUCCESS') {
              callback.resolve(geoJson);
            } else if (type === 'PARSE_ERROR') {
              callback.reject(new Error(error));
            }
            pendingCallbacks.current.delete(id);
          }
        };

        // Cleanup URL
        URL.revokeObjectURL(workerUrl);
      } catch (error) {
        console.error('Failed to create worker:', error);
        return null;
      }
    }
    return workerRef.current;
  }, []);

  /**
   * Parse KML text เป็น GeoJSON
   * @param {string} kmlText - KML content
   * @returns {Promise<Object>} GeoJSON object
   */
  const parseKML = useCallback(async (kmlText) => {
    const worker = getWorker();

    // ถ้าไม่มี worker ให้ fallback เป็น synchronous parsing
    if (!worker) {
      return fallbackParse(kmlText);
    }

    const id = requestId.current++;

    return new Promise((resolve, reject) => {
      pendingCallbacks.current.set(id, { resolve, reject });

      // ส่ง message ไป worker
      worker.postMessage({
        type: 'PARSE_KML',
        kmlText,
        id,
      });

      // Timeout หลัง 30 วินาที
      setTimeout(() => {
        if (pendingCallbacks.current.has(id)) {
          pendingCallbacks.current.delete(id);
          reject(new Error('KML parsing timeout'));
        }
      }, 30000);
    });
  }, [getWorker]);

  // Fallback parsing ถ้า worker ไม่ทำงาน
  const fallbackParse = (kmlText) => {
    try {
      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlText, 'text/xml');

      const placemarks = kmlDoc.getElementsByTagName('Placemark');
      const features = [];

      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        const name = placemark.getElementsByTagName('name')[0]?.textContent;
        const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent;

        if (coordinates) {
          const coords = coordinates.trim().split(/\s+/).map(coord => {
            const [lon, lat] = coord.split(',').map(Number);
            return [lon, lat];
          });

          features.push({
            type: 'Feature',
            properties: { name },
            geometry: {
              type: coords.length > 1 ? 'Polygon' : 'Point',
              coordinates: coords.length > 1 ? [coords] : coords[0]
            }
          });
        }
      }

      return Promise.resolve({
        type: 'FeatureCollection',
        features
      });
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Cleanup worker เมื่อ unmount
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingCallbacks.current.clear();
  }, []);

  return {
    parseKML,
    cleanup,
  };
};
