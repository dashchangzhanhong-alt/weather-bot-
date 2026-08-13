import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '3.1390';
  const lon = searchParams.get('lon') || '101.6869';

  // 1. Primary lookup: process.env or direct key fallback
  let weatherApiKey =
    process.env.OPENWEATHER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
    'b52a19c344c113f519e14c88f759332a';

  let astronomyAppId =
    process.env.ASTRONOMY_APP_ID ||
    '6856ea4a-0a98-4738-8106-1aaf19d0a319';

  let astronomySecret =
    process.env.ASTRONOMY_APP_SECRET ||
    '0e55f390003af81264f23feba597e515d27db79a4c53dcaf28';

  // 2. Cloudflare runtime context lookup
  try {
    const { env } = await getCloudflareContext();
    if (env) {
      const cfEnv = env as Record<string, string>;
      if (cfEnv.OPENWEATHER_API_KEY) weatherApiKey = cfEnv.OPENWEATHER_API_KEY;
      if (cfEnv.ASTRONOMY_APP_ID) astronomyAppId = cfEnv.ASTRONOMY_APP_ID;
      if (cfEnv.ASTRONOMY_APP_SECRET) astronomySecret = cfEnv.ASTRONOMY_APP_SECRET;
    }
  } catch (e) {
    console.warn('Cloudflare context fallback:', e);
  }

  try {
    // Fetch OpenWeather Data
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey.trim()}`
    );
    const weatherData = await weatherRes.json();

    if (!weatherRes.ok) {
      return NextResponse.json(
        { error: `OpenWeather API error: ${weatherData.message}` },
        { status: weatherRes.status }
      );
    }

    // Fetch Star Chart
    let starChartUrl = null;
    if (astronomyAppId && astronomySecret) {
      try {
        const authHeader = `Basic ${btoa(`${astronomyAppId.trim()}:${astronomySecret.trim()}`)}`;
        const currentDate = new Date().toISOString().split('T')[0];

        const astroRes = await fetch('https://api.astronomyapi.com/api/v2/studio/star-chart', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
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

        if (astroRes.ok) {
          const astroData = await astroRes.json();
          starChartUrl = astroData?.data?.imageUrl || null;
        }
      } catch (e) {
        console.error('Astronomy API fetch failed:', e);
      }
    }

    return NextResponse.json({
      location: weatherData.name || 'Kuala Lumpur',
      weather: weatherData,
      starChartUrl: starChartUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
