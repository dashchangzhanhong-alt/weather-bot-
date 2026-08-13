import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '37.7749');
  const lon = parseFloat(searchParams.get('lon') || '-122.4194');

  const weatherApiKey = process.env.OPENWEATHER_API_KEY || '';
  const astroAppId = process.env.ASTRONOMY_APP_ID || '';
  const astroAppSecret = process.env.ASTRONOMY_APP_SECRET || '';

  let weatherData = null;
  let astronomyData = null;

  // 1. Fetch OpenWeather Data
  try {
    if (weatherApiKey) {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`
      );
      if (weatherRes.ok) weatherData = await weatherRes.json();
    }
  } catch (err) {
    console.error('Weather fetch error:', err);
  }

  // Fallback Mock Weather Data
  if (!weatherData) {
    weatherData = {
      name: 'Kampong Baharu Balakong',
      main: { temp: 30, feels_like: 32, temp_max: 30, temp_min: 30, humidity: 61 },
      weather: [{ description: 'overcast clouds' }],
      wind: { speed: 0.41, deg: 75 },
      visibility: 10000,
    };
  }

  // 2. Fetch Astronomy API Star Chart
  try {
    if (astroAppId && astroAppSecret) {
      const authHeader = 'Basic ' + Buffer.from(`${astroAppId}:${astroAppSecret}`).toString('base64');
      const today = new Date().toISOString().split('T')[0];

      const astroRes = await fetch('https://api.astronomyapi.com/api/v2/studio/star-chart', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: 'navy',
          observer: { latitude: lat, longitude: lon, date: today },
          view: { type: 'area', parameters: { position: { equatorial: { rightAscension: 0, declination: 0 } }, zoom: 3 } }
        }),
      });

      if (astroRes.ok) {
        astronomyData = await astroRes.json();
      }
    }
  } catch (err) {
    console.error('Astronomy fetch error:', err);
  }

  // Fallback Dynamic Sky Chart URL
  const starChartUrl = astronomyData?.data?.imageUrl || 
    `https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/spherical_sky_map.png`;

  return NextResponse.json({
    weather: weatherData,
    astronomy: { imageUrl: starChartUrl },
  });
}