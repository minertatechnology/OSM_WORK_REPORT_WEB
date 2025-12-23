// User Service for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const getUsersList = async ({
  page = 1,
  per_page = 10,
  keyword = '',
  is_active = null,
  province_code = '',
  district_code = '',
  subdistrict_code = '',
  token
}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', per_page);
    
    if (keyword) params.append('keyword', keyword);
    if (is_active !== null) params.append('is_active', is_active);
    if (province_code) params.append('province_code', province_code);
    if (district_code) params.append('district_code', district_code);
    if (subdistrict_code) params.append('subdistrict_code', subdistrict_code);

    const response = await fetch(`${API_BASE_URL}/auth/users?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
