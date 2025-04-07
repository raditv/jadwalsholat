export async function getCityName(latitude: number, longitude: number): Promise<string> {
  try {
    // Try to get cached value first
    const cachedName = localStorage.getItem(`cityName_${latitude}_${longitude}`);
    if (cachedName) {
      return cachedName;
    }

    // Use Nominatim API from OpenStreetMap
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'JadwalSholat/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.address) {
      throw new Error('No address data received');
    }

    // Try to get the most specific location name available
    const locationName = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.suburb ||
                        data.address.county ||
                        data.address.state ||
                        'Unknown Location';

    // Cache the result
    localStorage.setItem(`cityName_${latitude}_${longitude}`, locationName);
    return locationName;
  } catch (error) {
    console.error('Error fetching city name:', error);
    
    // Return cached value if available
    const cachedName = localStorage.getItem(`cityName_${latitude}_${longitude}`);
    if (cachedName) {
      return cachedName;
    }

    // Return default location name if everything fails
    return 'Unknown Location';
  }
}

export async function getCountry(latitude: number, longitude: number): Promise<string> {
  try {
    // Use Nominatim API from OpenStreetMap
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=0&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'JadwalSholat/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.address || !data.address.country) {
      throw new Error('No country data received');
    }

    return data.address.country;
  } catch (error) {
    console.error('Error fetching country:', error);
    return 'Unknown';
  }
}