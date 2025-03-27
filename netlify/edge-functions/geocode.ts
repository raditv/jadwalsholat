import { Config } from '@netlify/edge-functions';

export default async (request: Request) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Get parameters
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const q = searchParams.get('q');
  
  let osmUrl: string;
  
  if (lat && lon) {
    // Reverse geocoding
    osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
  } else if (q) {
    // Search by query
    osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
  } else {
    return new Response('Missing parameters', { status: 400 });
  }

  try {
    const response = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'Prayer Times App',
        'Accept-Language': 'en'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

export const config: Config = {
  path: '/api/geocode'
}; 