const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 jam dalam milliseconds
const RATE_LIMIT_DELAY = 1000; // 1 detik delay antara request

interface GeocodingCache {
  cityName: string;
  timestamp: number;
}

let lastRequestTime = 0;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCityName(latitude: number, longitude: number): Promise<string | null> {
  try {
    // Cek cache terlebih dahulu
    const cacheKey = `cityName_${latitude}_${longitude}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const cache: GeocodingCache = JSON.parse(cachedData);
      if (Date.now() - cache.timestamp < CACHE_DURATION) {
        return cache.cityName;
      }
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    // Fetch dari OpenStreetMap Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'User-Agent': 'PrayerTimesApp/1.0',
          'Accept-Language': 'en'
        }
      }
    );

    if (!response.ok) {
      return null; // Return null jika ada error HTTP
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      return null; // Return null jika tidak ada data
    }

    // Ambil nama kota dari hasil geocoding
    const cityName = data.address.city || 
                     data.address.town || 
                     data.address.village || 
                     data.address.suburb ||
                     data.address.county ||
                     data.address.state ||
                     'Unknown Location';

    // Simpan ke cache
    const cache: GeocodingCache = {
      cityName,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));

    return cityName;
  } catch (error) {
    console.error('Error fetching city name:', error);
    return null; // Return null jika ada error
  }
}