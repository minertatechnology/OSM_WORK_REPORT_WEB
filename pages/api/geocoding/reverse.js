/**
 * API route to proxy Nominatim reverse geocoding requests
 * This is needed because browsers cannot set User-Agent header required by Nominatim
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon } = req.query;

  // Validate parameters
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat or lon parameter' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid lat or lon parameter' });
  }

  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
  }

  try {
    // Note: Nominatim has strict usage policies:
    // - Maximum 1 request per second
    // - Requires valid User-Agent with contact info
    // - May block requests from known hosting providers
    // Consider using a commercial geocoding service for production use

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=th&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OSM_WORK_REPORT_WEB_ADMIN/1.0', // Required by Nominatim
        'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
    });

    if (!response.ok) {
      // Log the error but return a graceful failure response
      console.warn(`Nominatim API returned status ${response.status} for coordinates: ${latitude}, ${longitude}`);

      // Return empty result instead of error to prevent breaking the UI
      return res.status(200).json({
        error: `Geocoding service unavailable (status ${response.status})`,
        display_name: null,
        address: {}
      });
    }

    const data = await response.json();

    // Return the data
    res.status(200).json(data);
  } catch (error) {
    console.error('Geocoding proxy error:', error.message);

    // Return empty result instead of error to prevent breaking the UI
    res.status(200).json({
      error: 'Geocoding service unavailable',
      display_name: null,
      address: {}
    });
  }
}
