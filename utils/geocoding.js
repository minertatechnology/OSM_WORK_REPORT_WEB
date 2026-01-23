/**
 * Geocoding utilities for converting coordinates to address information
 * Using OpenStreetMap Nominatim API (Free)
 */

/**
 * Get address information from latitude and longitude coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Address information including province, district, subdistrict
 */
export async function getAddressFromCoordinates(lat, lng) {
  try {
    // Validate input
    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    // Use our Next.js API route as a proxy to Nominatim
    // This is needed because browsers cannot set User-Agent header required by Nominatim
    const url = `/api/geocoding/reverse?lat=${lat}&lon=${lng}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    // Check if the API returned an error (graceful failure from our proxy)
    if (data.error) {
      console.warn(`   ⚠️  Geocoding service issue: ${data.error}`);
      return {
        success: false,
        error: data.error,
        province: null,
        district: null,
        subdistrict: null,
        fullAddress: null,
      };
    }

    if (!data || !data.address) {
      console.warn('   ⚠️  No address data returned from geocoding service');
      return {
        success: false,
        error: 'No address found for the given coordinates',
        province: null,
        district: null,
        subdistrict: null,
        fullAddress: null,
      };
    }

    // Extract address components
    const address = data.address || {};
    const displayName = data.display_name || '';

    let province = null;
    let district = null;
    let subdistrict = null;

    // กรุงเทพมหานคร และปริมณฑล มีโครงสร้างพิเศษ
    // - city = กรุงเทพมหานคร (จังหวัด)
    // - city_district = เขตบางเขน (อำเภอ/เขต)
    // - suburb = แขวงท่าแร้ง (ตำบล/แขวง)

    // จังหวัดอื่นๆ
    // - province/state = ชื่อจังหวัด
    // - county = อำเภอ
    // - village/suburb/neighbourhood = ตำบล

    // ตรวจสอบว่าเป็นกรุงเทพฯ หรือไม่
    const isBangkok = (address.city && (address.city.includes('กรุงเทพ') || address.city.includes('Bangkok'))) ||
                      (address.state && (address.state.includes('กรุงเทพ') || address.state.includes('Bangkok'))) ||
                      (address.county && (address.county.includes('กรุงเทพ') || address.county.includes('Bangkok')));

    if (isBangkok) {
      // โครงสร้างสำหรับกรุงเทพมหานคร
      // จังหวัด = กรุงเทพมหานคร
      province = address.city || address.state || address.county || 'กรุงเทพมหานคร';

      // อำเภอ/เขต = เขตบางเขน
      // สำหรับกรุงเทพ ลองหาจากหลายแหล่ง
      if (address.city_district) {
        district = address.city_district;
      } else if (address.county && address.county.includes('เขต')) {
        district = address.county;
      } else if (address.municipality) {
        district = address.municipality;
      } else if (address.suburb && address.suburb.includes('เขต')) {
        // ถ้า suburb มีคำว่า "เขต" อาจเป็นชื่อเขต
        district = address.suburb;
      } else {
        // ถ้าหาไม่เจอจากทุก field ลองแยกจาก display_name
        const parts = displayName.split(',').map(p => p.trim());
        // หาส่วนที่มีคำว่า "เขต"
        const districtPart = parts.find(p => p.includes('เขต'));
        district = districtPart || null;
      }

      // ตำบล/แขวง = แขวงท่าแร้ง
      // สำหรับกรุงเทพ แขวง มักอยู่ใน suburb หรือ neighbourhood
      if (address.suburb && !address.suburb.includes('เขต')) {
        subdistrict = address.suburb;
      } else if (address.neighbourhood && !address.neighbourhood.includes('เขต')) {
        subdistrict = address.neighbourhood;
      } else if (address.quarter) {
        subdistrict = address.quarter;
      } else if (address.village) {
        subdistrict = address.village;
      } else {
        // ลองหาจาก display_name ถ้าหาไม่เจอ
        const parts = displayName.split(',').map(p => p.trim());
        // หาส่วนที่มีคำว่า "แขวง"
        const subdistrictPart = parts.find(p => p.includes('แขวง'));
        subdistrict = subdistrictPart || null;
      }
    } else {
      // โครงสร้างสำหรับจังหวัดอื่นๆ
      province = address.province || address.state || address.region || null;
      district = address.county || address.city_district || address.municipality || address.city || null;
      subdistrict = address.suburb || address.village || address.neighbourhood || address.quarter || null;
    }

    return {
      success: true,
      province,
      district,
      subdistrict,
      fullAddress: displayName,
      rawData: data, // Include raw data for debugging or additional info
    };
  } catch (error) {
    console.error('   ❌ Geocoding error:', error);
    return {
      success: false,
      error: error.message,
      province: null,
      district: null,
      subdistrict: null,
      fullAddress: null,
    };
  }
}

/**
 * Get address with retry logic for better reliability
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<Object>} Address information
 */
export async function getAddressWithRetry(lat, lng, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await getAddressFromCoordinates(lat, lng);

      if (result.success) {
        return result;
      }

      lastError = result.error;

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    } catch (error) {
      lastError = error.message;

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError || 'Failed to get address after multiple attempts',
    province: null,
    district: null,
    subdistrict: null,
    fullAddress: null,
  };
}

/**
 * Batch geocoding for multiple coordinates
 * @param {Array<{lat: number, lng: number}>} coordinates - Array of coordinate objects
 * @param {number} delayMs - Delay between requests in milliseconds (default: 1000ms to respect rate limits)
 * @returns {Promise<Array<Object>>} Array of address information
 */
export async function batchGeocode(coordinates, delayMs = 1000) {
  const results = [];

  for (let i = 0; i < coordinates.length; i++) {
    const { lat, lng } = coordinates[i];
    const result = await getAddressFromCoordinates(lat, lng);
    results.push(result);

    // Add delay between requests to respect API rate limits
    // Nominatim has a limit of 1 request per second
    if (i < coordinates.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
