import dotenv from 'dotenv';
dotenv.config();

import { query } from '../db';

// v2 API — requires a free subscription key from https://portal-api.digitransit.fi/
const DIGITRANSIT_URL =
  'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';

const GQL_QUERY = `
{
  stops {
    gtfsId
    name
    code
    lat
    lon
  }
}
`;

interface Stop {
  gtfsId: string;
  name: string;
  code: string | null;
  lat: number;
  lon: number;
}

interface DigitransitResponse {
  data?: {
    stops: Stop[];
  };
  errors?: Array<{ message: string }>;
}

async function fetchStops(): Promise<Stop[]> {
  const apiKey = process.env.DIGITRANSIT_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DIGITRANSIT_API_KEY is not set.\n' +
        'Register for a free key at https://portal-api.digitransit.fi/ ' +
        'then add DIGITRANSIT_API_KEY=<your-key> to backend/.env'
    );
  }

  console.log('Fetching stops from HSL Digitransit v2...');

  const res = await fetch(DIGITRANSIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'digitransit-subscription-key': apiKey,
    },
    body: JSON.stringify({ query: GQL_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`Digitransit API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as DigitransitResponse;

  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  if (!json.data?.stops) {
    throw new Error('Unexpected response shape — missing data.stops');
  }

  return json.data.stops;
}

const UPSERT_SQL = `
  INSERT INTO stops (gtfs_id, name, code, vehicle_type, location)
  VALUES (
    $1, $2, $3, $4,
    ST_SetSRID(ST_MakePoint($5, $6), 4326)
  )
  ON CONFLICT (gtfs_id) DO UPDATE SET
    name         = EXCLUDED.name,
    code         = EXCLUDED.code,
    vehicle_type = EXCLUDED.vehicle_type,
    location     = EXCLUDED.location
`;

async function seed() {
  const stops = await fetchStops();
  console.log(`Fetched ${stops.length} stops. Starting upsert...`);

  let upserted = 0;

  for (const stop of stops) {
    await query(UPSERT_SQL, [
      stop.gtfsId,
      stop.name,
      stop.code ?? null,
      null, // vehicleType moved to route patterns in Digitransit v2
      stop.lon,
      stop.lat,
    ]);

    upserted++;

    if (upserted % 500 === 0) {
      console.log(`  Progress: ${upserted} / ${stops.length}`);
    }
  }

  const result = await query<{ count: string }>('SELECT COUNT(*) FROM stops');
  console.log(`Done. Total stops in DB: ${result.rows[0].count}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
