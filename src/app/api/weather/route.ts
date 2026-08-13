import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '3.1390';
  const lon = searchParams.get('lon') || '101.6869';

  // Fallback read from process.env
  let weatherApiKey = process.env.OPENWEATHER_API_KEY;
  let astronomyAppId = process.env.ASTRONOMY_APP_ID;
  let astronomySecret = process.env.ASTRONOMY_APP_SECRET;

  // Retrieve runtime environment variables from Cloudflare context
  try {
    const { env } = await getCloudflareContext();
    if (env) {
      weatherApiKey = (env as Record<string, string>).OPENWEATHER_API_KEY || weatherApiKey;
      astronomyAppId = (env as Record<string, string>).ASTRONOMY_APP_ID || astronomyAppId;
      astronomySecret = (env as Record<string, string>).ASTRONOMY_APP_SECRET || astronomySecret;
    }
  } catch (e) {
    console.warn('Could not read Cloudflare context:', e);
  }

  if (!weatherApiKey) {
    return NextResponse.json(
      { error: 'OPENWEATHER_API_KEY is undefined in runtime environment variables.' },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch OpenWeather Data
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey.trim()}`
    );
    const weatherData = await weatherRes.json();

    if (!weatherRes.ok) {
      return NextResponse.json(
        { error: `OpenWeather returned error: ${weatherData.message}` },
        { status: weatherRes.status }
      );
    }

    // 2. Fetch Astronomy Star Chart
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
        console.error('Astronomy API error:', e);
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
