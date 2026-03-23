import { Router, Request, Response } from 'express';

const router = Router();

const DIGITRANSIT_URL = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';

interface StoptimeRaw {
  scheduledDeparture: number;
  realtimeArrival: number;
  realtime: boolean;
  realtimeDeparture: number;
  departureDelay: number;
  headsign: string;
  trip: {
    routeShortName: string;
    route: {
      mode: string;
    };
  };
}

interface DigitransitResponse {
  data?: {
    stop: {
      name: string;
      stoptimesWithoutPatterns: StoptimeRaw[];
    } | null;
  };
  errors?: Array<{ message: string }>;
}

function secondsToHHMM(seconds: number): string {
  // seconds-from-midnight may exceed 86400 for next-day trips — wrap correctly
  const s = seconds % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// GET /api/departures/:gtfsId
router.get('/:gtfsId', async (req: Request, res: Response) => {
  const { gtfsId } = req.params;
  const apiKey = process.env.DIGITRANSIT_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'DIGITRANSIT_API_KEY not configured' });
    return;
  }

  const gql = `
    {
      stop(id: "${gtfsId}") {
        name
        stoptimesWithoutPatterns(numberOfDepartures: 8) {
          scheduledDeparture
          realtimeArrival
          realtime
          realtimeDeparture
          departureDelay
          headsign
          trip {
            routeShortName
            route {
              mode
            }
          }
        }
      }
    }
  `;

  try {
    const upstream = await fetch(DIGITRANSIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'digitransit-subscription-key': apiKey,
      },
      body: JSON.stringify({ query: gql }),
    });

    if (!upstream.ok) {
      res.status(502).json({ error: `Digitransit error: ${upstream.status}` });
      return;
    }

    const json = (await upstream.json()) as DigitransitResponse;

    if (json.errors?.length) {
      res.status(502).json({ error: json.errors.map((e) => e.message).join(', ') });
      return;
    }

    if (!json.data?.stop) {
      res.status(404).json({ error: `Stop ${gtfsId} not found` });
      return;
    }

    const { stoptimesWithoutPatterns } = json.data.stop;

    const departures = stoptimesWithoutPatterns.map((s) => ({
      route: s.trip.routeShortName,
      headsign: s.headsign,
      scheduledDeparture: secondsToHHMM(s.scheduledDeparture),
      realtimeDeparture: secondsToHHMM(s.realtimeDeparture),
      realtime: s.realtime,
      delay: Math.round(s.departureDelay / 60), // seconds → minutes
      mode: s.trip.route.mode,
    }));

    res.json(departures);
  } catch (err) {
    console.error('departures route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
