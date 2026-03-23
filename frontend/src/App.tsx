import Map from './components/Map';
import './index.css';

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      <header style={{
        height: 48,
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        paddingInline: 20,
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--bg-border)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: "'Fira Code', monospace",
          fontWeight: 600,
          fontSize: 15,
          color: 'var(--text)',
          letterSpacing: '0.02em',
        }}>
          geo-transit-demo
        </span>
        <span style={{
          marginLeft: 12,
          fontFamily: "'Fira Code', monospace",
          fontSize: 12,
          color: 'var(--accent)',
        }}>
          // Helsinki HSL
        </span>
      </header>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        <Map />
      </main>
    </div>
  );
}
