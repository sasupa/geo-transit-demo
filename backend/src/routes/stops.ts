import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

interface StopRow {
  gtfs_id: string;
  name: string;
  code: string | null;
  vehicle_type: number | null;
  lng: number;
  lat: number;
}

// GET /api/stops?bbox=minLng,minLat,maxLng,maxLat
router.get('/', async (req: Request, res: Response) => {
  const { bbox } = req.query;

  if (!bbox || typeof bbox !== 'string') {
    res.status(400).json({ error: 'bbox query parameter is required (minLng,minLat,maxLng,maxLat)' });
    return;
  }

  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    res.status(400).json({ error: 'bbox must be four comma-separated numbers: minLng,minLat,maxLng,maxLat' });
    return;
  }

  const [minLng, minLat, maxLng, maxLat] = parts;

  const sql = `
    SELECT gtfs_id, name, code, vehicle_type,
           ST_X(location::geometry) as lng,
           ST_Y(location::geometry) as lat
    FROM stops
    WHERE ST_Within(location::geometry, ST_MakeEnvelope($1,$2,$3,$4, 4326))
    LIMIT 200
  `;

  try {
    const result = await query<StopRow>(sql, [minLng, minLat, maxLng, maxLat]);

    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map((row) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [row.lng, row.lat],
        },
        properties: {
          gtfs_id: row.gtfs_id,
          name: row.name,
          code: row.code,
          vehicle_type: row.vehicle_type,
        },
      })),
    };

    res.json(geojson);
  } catch (err) {
    console.error('stops query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
