import { useEffect, useState } from 'react';

interface Departure {
  route: string;
  headsign: string;
  scheduledDeparture: string;
  realtimeDeparture: string;
  realtime: boolean;
  delay: number;
  mode: string;
}

interface Props {
  gtfsId: string;
  stopName: string;
  stopCode: string | null;
}

const MODE_COLORS: Record<string, string> = {
  BUS:    '#22C55E',
  TRAM:   '#3B82F6',
  SUBWAY: '#F97316',
  RAIL:   '#A855F7',
  FERRY:  '#06B6D4',
};

function routeBadgeColor(mode: string): string {
  return MODE_COLORS[mode?.toUpperCase()] ?? '#64748B';
}

function delayColor(delay: number): string {
  if (delay <= 0) return '#22C55E';
  if (delay <= 3) return '#EAB308';
  return '#EF4444';
}

const spinnerStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  border: '2px solid #334155',
  borderTopColor: '#22C55E',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  margin: '16px auto',
};

export default function StopPopup({ gtfsId, stopName, stopCode }: Props) {
  const [departures, setDepartures] = useState<Departure[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDepartures(null);
    setError(null);

    fetch(`/api/departures/${encodeURIComponent(gtfsId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json() as Promise<Departure[]>;
      })
      .then((data) => { if (!cancelled) setDepartures(data); })
      .catch((err) => { if (!cancelled) setError(String(err)); });

    return () => { cancelled = true; };
  }, [gtfsId]);

  return (
    <div style={{
      background: '#1E293B',
      color: '#F8FAFC',
      borderRadius: 10,
      minWidth: 340,
      maxWidth: 400,
      boxShadow: '0 10px 15px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      fontFamily: "'Fira Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{stopName}</span>
        {stopCode && (
          <span style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: 11,
            color: '#22C55E',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 4,
            padding: '1px 6px',
          }}>
            {stopCode}
          </span>
        )}
      </div>

      {/* Body */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {!departures && !error && (
        <div style={{ padding: '12px 14px', textAlign: 'center' }}>
          <div style={spinnerStyle} />
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 14px', color: '#EF4444', fontSize: 12 }}>
          {error}
        </div>
      )}

      {departures && departures.length === 0 && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: '#94A3B8' }}>
          No upcoming departures
        </div>
      )}

      {departures && departures.length > 0 && (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12,
        }}>
          <thead>
            <tr style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={thStyle}>Route</th>
              <th style={{ ...thStyle, textAlign: 'left', width: '100%' }}>Destination</th>
              <th style={thStyle}>Sched.</th>
              <th style={thStyle}>Live</th>
              <th style={thStyle}>Delay</th>
            </tr>
          </thead>
          <tbody>
            {departures.map((d, i) => (
              <tr key={i} style={{ borderTop: '1px solid #334155' }}>

                {/* Route badge */}
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    background: routeBadgeColor(d.mode),
                    color: '#fff',
                    fontFamily: "'Fira Code', monospace",
                    fontWeight: 700,
                    fontSize: 11,
                    borderRadius: 4,
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                  }}>
                    {d.route}
                  </span>
                </td>

                {/* Headsign */}
                <td style={{ ...tdStyle, textAlign: 'left', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.headsign}
                </td>

                {/* Scheduled */}
                <td style={{ ...tdStyle, fontFamily: "'Fira Code', monospace", whiteSpace: 'nowrap' }}>
                  {d.scheduledDeparture}
                </td>

                {/* Realtime */}
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  {d.realtime ? (
                    <span style={{ fontFamily: "'Fira Code', monospace", color: '#22C55E' }}>
                      {d.realtimeDeparture}
                      <span style={{
                        marginLeft: 3,
                        fontSize: 8,
                        background: '#22C55E',
                        color: '#0F172A',
                        borderRadius: 2,
                        padding: '0px 3px',
                        fontWeight: 700,
                        verticalAlign: 'middle',
                        letterSpacing: '0.05em',
                      }}>LIVE</span>
                    </span>
                  ) : (
                    <span style={{ color: '#64748B', fontFamily: "'Fira Code', monospace" }}>—</span>
                  )}
                </td>

                {/* Delay */}
                <td style={{ ...tdStyle, fontFamily: "'Fira Code', monospace", color: delayColor(d.delay), textAlign: 'center' }}>
                  {d.delay > 0 ? `+${d.delay}m` : d.delay < 0 ? `${d.delay}m` : '·'}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '5px 8px',
  fontWeight: 500,
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  textAlign: 'center',
  verticalAlign: 'middle',
};
