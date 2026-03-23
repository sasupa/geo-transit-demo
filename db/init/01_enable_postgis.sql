CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Stops table with geometry column
CREATE TABLE IF NOT EXISTS stops (
  id SERIAL PRIMARY KEY,
  gtfs_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20),
  vehicle_type INTEGER,
  location GEOMETRY(Point, 4326)
);

-- Spatial index for fast bbox queries
CREATE INDEX IF NOT EXISTS stops_location_idx ON stops USING GIST (location);
