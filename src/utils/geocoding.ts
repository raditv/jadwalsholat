export async function getCityName(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'User-Agent': 'Prayer Times App (https://github.com/your-repo)', // Required by Nominatim's terms of use
          'Accept-Language': 'en' // Request English results
        }
      }
    );
    
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return 'Unknown Location';
    }
    
    const data = await response.json();
    
    if (!data || !data.address) {
      console.warn('No address data received from geocoding service');
      return 'Unknown Location';
    }

    // Try to get the most specific location name available
    const locationName = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.suburb ||
                        data.address.county ||
                        data.address.state ||
                        'Unknown Location';

    // Cache the result for future use
    try {
      localStorage.setItem(`cityName_${latitude}_${longitude}`, locationName);
    } catch (e) {
      console.warn('Failed to cache city name:', e);
    }

    return locationName;
  } catch (error) {
    console.error('Error fetching city name:', error);
    
    // Try to get cached value if available
    try {
      const cachedName = localStorage.getItem(`cityName_${latitude}_${longitude}`);
      if (cachedName) {
        return cachedName;
      }
    } catch (e) {
      console.warn('Failed to retrieve cached city name:', e);
    }
    
    return 'Unknown Location';
  }
}