# Geocoding Service

This directory contains utilities for reverse geocoding (converting GPS coordinates to addresses).

## Current Implementation

- **Service**: OpenStreetMap Nominatim (Free)
- **API Route**: `/api/geocoding/reverse`
- **Rate Limit**: 1 request per second
- **Known Issues**:
  - Nominatim may return 403 errors when called from certain hosting providers
  - Strict usage policies require proper User-Agent headers
  - Not recommended for high-volume production use

## How It Works

1. Client calls `getAddressFromCoordinates(lat, lng)` from `utils/geocoding.js`
2. Request goes to Next.js API route `/api/geocoding/reverse`
3. API route proxies to Nominatim with proper headers
4. Address data is returned to the client

The proxy is necessary because browsers cannot set the `User-Agent` header required by Nominatim.

## Error Handling

The service is designed to fail gracefully:
- If geocoding fails, the app continues to work without address data
- Errors are logged but don't break the UI
- Users can still use all features; location filters just won't be populated from GPS

## Alternative Solutions for Production

If you encounter 403 errors or need more reliable service, consider:

### 1. **Google Maps Geocoding API** (Recommended)
```javascript
// Add to .env
GOOGLE_MAPS_API_KEY=your_api_key_here

// Update pages/api/geocoding/reverse.js
const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=th`;
```
- Pricing: $5 per 1,000 requests (first $200/month free)
- Reliable, fast, good Thai address data

### 2. **Mapbox Geocoding API**
```javascript
// Add to .env
MAPBOX_ACCESS_TOKEN=your_token_here

// Update pages/api/geocoding/reverse.js
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&language=th`;
```
- Pricing: 100,000 free requests/month, then $0.50 per 1,000
- Good international coverage

### 3. **Self-hosted Nominatim**
- Download and run your own Nominatim server
- No rate limits or API restrictions
- Requires server resources and maintenance

## Usage Example

```javascript
import { getAddressFromCoordinates } from '@utils/geocoding';

const result = await getAddressFromCoordinates(13.7563, 100.5018);

if (result.success) {
  console.log(result.province);    // "กรุงเทพมหานคร"
  console.log(result.district);    // "เขตปทุมวัน"
  console.log(result.subdistrict); // "แขวงปทุมวัน"
  console.log(result.fullAddress); // Full address string
} else {
  console.log(result.error); // Error message
}
```

## Notes

- Always respect rate limits (1 req/sec for Nominatim)
- The code includes 1.1 second delays between requests
- For batch operations, use `batchGeocode()` which handles delays automatically
