import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '3.1390';
  const lon = searchParams.get('lon') || '101.6869';

  // Environment variables with hardcoded fallbacks
  const weatherApiKey =
    process.env.OPENWEATHER_API_KEY || 'b52a19c344c113f519e14c88f759332a';

  const astronomyAppId =
    process.env.ASTRONOMY_APP_ID || '6856ea4a-0a98-4738-8106-1aaf19d0a319';

  const astronomySecret =
    process.env.ASTRONOMY_APP_SECRET || '0e55f390003af81264f23feba597e515d27db79a4c53dcaf28';

  try {
    // 1. Fetch OpenWeather Current Weather Data
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`
    );
    const weatherData = await weatherRes.json();

    if (!weatherRes.ok) {
      return NextResponse.json(
        { error: `OpenWeather API error: ${weatherData.message}` },
        { status: weatherRes.status }
      );
    }

    // 2. Fetch Reverse Geocoding for City/State
    let cityName = weatherData.name || 'Kuala Lumpur';
    try {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${weatherApiKey}`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          cityName = geoData[0].state || geoData[0].name || weatherData.name;
        }
      }
    } catch (e) {
      console.error('Geo lookup error:', e);
    }

    // 3. Fetch Dynamic Star Chart (Includes Origin Header Fix)
    let starChartUrl = null;
    let astroDebug = null;

    if (astronomyAppId && astronomySecret) {
      try {
        const authHeader = `Basic ${btoa(`${astronomyAppId.trim()}:${astronomySecret.trim()}`)}`;
        const currentDate = new Date().toISOString().split('T')[0];

        const astroRes = await fetch('https://api.astronomyapi.com/api/v2/studio/star-chart', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Origin': 'https://weather-bot.dashchangzhanhong.workers.dev',
          },
          body: JSON.stringify({
            style: 'navy',
            observer: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
              date: currentDate,
            },
            view: {
              type: 'area',
              parameters: {
                position: {
                  equatorial: {
                    rightAscension: 0,
                    declination: 0,
                  },
                },
                zoom: 3,
              },
            },
          }),
        });

        const astroData = await astroRes.json();

        if (astroRes.ok) {
          starChartUrl = astroData?.data?.imageUrl || null;
        } else {
          astroDebug = { status: astroRes.status, response: astroData };
        }
      } catch (e: any) {
        astroDebug = { error: e.message };
      }
    }

    return NextResponse.json({
      location: cityName,
      weather: weatherData,
      starChartUrl: starChartUrl,
      astroDebug: astroDebug,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
